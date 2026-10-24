import type { Product } from "@oracle/core";
import { and, asc, eq, gt, isNotNull, isNull } from "drizzle-orm";
import { purchaseAnalytics, purchases } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

export type PurchaseAnalyticsEvent = { transactionId: string; product: Product; amountKopecks: number };

// Единственный победивший claim получает данные для отправки. Доставка события браузером не гарантируется.
export async function claimPurchaseAnalytics(db: Database, userId: string): Promise<PurchaseAnalyticsEvent[]> {
  if (!isUuid(userId)) return [];
  return db.transaction(async (tx) => {
    const candidates = await tx
      .select({ purchaseId: purchases.id, product: purchases.product, amountKopecks: purchases.amountKopecks })
      .from(purchases)
      .leftJoin(purchaseAnalytics, eq(purchaseAnalytics.purchaseId, purchases.id))
      .where(and(
        eq(purchases.userId, userId),
        eq(purchases.status, "succeeded"),
        gt(purchases.amountKopecks, 0),
        isNotNull(purchases.paidAt),
        isNotNull(purchases.yookassaPaymentId),
        isNull(purchaseAnalytics.purchaseId),
      ))
      .orderBy(asc(purchases.paidAt), asc(purchases.id))
      .limit(50);
    if (candidates.length === 0) return [];

    // Уникальный purchase_id решает гонку между браузерами: проигравший не получает событие.
    const claimed = await tx.insert(purchaseAnalytics)
      .values(candidates.map(({ purchaseId }) => ({ purchaseId })))
      .onConflictDoNothing({ target: purchaseAnalytics.purchaseId })
      .returning({ purchaseId: purchaseAnalytics.purchaseId, transactionId: purchaseAnalytics.transactionId });
    const transactionIds = new Map(claimed.map((row) => [row.purchaseId, row.transactionId]));
    return candidates.flatMap(({ purchaseId, product, amountKopecks }) => {
      const transactionId = transactionIds.get(purchaseId);
      return transactionId ? [{ transactionId, product, amountKopecks }] : [];
    });
  });
}
