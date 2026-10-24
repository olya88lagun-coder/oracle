import type { Product } from "@oracle/core";
import { METRIKA_ID, reachGoal, type Goal } from "./analytics";
import { isAnalyticsReady } from "./analytics-runtime";

export type PurchaseAnalyticsEvent = { transactionId: string; product: Product; amountKopecks: number };
type Dependencies = { isReady: () => boolean; fetchEvents: () => Promise<unknown>; emit: (event: PurchaseAnalyticsEvent) => boolean };

const PRODUCTS: Record<Product, { name: string; goal: Goal }> = {
  matrix_report: { name: "Разбор матрицы судьбы", goal: "report_paid" },
  natal_report: { name: "Разбор натальной карты", goal: "natal_paid" },
  lila_session: { name: "Лила с проводником", goal: "lila_paid" },
};
const UUID = /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i;

function readEvent(value: unknown): PurchaseAnalyticsEvent | null {
  if (!value || typeof value !== "object") return null;
  const { transactionId, product, amountKopecks } = value as Record<string, unknown>;
  if (typeof transactionId !== "string" || !UUID.test(transactionId)
    || typeof product !== "string" || !Object.hasOwn(PRODUCTS, product)
    || typeof amountKopecks !== "number" || !Number.isSafeInteger(amountKopecks) || amountKopecks <= 0) return null;
  return { transactionId, product: product as Product, amountKopecks };
}

type PurchaseWindow = Window & { dataLayer?: unknown[]; ym?: (...args: unknown[]) => void };

export function emitPurchaseEvent(input: PurchaseAnalyticsEvent): boolean {
  const event = readEvent(input);
  if (!event || !isAnalyticsReady() || METRIKA_ID === null || typeof window === "undefined") return false;
  const w = window as PurchaseWindow;
  if (!w.ym) return false;
  const product = PRODUCTS[event.product];
  const amount = event.amountKopecks / 100;
  (w.dataLayer ??= []).push({ ecommerce: {
    currencyCode: "RUB",
    purchase: {
      actionField: { id: event.transactionId, revenue: amount },
      products: [{ id: event.product, name: product.name, price: amount, quantity: 1 }],
    },
  } });
  return reachGoal(product.goal);
}

async function fetchEvents(): Promise<unknown> {
  const response = await fetch("/api/analytics/purchases", { method: "POST", credentials: "same-origin", cache: "no-store" });
  return response.ok ? response.json() : null;
}

export function createPurchaseTracker(dependencies: Dependencies = { isReady: isAnalyticsReady, fetchEvents, emit: emitPurchaseEvent }): { flush: () => Promise<void> } {
  const sent = new Set<string>();
  let running: Promise<void> | null = null;
  let rerun = false;

  async function drain(): Promise<void> {
    do {
      rerun = false;
      if (!dependencies.isReady()) return;
      try {
        const body = await dependencies.fetchEvents() as { ok?: unknown; events?: unknown } | null;
        if (!dependencies.isReady() || body?.ok !== true || !Array.isArray(body.events)) continue;
        for (const value of body.events.slice(0, 50)) {
          const event = readEvent(value);
          if (event && !sent.has(event.transactionId) && dependencies.emit(event)) sent.add(event.transactionId);
        }
      } catch {
        // Analytics cannot interrupt a report or payment. A future lifecycle signal can retry the request.
      }
    } while (rerun && dependencies.isReady());
  }

  function flush(): Promise<void> {
    if (!dependencies.isReady()) return Promise.resolve();
    if (running) {
      rerun = true;
      return running;
    }
    running = drain().finally(() => { running = null; });
    return running;
  }
  return { flush };
}

export const PURCHASE_TRACKING_EVENT = "oracle:purchase-tracking";
export function requestPurchaseTracking(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PURCHASE_TRACKING_EVENT));
}
