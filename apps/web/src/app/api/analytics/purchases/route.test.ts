import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SESSION_COOKIE } from "@/server/http";

const mocks = vi.hoisted(() => {
  const db = {};
  const env = { APP_URL: "https://oracle.test" };
  const deps = { db, env };
  return {
    db,
    deps,
    getEnv: vi.fn(() => env),
    getDb: vi.fn(() => db),
    loginDeps: vi.fn(() => deps),
    getCurrentUser: vi.fn(),
    claimPurchaseAnalytics: vi.fn(),
  };
});

vi.mock("@oracle/db", () => ({ claimPurchaseAnalytics: mocks.claimPurchaseAnalytics }));
vi.mock("@/server/db", () => ({ getDb: mocks.getDb }));
vi.mock("@/server/env", () => ({ getEnv: mocks.getEnv }));
vi.mock("@/server/deps", () => ({ loginDeps: mocks.loginDeps }));
vi.mock("@/server/login-service", () => ({ getCurrentUser: mocks.getCurrentUser }));

const { POST } = await import("./route");

function call({ origin = "https://oracle.test", token = "valid-session", body = "{}", query = "" }: { origin?: string | null; token?: string | null; body?: string; query?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (origin !== null) headers.set("origin", origin);
  if (token !== null) headers.set("cookie", `${SESSION_COOKIE}=${token}`);
  return POST(new NextRequest(`https://oracle.test/api/analytics/purchases${query}`, { method: "POST", headers, body }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: "signed-in-owner", displayName: "Owner" });
  mocks.claimPurchaseAnalytics.mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe("POST /api/analytics/purchases", () => {
  test.each([null, "https://evil.example"])("rejects origin %s before authenticating or claiming events", async (origin) => {
    const response = await call({ origin });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "bad_origin" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
    expect(mocks.claimPurchaseAnalytics).not.toHaveBeenCalled();
  });

  test.each([null, "forged-session"])("rejects an unauthenticated session %s without claiming events", async (token) => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await call({ token });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "unauthorized" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.getCurrentUser).toHaveBeenCalledExactlyOnceWith(mocks.deps, token);
    expect(mocks.claimPurchaseAnalytics).not.toHaveBeenCalled();
  });

  test("claims only the signed-in owner's events and ignores spoofed body and query identifiers", async () => {
    const event = { transactionId: "96af1ba5-dfae-4970-913e-d7387563effb", product: "matrix_report", amountKopecks: 39000 };
    mocks.claimPurchaseAnalytics.mockResolvedValue([event]);

    const response = await call({
      body: JSON.stringify({ userId: "someone-else", purchaseId: "foreign-purchase", product: "natal_report", amountKopecks: 1 }),
      query: "?userId=someone-else&purchaseId=foreign-purchase",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, events: [event] });
    expect(mocks.getCurrentUser).toHaveBeenCalledExactlyOnceWith(mocks.deps, "valid-session");
    expect(mocks.claimPurchaseAnalytics).toHaveBeenCalledExactlyOnceWith(mocks.db, "signed-in-owner");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("returns only the anonymous event whitelist even if the database adds private fields", async () => {
    const events = [
      { transactionId: "96af1ba5-dfae-4970-913e-d7387563effb", product: "matrix_report", amountKopecks: 39000 },
      { transactionId: "d19e0974-7f43-4688-ac7e-c6b7a3b2d977", product: "lila_session", amountKopecks: 29000 },
      { transactionId: "844cf802-cd69-4315-8f65-56a725369b1f", product: "natal_report", amountKopecks: 49000 },
    ];
    mocks.claimPurchaseAnalytics.mockResolvedValue(events.map((event) => ({
      ...event,
      purchaseId: "real-purchase-id",
      userId: "signed-in-owner",
      email: "private@example.test",
      birthDate: "1990-03-07",
      city: "Москва",
    })));

    const response = await call();

    expect(await response.json()).toEqual({ ok: true, events });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test.each(["", "{not json"])("requires no body data, including an unreadable body %s", async (body) => {
    const response = await call({ body });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, events: [] });
    expect(mocks.claimPurchaseAnalytics).toHaveBeenCalledExactlyOnceWith(mocks.db, "signed-in-owner");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("returns no events when no purchases remain eligible", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, events: [] });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test.each(["environment", "session", "claim"] as const)("sanitizes %s failures without logging private details", async (stage) => {
    const privateError = new Error("private@example.test real-purchase-id signed-in-owner 1990-03-07 Москва");
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));
    if (stage === "environment") mocks.getEnv.mockImplementationOnce(() => { throw privateError; });
    if (stage === "session") mocks.getCurrentUser.mockRejectedValueOnce(privateError);
    if (stage === "claim") mocks.claimPurchaseAnalytics.mockRejectedValueOnce(privateError);

    const response = await call();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "internal_error" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    if (stage !== "claim") expect(mocks.claimPurchaseAnalytics).not.toHaveBeenCalled();
  });
});
