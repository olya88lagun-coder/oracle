import type { LilaConclusionChapterId } from "@oracle/core";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getLilaGame, type LilaGameRecord, type LilaGameWithMoves } from "./lila";
import { lilaConclusions, lilaGames, lilaMoves, purchases } from "./schema";
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

// Для запросов пользователя: чужая и несуществующая партия неотличимы
export async function getLilaGameByPurchaseForUser(db: Database, purchaseId: string, userId: string): Promise<LilaGameWithMoves | null> {
  const game = await getLilaGameByPurchase(db, purchaseId);
  return game && game.userId === userId ? game : null;
}

// Оплаченная партия, которая ещё не началась (оплата пришла, когда шла другая партия, или партию успели «бросить»)
export async function getPaidWaitingLilaGame(db: Database, userId: string): Promise<LilaGameRecord | null> {
  if (!isUuid(userId)) return null;
  const [row] = await db
    .select({ game: lilaGames })
    .from(lilaGames)
    .innerJoin(purchases, eq(purchases.id, lilaGames.purchaseId))
    .where(and(eq(lilaGames.userId, userId), inArray(lilaGames.status, ["awaiting_payment", "abandoned"]), eq(purchases.status, "succeeded")))
    .orderBy(desc(lilaGames.createdAt))
    .limit(1);
  return row?.game ?? null;
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
  if (!isUuid(userId)) return;
  await db.update(lilaGames).set({ status: "abandoned" }).where(and(eq(lilaGames.userId, userId), eq(lilaGames.status, "awaiting_payment")));
}

// «Попробовать снова» после отмены платежа: та же партия получает новую покупку.
// Старая покупка должна быть отменена (иначе поздняя оплата осталась бы без партии), новая — принадлежать тому же человеку и быть покупкой сессии
export async function rebindLilaGamePurchase(db: Database, p: { gameId: string; userId: string; purchaseId: string }): Promise<boolean> {
  if (!isUuid(p.gameId) || !isUuid(p.userId) || !isUuid(p.purchaseId)) return false;
  return db.transaction(async (tx) => {
    const [game] = await tx
      .select({ purchaseId: lilaGames.purchaseId })
      .from(lilaGames)
      .where(and(eq(lilaGames.id, p.gameId), eq(lilaGames.userId, p.userId), eq(lilaGames.status, "awaiting_payment")))
      .limit(1);
    if (!game?.purchaseId) return false;
    const [old] = await tx.select({ status: purchases.status }).from(purchases).where(eq(purchases.id, game.purchaseId)).limit(1);
    const [next] = await tx.select({ userId: purchases.userId, product: purchases.product, status: purchases.status }).from(purchases).where(eq(purchases.id, p.purchaseId)).limit(1);
    if (old?.status !== "canceled" || next?.userId !== p.userId || next.product !== "lila_session" || next.status !== "pending") return false;
    const updated = await tx.update(lilaGames).set({ purchaseId: p.purchaseId }).where(eq(lilaGames.id, p.gameId)).returning({ id: lilaGames.id });
    return updated.length > 0;
  });
}

export type ActivationOutcome = "activated" | "already_active" | "blocked" | "unpaid" | "missing";

// Вызывается после подтверждённой оплаты и при каждом просмотре страницы ожидания — переход идемпотентен.
// Партия начинается только при оплаченной покупке (проверка здесь же, не на совести вызывающего).
// Оплачена, но в портрете уже идёт другая партия — «blocked»: партия остаётся ждать, пока та будет закрыта
export async function activateLilaGameForPurchase(db: Database, purchaseId: string): Promise<ActivationOutcome> {
  const game = await getLilaGameByPurchase(db, purchaseId);
  if (!game) return "missing";
  if (game.status === "active" || game.status === "finished") return "already_active";
  const [paid] = await db.select({ id: purchases.id }).from(purchases).where(and(eq(purchases.id, purchaseId), eq(purchases.status, "succeeded"))).limit(1);
  if (!paid) return "unpaid";
  try {
    const updated = await db
      .update(lilaGames)
      .set({ status: "active" })
      .where(and(eq(lilaGames.id, game.id), inArray(lilaGames.status, ["awaiting_payment", "abandoned"])))
      .returning({ id: lilaGames.id });
    if (updated.length > 0) return "activated";
    // Параллельный просмотр успел раньше — итог тот же
    const [current] = await db.select({ status: lilaGames.status }).from(lilaGames).where(eq(lilaGames.id, game.id)).limit(1);
    return current?.status === "active" || current?.status === "finished" ? "already_active" : "missing";
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
  if (!isUuid(p.gameId)) return { created: false };
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
