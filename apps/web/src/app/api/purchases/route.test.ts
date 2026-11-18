import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SESSION_COOKIE } from "@/server/http";

const mocks = vi.hoisted(() => {
  const db = {};
  const env = { APP_URL: "https://oracle.test", payments: { kind: "fake" } as { kind: "fake" } | null, paidReports: true, paidLila: true, paidNatal: true, paidThread: false, ownerVkId: null };
  return {
    db,
    env,
    getEnv: vi.fn(() => env),
    getPurchase: vi.fn(),
    getCurrentUser: vi.fn(),
    startPurchase: vi.fn(),
    startLilaPurchase: vi.fn(),
    startNatalPurchase: vi.fn(),
    startThreadPurchase: vi.fn(),
    retryPurchase: vi.fn(),
    batch10: { accepted: true },
  };
});

vi.mock("@oracle/content/numerology", async (importOriginal) =>
  (await import("@/app/numerologiya/grafik-sudby/thread-fixtures")).mockThreadReportBatch(importOriginal as never, () => mocks.batch10.accepted),
);
vi.mock("@oracle/db", () => ({ getPurchase: mocks.getPurchase }));
vi.mock("@/server/db", () => ({ getDb: () => mocks.db }));
vi.mock("@/server/env", () => ({ getEnv: mocks.getEnv }));
vi.mock("@/server/queue", () => ({ enqueueGenerate: vi.fn(), enqueueGenerateNatal: vi.fn(), enqueueGenerateThread: vi.fn(), enqueueReceiptsReminder: vi.fn() }));
vi.mock("@/server/owner", () => ({ isOwnerUser: vi.fn(async () => false) }));
vi.mock("@/server/deps", () => ({ loginDeps: () => ({ db: mocks.db, env: mocks.env }) }));
vi.mock("@/server/login-service", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/rate-limit", () => ({ purchaseLimiter: { allow: () => true }, clientKeyFromHeaders: () => "client" }));
vi.mock("@/server/payments-service", () => ({
  startPurchase: mocks.startPurchase,
  startLilaPurchase: mocks.startLilaPurchase,
  startNatalPurchase: mocks.startNatalPurchase,
  startThreadPurchase: mocks.startThreadPurchase,
  retryPurchase: mocks.retryPurchase,
}));

const { POST } = await import("./route");

const call = (body: unknown) =>
  POST(
    new NextRequest("https://oracle.test/api/purchases", {
      method: "POST",
      headers: new Headers({ "content-type": "application/json", origin: "https://oracle.test", cookie: `${SESSION_COOKIE}=valid-session` }),
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(mocks.env, { payments: { kind: "fake" }, paidReports: true, paidNatal: true, paidThread: false });
  mocks.batch10.accepted = true;
  mocks.getCurrentUser.mockResolvedValue({ id: "user-1", displayName: "Тест" });
  mocks.getPurchase.mockResolvedValue(null);
  mocks.startThreadPurchase.mockResolvedValue({ ok: true, url: "https://pay.test/1" });
  mocks.retryPurchase.mockResolvedValue({ ok: true, url: "https://pay.test/2" });
});

describe("POST /api/purchases, thread report", () => {
  test("answers 404 while PAID_THREAD is off, even with the other sales on", async () => {
    const response = await call({ product: "thread_report", email: "a@b.ru", birth: "1990-07-15" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: "not_found" });
    expect(mocks.startThreadPurchase).not.toHaveBeenCalled();
    expect(mocks.startPurchase).not.toHaveBeenCalled();
  });

  test("answers 404 while payments are off, even with PAID_THREAD on", async () => {
    Object.assign(mocks.env, { payments: null, paidThread: true });
    expect((await call({ product: "thread_report", email: "a@b.ru", birth: "1990-07-15" })).status).toBe(404);
    expect(mocks.startThreadPurchase).not.toHaveBeenCalled();
  });

  test("answers 404 while batch 10 is not accepted, even with PAID_THREAD on", async () => {
    mocks.env.paidThread = true;
    mocks.batch10.accepted = false;
    const response = await call({ product: "thread_report", email: "a@b.ru", birth: "1990-07-15" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: "not_found" });
    expect(mocks.startThreadPurchase).not.toHaveBeenCalled();
  });

  test("passes e-mail and birth to the thread purchase when PAID_THREAD is on and batch 10 is accepted", async () => {
    mocks.env.paidThread = true;
    const response = await call({ product: "thread_report", email: "a@b.ru", birth: "1990-07-15" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, url: "https://pay.test/1" });
    expect(mocks.startThreadPurchase).toHaveBeenCalledWith(expect.anything(), { userId: "user-1", email: "a@b.ru", birth: "1990-07-15" });
    expect(mocks.startPurchase).not.toHaveBeenCalled();
  });

  test("answers 400 to a garbage birth", async () => {
    mocks.env.paidThread = true;
    mocks.startThreadPurchase.mockResolvedValue({ ok: false, error: "invalid_birth" });
    const response = await call({ product: "thread_report", email: "a@b.ru", birth: { evil: true } });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "invalid_birth" });
  });

  test("a retry of a thread purchase is gated by PAID_THREAD, not by the matrix switch", async () => {
    mocks.getPurchase.mockResolvedValue({ id: "p-1", product: "thread_report" });
    expect((await call({ retry: "p-1" })).status).toBe(404);
    expect(mocks.retryPurchase).not.toHaveBeenCalled();

    mocks.env.paidThread = true;
    expect((await call({ retry: "p-1" })).status).toBe(200);
    expect(mocks.retryPurchase).toHaveBeenCalledWith(expect.anything(), { userId: "user-1", purchaseId: "p-1" });
  });
});
