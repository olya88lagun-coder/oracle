import type { LilaConclusionChapterId } from "@oracle/core";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getLilaGame, type LilaGameRecord, type LilaGameWithMoves } from "./lila";
import { lilaConclusions, lilaGames, lilaMoves } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

export type StoredConclusionChapter = { id: LilaConclusionChapterId; source: "ai" | "fallback"; paragraphs: string[] };
export type StoredConclusion = { chapters: StoredConclusionChapter[]; createdAt: Date };

const UNIQUE_VIOLATION = "23505";
// Драйверы отдают код и в самой ошибке, и в cause (Drizzle оборачивает ошибки запроса)
const isUniqueViolation = (error: unknown): boolean =>
  (error as { code?: string })?.code === UNIQUE_VIOLATION || (error as { cause?: { code?: string } })?.cause?.code === UNIQUE_VIOLATION;

export async function getLilaGameByPurchase(db: Database, purchaseId: string): Promise<LilaGameWithMoves | null> {
  if (!isUuid(purchaseId)) return null;
  const [row] = await db.select({ id: lilaGames.id }).from(lilaGames).where(eq(lilaGames.purchaseId, purchaseId)).limit(1);
  return row ? getLilaGame(db, row.id) : null;
}

export async function getAwaitingLilaGame(db: Database, userId: string): Promise<LilaGameRecord | null> {
  if (!isUuid(userId)) return null;
  const [row] = await db
    .select()
    .from(lilaGames)
    .where(and(eq(lilaGames.userId, userId), eq(lilaGames.status, "awaiting_payment")))
    .orderBy(desc(lilaGames.createdAt))
    .limit(1);
  return row ?? null;
}

export async function abandonAwaitingLilaGames(db: Database, userId: string): Promise<void> {
  await db.update(lilaGames).set({ status: "abandoned" }).where(and(eq(lilaGames.userId, userId), eq(lilaGames.status, "awaiting_payment")));
}

// «Попробовать снова» после отмены платежа: та же партия получает новую покупку
export async function rebindLilaGamePurchase(db: Database, p: { gameId: string; userId: string; purchaseId: string }): Promise<boolean> {
  if (!isUuid(p.gameId)) return false;
  const updated = await db
    .update(lilaGames)
    .set({ purchaseId: p.purchaseId })
    .where(and(eq(lilaGames.id, p.gameId), eq(lilaGames.userId, p.userId), eq(lilaGames.status, "awaiting_payment")))
    .returning({ id: lilaGames.id });
  return updated.length > 0;
}

// Вызывается после подтверждённой оплаты и при каждом просмотре страницы ожидания — переход идемпотентен.
// Оплачена, но в портрете уже идёт другая партия — «blocked»: партия остаётся ждать, пока та будет закрыта
export async function activateLilaGameForPurchase(db: Database, purchaseId: string): Promise<"activated" | "already_active" | "blocked" | "missing"> {
  const game = await getLilaGameByPurchase(db, purchaseId);
  if (!game) return "missing";
  if (game.status === "active" || game.status === "finished") return "already_active";
  try {
    const updated = await db
      .update(lilaGames)
      .set({ status: "active" })
      .where(and(eq(lilaGames.id, game.id), inArray(lilaGames.status, ["awaiting_payment", "abandoned"])))
      .returning({ id: lilaGames.id });
    return updated.length > 0 ? "activated" : "missing";
  } catch (error) {
    if (isUniqueViolation(error)) return "blocked";
    throw error;
  }
}

// Абзац записывается один раз: повторная задача воркера ничего не перезапишет
export async function saveLilaGuide(db: Database, p: { gameId: string; n: number; text: string | null }): Promise<boolean> {
  if (!isUuid(p.gameId)) return false;
  const updated = await db
    .update(lilaMoves)
    .set({ guideText: p.text, guideSource: p.text === null ? "none" : "ai" })
    .where(and(eq(lilaMoves.gameId, p.gameId), eq(lilaMoves.n, p.n), isNull(lilaMoves.guideSource)))
    .returning({ n: lilaMoves.n });
  return updated.length > 0;
}

export async function saveLilaConclusion(db: Database, p: { gameId: string; chapters: readonly StoredConclusionChapter[] }): Promise<{ created: boolean }> {
  const inserted = await db
    .insert(lilaConclusions)
    .values({ gameId: p.gameId, chapters: p.chapters })
    .onConflictDoNothing({ target: lilaConclusions.gameId })
    .returning({ id: lilaConclusions.id });
  return { created: inserted.length > 0 };
}

export async function getLilaConclusion(db: Database, gameId: string): Promise<StoredConclusion | null> {
  if (!isUuid(gameId)) return null;
  const [row] = await db.select().from(lilaConclusions).where(eq(lilaConclusions.gameId, gameId)).limit(1);
  return row ? { chapters: row.chapters as StoredConclusionChapter[], createdAt: row.createdAt } : null;
}
