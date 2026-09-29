import { LILA_SESSION_PRICE_KOPECKS, LILA_SESSION_PRODUCT, MATRIX_REPORT_PRICE_KOPECKS, MATRIX_REPORT_PRODUCT, type GenerateReportJob, type Product } from "@oracle/core";
import {
  abandonAwaitingLilaGames,
  activateLilaGameForPurchase,
  attachPayment,
  createLilaGame,
  createPurchase,
  findOpenPurchase,
  findPaidPurchase,
  getActiveLilaGame,
  getAwaitingLilaGame,
  getBirthDate,
  getLilaGameByPurchase,
  getPurchase,
  getPurchaseByPaymentId,
  getReport,
  markPurchaseCanceled,
  markPurchaseSucceeded,
  rebindLilaGamePurchase,
  type Database,
  type PurchaseRecord,
} from "@oracle/db";
import { z } from "zod";
import { normalizeIntention } from "../lib/lila-view";
import { reportPath } from "../lib/report-offer";
import type { PaymentGateway } from "./payments/gateway";

export type PaymentsDeps = { db: Database; gateway: PaymentGateway; appUrl: string; now: () => Date; enqueueGenerate: (job: GenerateReportJob) => Promise<void> };
export type StartPurchaseError = "no_birth_date" | "invalid_email" | "invalid_intention" | "active_game" | "already_paid" | "not_found" | "payment_failed";
export type StartPurchaseOutcome = { ok: true; url: string } | { ok: false; error: StartPurchaseError; purchaseId?: string };
export type PurchaseViewStatus = "pending" | "canceled" | "generating" | "ready";
export type LilaPurchaseView = { id: string; status: "pending" | "canceled" | "ready" | "blocked"; gameId: string | null };
export type PurchaseView = { id: string; status: PurchaseViewStatus; birthDate: string; duplicateOf: string | null };

const REUSE_WINDOW_MS = 30 * 60_000;
const DESCRIPTION_MAX = 128;
const DESCRIPTIONS: Readonly<Record<Product, string>> = {
  matrix_report: "Разбор матрицы судьбы — «Твой оракул»",
  lila_session: "Сессия Лилы с проводником — «Твой оракул»",
};
const emailSchema = z.email().max(254);

export { reportPath };

export const lilaPaymentPath = (purchaseId: string) => `/lila/igra/oplata/${purchaseId}`;
export const purchaseReturnPath = (purchase: { id: string; product: Product }): string =>
  purchase.product === LILA_SESSION_PRODUCT ? lilaPaymentPath(purchase.id) : reportPath(purchase.id);

// Описание видно в кабинете ЮKassa: по нему владелица отправляет чек «Мой налог». Лимит ЮKassa — 128 знаков
export function paymentDescription(email: string, product: Product = MATRIX_REPORT_PRODUCT): string {
  const base = DESCRIPTIONS[product];
  const full = `${base}, чек: ${email}`;
  return full.length <= DESCRIPTION_MAX ? full : `${base}, чек: см. метаданные`;
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
  return createGatewayPayment(deps, purchase, p.email);
}

// Создание платежа в шлюзе для уже созданной покупки: общая часть покупки разбора и сессии
async function createGatewayPayment(deps: PaymentsDeps, purchase: PurchaseRecord, email: string): Promise<StartPurchaseOutcome> {
  try {
    const payment = await deps.gateway.createPayment({
      purchaseId: purchase.id,
      amountKopecks: purchase.amountKopecks,
      description: paymentDescription(email, purchase.product),
      receiptEmail: email,
      returnUrl: new URL(purchaseReturnPath(purchase), deps.appUrl).toString(),
    });
    if (!payment.confirmationUrl) throw new Error("payment has no confirmation url");
    await attachPayment(deps.db, purchase.id, { paymentId: payment.id, confirmationUrl: payment.confirmationUrl });
    return { ok: true, url: payment.confirmationUrl };
  } catch (error) {
    // В лог — только id покупки и причина: e-mail, дата и намерение здесь не нужны
    console.error("payment was not created", { purchaseId: purchase.id, error: String(error) });
    await markPurchaseCanceled(deps.db, purchase.id);
    return { ok: false, error: "payment_failed" };
  }
}

