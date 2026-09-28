import { MATRIX_REPORT_PRICE_KOPECKS, MATRIX_REPORT_PRODUCT, type GenerateReportJob } from "@oracle/core";
import {
  attachPayment,
  createPurchase,
  findOpenPurchase,
  findPaidPurchase,
  getBirthDate,
  getPurchase,
  getPurchaseByPaymentId,
  getReport,
  markPurchaseCanceled,
  markPurchaseSucceeded,
  type Database,
  type PurchaseRecord,
} from "@oracle/db";
import { z } from "zod";
import { reportPath } from "../lib/report-offer";
import type { PaymentGateway } from "./payments/gateway";

export type PaymentsDeps = { db: Database; gateway: PaymentGateway; appUrl: string; now: () => Date; enqueueGenerate: (job: GenerateReportJob) => Promise<void> };
export type StartPurchaseError = "no_birth_date" | "invalid_email" | "already_paid" | "not_found" | "payment_failed";
export type StartPurchaseOutcome = { ok: true; url: string } | { ok: false; error: StartPurchaseError; purchaseId?: string };
export type PurchaseViewStatus = "pending" | "canceled" | "generating" | "ready";
export type PurchaseView = { id: string; status: PurchaseViewStatus; birthDate: string; duplicateOf: string | null };

const REUSE_WINDOW_MS = 30 * 60_000;
const DESCRIPTION_MAX = 128;
const DESCRIPTION = "Разбор матрицы судьбы — «Твой оракул»";
const emailSchema = z.email().max(254);

export { reportPath };

// Описание видно в кабинете ЮKassa: по нему владелица отправляет чек «Мой налог». Лимит ЮKassa — 128 знаков
export function paymentDescription(email: string): string {
  const full = `${DESCRIPTION}, чек: ${email}`;
  return full.length <= DESCRIPTION_MAX ? full : `${DESCRIPTION}, чек: см. метаданные`;
}

function readEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = emailSchema.safeParse(value.trim());
  return parsed.success ? parsed.data : null;
}

async function purchaseFor(deps: PaymentsDeps, p: { userId: string; birthDate: string; email: string }): Promise<StartPurchaseOutcome> {
  const key = { userId: p.userId, product: MATRIX_REPORT_PRODUCT, birthDate: p.birthDate } as const;
  const paid = await findPaidPurchase(deps.db, key);
  if (paid) return { ok: false, error: "already_paid", purchaseId: paid.id };

  const open = await findOpenPurchase(deps.db, { ...key, since: new Date(deps.now().getTime() - REUSE_WINDOW_MS) });
  if (open?.confirmationUrl && open.receiptEmail === p.email) return { ok: true, url: open.confirmationUrl };

  const purchase = await createPurchase(deps.db, { ...key, receiptEmail: p.email, amountKopecks: MATRIX_REPORT_PRICE_KOPECKS });
  try {
    const payment = await deps.gateway.createPayment({
      purchaseId: purchase.id,
      amountKopecks: purchase.amountKopecks,
      description: paymentDescription(p.email),
      receiptEmail: p.email,
      returnUrl: new URL(reportPath(purchase.id), deps.appUrl).toString(),
    });
    if (!payment.confirmationUrl) throw new Error("payment has no confirmation url");
    await attachPayment(deps.db, purchase.id, { paymentId: payment.id, confirmationUrl: payment.confirmationUrl });
    return { ok: true, url: payment.confirmationUrl };
  } catch (error) {
    // В лог — только id покупки и причина: e-mail и дата здесь не нужны
    console.error("payment was not created", { purchaseId: purchase.id, error: String(error) });
    await markPurchaseCanceled(deps.db, purchase.id);
    return { ok: false, error: "payment_failed" };
  }
}

// Покупается разбор даты из портрета: страница сохраняет дату в портрет до оплаты, клиенту здесь не верим
export async function startPurchase(deps: PaymentsDeps, p: { userId: string; email: unknown }): Promise<StartPurchaseOutcome> {
  const email = readEmail(p.email);
  if (!email) return { ok: false, error: "invalid_email" };
  const birthDate = await getBirthDate(deps.db, p.userId);
  if (!birthDate) return { ok: false, error: "no_birth_date" };
  return purchaseFor(deps, { userId: p.userId, birthDate, email });
}

