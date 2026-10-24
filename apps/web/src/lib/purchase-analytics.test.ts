import { afterEach, describe, expect, test, vi } from "vitest";
import { markAnalyticsReady, setAnalyticsConsent } from "./analytics-runtime";
import { createPurchaseTracker, emitPurchaseEvent } from "./purchase-analytics";

const sale = { transactionId: "bc146faf-3591-42d3-a282-48fcfa7748bc", product: "matrix_report", amountKopecks: 39_000 } as const;
const second = { ...sale, transactionId: "b5c1b89c-f53e-4ba4-b50f-3f52a61b937f", product: "natal_report" } as const;

afterEach(() => { setAnalyticsConsent(false); vi.unstubAllGlobals(); });

describe("purchase payload", () => {
  test("requires consent and SDK readiness before touching ecommerce or goals", () => {
    const ym = vi.fn();
    const dataLayer: unknown[] = [];
    vi.stubGlobal("window", { ym, dataLayer });
    expect(emitPurchaseEvent(sale)).toBe(false);
    setAnalyticsConsent(true);
    expect(emitPurchaseEvent(sale)).toBe(false);
    expect(dataLayer).toEqual([]);
    expect(ym).not.toHaveBeenCalled();
  });

  test.each([
    ["matrix_report", "Разбор матрицы судьбы", "report_paid"],
    ["natal_report", "Разбор натальной карты", "natal_paid"],
    ["lila_session", "Лила с проводником", "lila_paid"],
  ] as const)("sends actual RUB revenue and anonymous static product for %s", (product, name, goal) => {
    const ym = vi.fn();
    const dataLayer: unknown[] = [];
    vi.stubGlobal("window", { ym, dataLayer });
    setAnalyticsConsent(true);
    markAnalyticsReady();
    expect(emitPurchaseEvent({ ...sale, product, amountKopecks: 47_550 })).toBe(true);
    expect(dataLayer).toEqual([{ ecommerce: {
      currencyCode: "RUB",
      purchase: { actionField: { id: sale.transactionId, revenue: 475.5 }, products: [{ id: product, name, price: 475.5, quantity: 1 }] },
    } }]);
    expect(ym).toHaveBeenCalledWith(113068094, "reachGoal", goal, undefined);
  });
});

describe("purchase tracking lifecycle", () => {
  test("does not claim before readiness; a later trigger works", async () => {
    let ready = false;
    const fetchEvents = vi.fn(async () => ({ ok: true, events: [sale] }));
    const emit = vi.fn(() => true);
    const tracker = createPurchaseTracker({ isReady: () => ready, fetchEvents, emit });
    await tracker.flush();
    expect(fetchEvents).not.toHaveBeenCalled();
    ready = true;
    await tracker.flush();
    expect(emit).toHaveBeenCalledExactlyOnceWith(sale);
  });

  test("does not send after consent is revoked during the server request", async () => {
    let ready = true;
    let resolve!: (body: unknown) => void;
    const fetchEvents = vi.fn(() => new Promise<unknown>((done) => { resolve = done; }));
    const emit = vi.fn(() => true);
    const tracker = createPurchaseTracker({ isReady: () => ready, fetchEvents, emit });
    const pending = tracker.flush();
    ready = false;
    resolve({ ok: true, events: [sale] });
    await pending;
    expect(emit).not.toHaveBeenCalled();
  });

  test("coalesces concurrent requests, reruns for a payment completed while in flight, and suppresses duplicate ids", async () => {
    let resolve!: (body: unknown) => void;
    const fetchEvents = vi.fn().mockImplementationOnce(() => new Promise((done) => { resolve = done; }))
      .mockResolvedValueOnce({ ok: true, events: [sale, second] });
    const emit = vi.fn(() => true);
    const tracker = createPurchaseTracker({ isReady: () => true, fetchEvents, emit });
    const pending = tracker.flush();
    void tracker.flush();
    void tracker.flush();
    expect(fetchEvents).toHaveBeenCalledTimes(1);
    resolve({ ok: true, events: [sale] });
    await pending;
    expect(fetchEvents).toHaveBeenCalledTimes(2);
    expect(emit.mock.calls).toEqual([[sale], [second]]);
  });

  test("validates server data and strips extra personal fields instead of spreading them", async () => {
    const emit = vi.fn(() => true);
    const events = [
      { ...sale, email: "private@example.test", birthDate: "1990-03-07", purchaseId: "private-id" },
      { ...second, amountKopecks: 0 }, { ...second, amountKopecks: -1 },
      { ...second, amountKopecks: 12.5 }, { ...second, amountKopecks: Number.MAX_SAFE_INTEGER + 1 },
      { ...second, product: "unknown" }, { ...second, transactionId: "private@example.test" }, null,
    ];
    const tracker = createPurchaseTracker({ isReady: () => true, fetchEvents: async () => ({ ok: true, events }), emit });
    await tracker.flush();
    expect(emit).toHaveBeenCalledExactlyOnceWith(sale);
  });

  test("survives request errors and guest/error responses; retries only on a fresh trigger", async () => {
    const emit = vi.fn(() => true);
    const fetchEvents = vi.fn().mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ok: false, events: [sale] }).mockResolvedValueOnce({ ok: true, events: [sale] });
    const tracker = createPurchaseTracker({ isReady: () => true, fetchEvents, emit });
    await expect(tracker.flush()).resolves.toBeUndefined();
    expect(fetchEvents).toHaveBeenCalledTimes(1);
    await tracker.flush();
    expect(emit).not.toHaveBeenCalled();
    await tracker.flush();
    expect(emit).toHaveBeenCalledTimes(1);
  });

  test("requests the session-scoped endpoint without sending any purchase or personal data", async () => {
    setAnalyticsConsent(true);
    markAnalyticsReady();
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, events: [] }) }));
    vi.stubGlobal("fetch", fetcher);
    await createPurchaseTracker().flush();
    expect(fetcher).toHaveBeenCalledExactlyOnceWith("/api/analytics/purchases", {
      method: "POST", credentials: "same-origin", cache: "no-store",
    });
  });
});
