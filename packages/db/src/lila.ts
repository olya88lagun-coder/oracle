import { applyLilaRoll, canFinishLila, canRollLila, LILA_GOAL_CELL, LILA_MAX_MOVES, LILA_NOTE_MAX_CHARS, type LilaRollResult, type LilaTransition } from "@oracle/core";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { lilaGames, lilaMoves, type LilaGameStatus, type LilaMode } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

export type { LilaGameStatus, LilaMode } from "./schema";

export type LilaMoveRecord = {
  n: number;
  roll: number;
  from: number;
  landed: number;
  to: number;
  transition: LilaTransition;
  customDie: boolean;
  note: string | null;
  createdAt: Date;
};
export type LilaGameRecord = {
  id: string;
  userId: string;
  mode: LilaMode;
  status: LilaGameStatus;
  intention: string;
  position: number;
  movesCount: number;
  purchaseId: string | null;
  createdAt: Date;
  finishedAt: Date | null;
};
export type LilaGameWithMoves = LilaGameRecord & { moves: LilaMoveRecord[] };
export type ImportedMove = { roll: number; customDie: boolean; note: string | null };

const toGame = (row: typeof lilaGames.$inferSelect): LilaGameRecord => row;
const toMove = (row: typeof lilaMoves.$inferSelect): LilaMoveRecord => ({
  n: row.n,
  roll: row.roll,
  from: row.fromCell,
  landed: row.landedCell,
  to: row.toCell,
  transition: row.transition,
  customDie: row.customDie,
  note: row.note,
  createdAt: row.createdAt,
});

async function withMoves(db: Database, game: LilaGameRecord): Promise<LilaGameWithMoves> {
  const rows = await db.select().from(lilaMoves).where(eq(lilaMoves.gameId, game.id)).orderBy(asc(lilaMoves.n));
  return { ...game, moves: rows.map(toMove) };
}

// Одна активная партия на человека держится частичным уникальным индексом: вторая вставка просто ничего не вернёт
export async function createLilaGame(
  db: Database,
  p: { userId: string; intention: string; mode?: LilaMode; status?: "active" | "awaiting_payment" },
): Promise<{ ok: true; game: LilaGameRecord } | { ok: false; error: "active_exists" }> {
  const [row] = await db
    .insert(lilaGames)
    .values({ userId: p.userId, intention: p.intention, mode: p.mode ?? "free", status: p.status ?? "active" })
    .onConflictDoNothing()
    .returning();
  return row ? { ok: true, game: toGame(row) } : { ok: false, error: "active_exists" };
}

export async function getLilaGame(db: Database, gameId: string): Promise<LilaGameWithMoves | null> {
  if (!isUuid(gameId)) return null;
  const [row] = await db.select().from(lilaGames).where(eq(lilaGames.id, gameId)).limit(1);
  return row ? withMoves(db, toGame(row)) : null;
}

export async function getActiveLilaGame(db: Database, userId: string): Promise<LilaGameWithMoves | null> {
  if (!isUuid(userId)) return null;
  const [row] = await db
    .select()
    .from(lilaGames)
    .where(and(eq(lilaGames.userId, userId), eq(lilaGames.status, "active")))
    .limit(1);
  return row ? withMoves(db, toGame(row)) : null;
}

export async function listLilaGames(db: Database, userId: string): Promise<LilaGameRecord[]> {
  if (!isUuid(userId)) return [];
  const rows = await db
    .select()
    .from(lilaGames)
    .where(and(eq(lilaGames.userId, userId), inArray(lilaGames.status, ["active", "finished"])))
    .orderBy(desc(lilaGames.createdAt));
  return rows.map(toGame);
}

type MoveError = "not_found" | "not_active" | "limit" | "at_goal";

// Строка партии блокируется на время хода: два одновременных броска получают разные номера
export async function addLilaMove(
  db: Database,
  p: { gameId: string; userId: string; roll: number; customDie: boolean },
): Promise<{ ok: true; game: LilaGameWithMoves } | { ok: false; error: MoveError }> {
  if (!isUuid(p.gameId)) return { ok: false, error: "not_found" };
  const outcome = await db.transaction(async (tx): Promise<{ ok: true } | { ok: false; error: MoveError }> => {
    const [game] = await tx
      .select()
      .from(lilaGames)
      .where(and(eq(lilaGames.id, p.gameId), eq(lilaGames.userId, p.userId)))
      .limit(1)
      .for("update");
    if (!game) return { ok: false, error: "not_found" };
    if (game.status !== "active") return { ok: false, error: "not_active" };
    if (game.position === LILA_GOAL_CELL) return { ok: false, error: "at_goal" };
    if (!canRollLila({ position: game.position, movesCount: game.movesCount })) return { ok: false, error: "limit" };
    const result = applyLilaRoll(game.position, p.roll);
    const n = game.movesCount + 1;
    await tx.insert(lilaMoves).values({
      gameId: game.id,
      n,
      roll: result.roll,
      fromCell: result.from,
      landedCell: result.landed,
      toCell: result.to,
      transition: result.transition,
      customDie: p.customDie,
    });
    await tx.update(lilaGames).set({ position: result.to, movesCount: n }).where(eq(lilaGames.id, game.id));
    return { ok: true };
  });
  if (!outcome.ok) return outcome;
  return { ok: true, game: (await getLilaGame(db, p.gameId))! };
}

