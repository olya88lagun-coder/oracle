import type { Product } from "@oracle/core";
import { and, asc, desc, eq, gte, isNotNull } from "drizzle-orm";
import { purchases, reports, type PurchaseStatus } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

export type { PurchaseStatus } from "./schema";
export type PurchaseRecord = {
  id: string;
  userId: string;
  product: Product;
  birthDate: string | null;
  receiptEmail: string | null;
  amountKopecks: number;
  status: PurchaseStatus;
  yookassaPaymentId: string | null;
  confirmationUrl: string | null;
  createdAt: Date;
  paidAt: Date | null;
};
export type PaidPurchase = { id: string; birthDate: string; ready: boolean; paidAt: Date };

type PurchaseRow = typeof purchases.$inferSelect;
type DateOfProduct = { userId: string; product: Product; birthDate: string };
type NewPurchase = { userId: string; product: Product; birthDate?: string | null; receiptEmail: string; amountKopecks: number };

const toRecord = (row: PurchaseRow): PurchaseRecord => ({ ...row, product: row.product as Product });

const sameDate = (p: DateOfProduct) => and(eq(purchases.userId, p.userId), eq(purchases.product, p.product), eq(purchases.birthDate, p.birthDate));

// Дата уже проверена parseBirthDate, e-mail — сервисом покупок: сюда приходят готовые значения
export async function createPurchase(
  db: Database,
  p: NewPurchase,
): Promise<PurchaseRecord> {
  const [row] = await db
    .insert(purchases)
    .values({ userId: p.userId, product: p.product, birthDate: p.birthDate ?? null, receiptEmail: p.receiptEmail, amountKopecks: p.amountKopecks })
    .returning();
  return toRecord(row!);
}

export async function attachPayment(db: Database, purchaseId: string, p: { paymentId: string; confirmationUrl: string }): Promise<void> {
  await db.update(purchases).set({ yookassaPaymentId: p.paymentId, confirmationUrl: p.confirmationUrl }).where(eq(purchases.id, purchaseId));
}

export async function getPurchase(db: Database, purchaseId: string): Promise<PurchaseRecord | null> {
  if (!isUuid(purchaseId)) return null;
  const [row] = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1);
  return row ? toRecord(row) : null;
}

export async function getPurchaseByPaymentId(db: Database, paymentId: string): Promise<PurchaseRecord | null> {
  const [row] = await db.select().from(purchases).where(eq(purchases.yookassaPaymentId, paymentId)).limit(1);
  return row ? toRecord(row) : null;
}

// Неоплаченная покупка той же даты со ссылкой на оплату — повторное нажатие «Купить» ведёт в тот же платёж
export async function findOpenPurchase(db: Database, p: DateOfProduct & { since: Date }): Promise<PurchaseRecord | null> {
  const [row] = await db
    .select()
    .from(purchases)
    .where(and(sameDate(p), eq(purchases.status, "pending"), isNotNull(purchases.confirmationUrl), gte(purchases.createdAt, p.since)))
    .orderBy(desc(purchases.createdAt))
    .limit(1);
  return row ? toRecord(row) : null;
}

// Самая ранняя оплата даты — «настоящая»; вторая оплата той же даты считается дублем и возвращается вручную
export async function findPaidPurchase(db: Database, p: DateOfProduct): Promise<PurchaseRecord | null> {
  const [row] = await db
    .select()
    .from(purchases)
    .where(and(sameDate(p), eq(purchases.status, "succeeded")))
    .orderBy(asc(purchases.paidAt), asc(purchases.createdAt))
    .limit(1);
  return row ? toRecord(row) : null;
}

// Условный UPDATE: из двух одновременных уведомлений переход сделает только одно — и только оно поставит генерацию
export async function markPurchaseSucceeded(db: Database, purchaseId: string, paidAt: Date): Promise<boolean> {
  const updated = await db
    .update(purchases)
    .set({ status: "succeeded", paidAt })
    .where(and(eq(purchases.id, purchaseId), eq(purchases.status, "pending")))
    .returning({ id: purchases.id });
  return updated.length > 0;
}

export async function markPurchaseCanceled(db: Database, purchaseId: string): Promise<void> {
  await db
    .update(purchases)
    .set({ status: "canceled" })
    .where(and(eq(purchases.id, purchaseId), eq(purchases.status, "pending")));
}

export async function listPaidPurchases(db: Database, userId: string): Promise<PaidPurchase[]> {
  if (!isUuid(userId)) return [];
  const rows = await db
    .select({ id: purchases.id, birthDate: purchases.birthDate, paidAt: purchases.paidAt, reportId: reports.id })
    .from(purchases)
    .leftJoin(reports, eq(reports.purchaseId, purchases.id))
    .where(and(eq(purchases.userId, userId), eq(purchases.status, "succeeded"), isNotNull(purchases.birthDate)))
    .orderBy(desc(purchases.paidAt), desc(purchases.createdAt));
  return rows.map((row) => ({ id: row.id, birthDate: row.birthDate!, ready: row.reportId !== null, paidAt: row.paidAt! }));
}
