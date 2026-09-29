import { isLilaRoll, LILA_MAX_MOVES } from "@oracle/core";
import { addLilaMove, createLilaGame, finishLilaGame, getActiveLilaGame, getLilaGameForUser, importLilaGame, saveLilaNote, type Database } from "@oracle/db";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { normalizeIntention, normalizeNote, toGameView, type GameSource, type GameView } from "../lib/lila-view";

export type LilaDeps = { db: Database; randomRoll: () => number; now: () => Date };
export type LilaError = "invalid" | "not_found" | "not_active" | "limit" | "at_goal" | "too_early" | "active_exists";
export type LilaResult = { ok: true; game: GameView } | { ok: false; error: LilaError };

const DICE_SIDES = 6;
export const defaultRandomRoll = (): number => randomInt(1, DICE_SIDES + 1);

const fail = (error: LilaError): LilaResult => ({ ok: false, error });
const ok = (game: GameSource): LilaResult => ({ ok: true, game: toGameView(game) });

export async function startGame(deps: LilaDeps, p: { userId: string; intention: unknown }): Promise<LilaResult> {
  const intention = normalizeIntention(p.intention);
  if (!intention) return fail("invalid");
  const created = await createLilaGame(deps.db, { userId: p.userId, intention });
  return created.ok ? ok({ ...created.game, moves: [] }) : fail(created.error);
}

// Бросок делает сервер; число от клиента принимается только как «свой кубик» и только 1–6
export async function rollGame(deps: LilaDeps, p: { userId: string; gameId: string; customRoll: unknown }): Promise<LilaResult> {
  const custom = p.customRoll !== undefined && p.customRoll !== null;
  if (custom && !isLilaRoll(p.customRoll)) return fail("invalid");
  const roll = custom ? (p.customRoll as number) : deps.randomRoll();
  const moved = await addLilaMove(deps.db, { gameId: p.gameId, userId: p.userId, roll, customDie: custom });
  return moved.ok ? ok(moved.game) : fail(moved.error);
}

export async function gameById(deps: LilaDeps, p: { userId: string; gameId: string }): Promise<LilaResult> {
  const game = await getLilaGameForUser(deps.db, p.gameId, p.userId);
  return game ? ok(game) : fail("not_found");
}

export async function saveNote(deps: LilaDeps, p: { userId: string; gameId: string; n: unknown; note: unknown }): Promise<LilaResult> {
  const note = normalizeNote(p.note);
  if (note === "invalid" || typeof p.n !== "number" || !Number.isInteger(p.n) || p.n < 1) return fail("invalid");
  if (!(await saveLilaNote(deps.db, { gameId: p.gameId, userId: p.userId, n: p.n, note }))) return fail("not_found");
  return gameById(deps, p);
}

export async function finishGame(deps: LilaDeps, p: { userId: string; gameId: string }): Promise<LilaResult> {
  const done = await finishLilaGame(deps.db, { gameId: p.gameId, userId: p.userId, now: deps.now() });
  return done.ok ? gameById(deps, p) : fail(done.error);
}

export async function activeGame(deps: LilaDeps, p: { userId: string }): Promise<GameView | null> {
  const game = await getActiveLilaGame(deps.db, p.userId);
  return game ? toGameView(game) : null;
}

const importSchema = z.object({
  intention: z.string(),
  moves: z.array(z.object({ roll: z.number(), custom: z.boolean(), note: z.string().nullable() })).max(LILA_MAX_MOVES),
});

export async function importGame(deps: LilaDeps, p: { userId: string; payload: unknown; replace: boolean }): Promise<LilaResult> {
  const parsed = importSchema.safeParse(p.payload);
  const intention = parsed.success ? normalizeIntention(parsed.data.intention) : null;
  if (!parsed.success || !intention) return fail("invalid");
  const notes = parsed.data.moves.map((move) => normalizeNote(move.note));
  if (notes.includes("invalid")) return fail("invalid");
  const imported = await importLilaGame(deps.db, {
    userId: p.userId,
    intention,
    moves: parsed.data.moves.map((move, index) => ({ roll: move.roll, customDie: move.custom, note: notes[index] as string | null })),
    replaceActive: p.replace,
  });
  return imported.ok ? ok(imported.game) : fail(imported.error);
}