export async function saveLilaNote(db: Database, p: { gameId: string; userId: string; n: number; note: string | null }): Promise<boolean> {
  if (!isUuid(p.gameId) || (p.note !== null && p.note.length > LILA_NOTE_MAX_CHARS)) return false;
  return db.transaction(async (tx) => {
    const [game] = await tx
      .select({ id: lilaGames.id })
      .from(lilaGames)
      .where(and(eq(lilaGames.id, p.gameId), eq(lilaGames.userId, p.userId), eq(lilaGames.status, "active")))
      .limit(1);
    if (!game) return false;
    const updated = await tx
      .update(lilaMoves)
      .set({ note: p.note })
      .where(and(eq(lilaMoves.gameId, p.gameId), eq(lilaMoves.n, p.n)))
      .returning({ n: lilaMoves.n });
    return updated.length > 0;
  });
}

export async function finishLilaGame(
  db: Database,
  p: { gameId: string; userId: string; now: Date },
): Promise<{ ok: true; status: "finished" | "abandoned" } | { ok: false; error: "not_found" | "not_active" | "too_early" }> {
  if (!isUuid(p.gameId)) return { ok: false, error: "not_found" };
  return db.transaction(async (tx) => {
    const [game] = await tx
      .select()
      .from(lilaGames)
      .where(and(eq(lilaGames.id, p.gameId), eq(lilaGames.userId, p.userId)))
      .limit(1)
      .for("update");
    if (!game) return { ok: false, error: "not_found" } as const;
    if (game.status !== "active") return { ok: false, error: "not_active" } as const;
    const finishable = canFinishLila({ position: game.position, movesCount: game.movesCount });
    // Бесплатную партию можно закрыть и раньше, но в историю она не попадёт; платную — только по правилам
    if (!finishable && game.mode === "guided") return { ok: false, error: "too_early" } as const;
    const status = finishable ? "finished" : "abandoned";
    await tx.update(lilaGames).set({ status, finishedAt: p.now }).where(eq(lilaGames.id, game.id));
    return { ok: true, status } as const;
  });
}

// Перенос гостевой партии: броски воспроизводятся на сервере теми же правилами — присланному положению не верим
export async function importLilaGame(
  db: Database,
  p: { userId: string; intention: string; moves: readonly ImportedMove[]; replaceActive: boolean },
): Promise<{ ok: true; game: LilaGameWithMoves } | { ok: false; error: "active_exists" | "invalid" }> {
  if (p.moves.length > LILA_MAX_MOVES || p.moves.some((move) => move.note !== null && move.note.length > LILA_NOTE_MAX_CHARS)) return { ok: false, error: "invalid" };
  let position = 0;
  const results: LilaRollResult[] = [];
  try {
    for (const move of p.moves) {
      const result = applyLilaRoll(position, move.roll);
      results.push(result);
      position = result.to;
    }
  } catch {
    return { ok: false, error: "invalid" };
  }

  const gameId = await db.transaction(async (tx) => {
    if (p.replaceActive) {
      await tx
        .update(lilaGames)
        .set({ status: "abandoned", finishedAt: new Date() })
        .where(and(eq(lilaGames.userId, p.userId), eq(lilaGames.status, "active")));
    }
    const [row] = await tx
      .insert(lilaGames)
      .values({ userId: p.userId, intention: p.intention, mode: "free", status: "active", position, movesCount: results.length })
      .onConflictDoNothing()
      .returning({ id: lilaGames.id });
    if (!row) return null;
    if (results.length > 0) {
      await tx.insert(lilaMoves).values(
        results.map((result, index) => ({
          gameId: row.id,
          n: index + 1,
          roll: result.roll,
          fromCell: result.from,
          landedCell: result.landed,
          toCell: result.to,
          transition: result.transition,
          customDie: p.moves[index]!.customDie,
          note: p.moves[index]!.note,
        })),
      );
    }
    return row.id;
  });
  if (!gameId) return { ok: false, error: "active_exists" };
  return { ok: true, game: (await getLilaGame(db, gameId))! };
}