export async function startLilaPurchase(deps: PaymentsDeps, p: { userId: string; email: unknown; intention: unknown }): Promise<StartPurchaseOutcome> {
  const email = readEmail(p.email);
  if (!email) return { ok: false, error: "invalid_email" };
  const intention = normalizeIntention(p.intention);
  if (!intention) return { ok: false, error: "invalid_intention" };
  if (await getActiveLilaGame(deps.db, p.userId)) return { ok: false, error: "active_game" };

  const waiting = await getAwaitingLilaGame(deps.db, p.userId);
  if (waiting?.purchaseId) {
    const open = await getPurchase(deps.db, waiting.purchaseId);
    const fresh = open !== null && open.createdAt.getTime() >= deps.now().getTime() - REUSE_WINDOW_MS;
    if (open && fresh && open.status === "pending" && open.confirmationUrl && open.receiptEmail === email && waiting.intention === intention) {
      return { ok: true, url: open.confirmationUrl };
    }
  }
  await abandonAwaitingLilaGames(deps.db, p.userId);

  const purchase = await createPurchase(deps.db, { userId: p.userId, product: LILA_SESSION_PRODUCT, receiptEmail: email, amountKopecks: LILA_SESSION_PRICE_KOPECKS });
  const game = await createLilaGame(deps.db, { userId: p.userId, intention, mode: "guided", status: "awaiting_payment", purchaseId: purchase.id });
  if (!game.ok) return { ok: false, error: "active_game" };
  return createGatewayPayment(deps, purchase, email);
}

// «Попробовать снова» после отмены: та же партия получает новую покупку
async function retryLilaPurchase(deps: PaymentsDeps, p: { userId: string; purchase: PurchaseRecord }): Promise<StartPurchaseOutcome> {
  const { purchase } = p;
  const game = await getLilaGameByPurchase(deps.db, purchase.id);
  if (!game || game.status !== "awaiting_payment" || !purchase.receiptEmail) return { ok: false, error: "not_found" };
  if (await getActiveLilaGame(deps.db, p.userId)) return { ok: false, error: "active_game" };
  const next = await createPurchase(deps.db, { userId: p.userId, product: LILA_SESSION_PRODUCT, receiptEmail: purchase.receiptEmail, amountKopecks: LILA_SESSION_PRICE_KOPECKS });
  if (!(await rebindLilaGamePurchase(deps.db, { gameId: game.id, userId: p.userId, purchaseId: next.id }))) {
    await markPurchaseCanceled(deps.db, next.id);
    return { ok: false, error: "not_found" };
  }
  return createGatewayPayment(deps, next, purchase.receiptEmail);
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
  if (purchase?.product === LILA_SESSION_PRODUCT && purchase.userId === p.userId && purchase.status === "canceled") return retryLilaPurchase(deps, { userId: p.userId, purchase });
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

async function onPaid(deps: PaymentsDeps, purchase: PurchaseRecord): Promise<void> {
  if (purchase.product !== LILA_SESSION_PRODUCT) return enqueueIfFirst(deps, purchase);
  // Оплата пришла, а в портрете уже идёт другая партия: активация повторится при просмотре страницы ожидания
  if ((await activateLilaGameForPurchase(deps.db, purchase.id)) === "blocked") console.warn("paid Lila session waits for the active game to end", { purchaseId: purchase.id });
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
    if (await markPurchaseSucceeded(deps.db, purchase.id, deps.now())) await onPaid(deps, purchase);
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

export async function getLilaPurchaseView(deps: PaymentsDeps, p: { purchaseId: string; userId: string }): Promise<LilaPurchaseView | null> {
  let purchase = await getPurchase(deps.db, p.purchaseId);
  if (!purchase || purchase.userId !== p.userId || purchase.product !== LILA_SESSION_PRODUCT) return null;
  if (purchase.status === "pending" && purchase.yookassaPaymentId) {
    try {
      purchase = (await syncPayment(deps, purchase.yookassaPaymentId)) ?? purchase;
    } catch (error) {
      console.error("payment sync failed", { purchaseId: purchase.id, error: String(error) });
    }
  }
  const game = await getLilaGameByPurchase(deps.db, purchase.id);
  // После удаления данных партии нет — страница тоже 404
  if (!game) return null;
  if (purchase.status === "pending") return { id: purchase.id, status: "pending", gameId: game.id };
  if (purchase.status === "canceled") return { id: purchase.id, status: "canceled", gameId: game.id };
  const activation = await activateLilaGameForPurchase(deps.db, purchase.id);
  if (activation === "blocked") return { id: purchase.id, status: "blocked", gameId: game.id };
  return { id: purchase.id, status: activation === "activated" || activation === "already_active" ? "ready" : "pending", gameId: game.id };
}