// «Попробовать снова» после отмены: та же дата и тот же e-mail, новая покупка
export async function retryPurchase(deps: PaymentsDeps, p: { userId: string; purchaseId: unknown }): Promise<StartPurchaseOutcome> {
  const purchase = typeof p.purchaseId === "string" ? await getPurchase(deps.db, p.purchaseId) : null;
  if (!purchase || purchase.userId !== p.userId || purchase.status !== "canceled" || !purchase.birthDate || !purchase.receiptEmail) {
    return { ok: false, error: "not_found" };
  }
  return purchaseFor(deps, { userId: p.userId, birthDate: purchase.birthDate, email: purchase.receiptEmail });
}

async function firstPaidOf(deps: PaymentsDeps, purchase: PurchaseRecord): Promise<PurchaseRecord | null> {
  if (!purchase.birthDate) return null;
  return findPaidPurchase(deps.db, { userId: purchase.userId, product: purchase.product, birthDate: purchase.birthDate });
}

async function enqueueIfFirst(deps: PaymentsDeps, purchase: PurchaseRecord): Promise<void> {
  const first = await firstPaidOf(deps, purchase);
  if (!first) return;
  if (first.id === purchase.id) await deps.enqueueGenerate({ purchaseId: purchase.id });
  else console.warn("duplicate paid purchase — refund manually", { purchaseId: purchase.id });
}

// Единственное место, где меняется статус покупки: по ответу API шлюза, а не по телу уведомления
export async function syncPayment(deps: PaymentsDeps, paymentId: string): Promise<PurchaseRecord | null> {
  const purchase = await getPurchaseByPaymentId(deps.db, paymentId);
  if (!purchase) return null;
  if (purchase.status !== "pending") return purchase;
  const payment = await deps.gateway.getPayment(paymentId);
  if (!payment) return purchase;
  if (payment.purchaseId !== purchase.id || payment.amountKopecks !== purchase.amountKopecks) {
    console.warn("payment does not match the purchase", { purchaseId: purchase.id, paymentId });
    return purchase;
  }
  if (payment.status === "succeeded" && payment.paid) {
    if (await markPurchaseSucceeded(deps.db, purchase.id, deps.now())) await enqueueIfFirst(deps, purchase);
  } else if (payment.status === "canceled") {
    await markPurchaseCanceled(deps.db, purchase.id);
  }
  return getPurchase(deps.db, purchase.id);
}

export async function getPurchaseView(deps: PaymentsDeps, p: { purchaseId: string; userId: string }): Promise<PurchaseView | null> {
  let purchase = await getPurchase(deps.db, p.purchaseId);
  // Чужая покупка неотличима от несуществующей; после удаления данных даты нет — разбора тоже
  if (!purchase || purchase.userId !== p.userId || !purchase.birthDate) return null;
  if (purchase.status === "pending" && purchase.yookassaPaymentId) {
    try {
      purchase = (await syncPayment(deps, purchase.yookassaPaymentId)) ?? purchase;
    } catch (error) {
      // ЮKassa недоступна — страница покажет ожидание и спросит ещё раз
      console.error("payment sync failed", { purchaseId: purchase.id, error: String(error) });
    }
  }
  const view = { id: purchase.id, birthDate: purchase.birthDate!, duplicateOf: null };
  if (purchase.status === "pending") return { ...view, status: "pending" };
  if (purchase.status === "canceled") return { ...view, status: "canceled" };

  const first = await firstPaidOf(deps, purchase);
  if (first && first.id !== purchase.id) return { ...view, status: "ready", duplicateOf: first.id };
  if (await getReport(deps.db, purchase.id)) return { ...view, status: "ready" };
  // Задача могла не встать в очередь в момент оплаты — ставим ещё раз, id задачи тот же
  await deps.enqueueGenerate({ purchaseId: purchase.id });
  return { ...view, status: "generating" };
}
