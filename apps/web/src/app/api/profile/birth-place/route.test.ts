import { createTestDb, getBirthProfile, type Database } from "@oracle/db/testing";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AppEnv } from "@/server/env";
import { completeLogin, giveConsent, type LoginDeps } from "@/server/login-service";
import { verifySession } from "@/server/auth/tokens";
import { SESSION_COOKIE } from "@/server/http";

const NOW = new Date("2026-09-24T12:00:00Z");
const ENV: AppEnv = { APP_URL: "https://oracle.test", DATABASE_URL: "postgres://unused", SESSION_SECRET: "s".repeat(40), VK_CLIENT_ID: "555", payments: null, paidReports: false, paidLila: false, paidNatal: false, ownerVkId: null };
const BODY = { birthDate: "1990-03-07", time: "12:05", name: "Москва", latitude: 55.7558, longitude: 37.6173, zone: "Europe/Moscow" };

let db: Database;

vi.mock("@/server/deps", () => ({
  loginDeps: (): LoginDeps => ({ db, env: ENV, now: () => NOW, fetchFn: vi.fn() }),
}));

const { POST } = await import("./route");

let nextClient = 0;
// У каждого теста свой адрес клиента: лимит считается по адресу и живёт в памяти процесса
const freshClient = () => `10.2.0.${(nextClient += 1)}`;

type CallOptions = { token?: string | null; origin?: string | null; client?: string; rawBody?: string };

function call(body: unknown, { token = null, origin = ENV.APP_URL, client = freshClient(), rawBody }: CallOptions = {}) {
  const headers = new Headers({ "content-type": "application/json", "x-forwarded-for": client });
  if (origin !== null) headers.set("origin", origin);
  if (token) headers.set("cookie", `${SESSION_COOKIE}=${token}`);
  return POST(new NextRequest("https://oracle.test/api/profile/birth-place", { method: "POST", headers, body: rawBody ?? JSON.stringify(body) }));
}

async function signedIn(name: string): Promise<{ token: string; userId: string }> {
  const login: LoginDeps = { db, env: ENV, now: () => NOW, fetchFn: vi.fn() };
  const outcome = await completeLogin(login, { provider: "vk", externalId: name, displayName: name }, { consent: await giveConsent(login) });
  if (!outcome.ok) throw new Error("login failed");
  return { token: outcome.sessionToken, userId: (await verifySession(outcome.sessionToken, ENV.SESSION_SECRET))! };
}

beforeEach(async () => {
  db = await createTestDb();
});
afterEach(() => vi.restoreAllMocks());

describe("POST /api/profile/birth-place", () => {
  test("answers 401 without a session or with a forged one, and stores nothing", async () => {
    expect((await call(BODY)).status).toBe(401);
    expect((await call(BODY, { token: "forged" })).status).toBe(401);
  });

  test("answers 403 for a missing or foreign origin before looking at the session", async () => {
    const { token, userId } = await signedIn("vk-r1");

    const foreign = await call(BODY, { token, origin: "https://evil.example" });
    const missing = await call(BODY, { token, origin: null });

    expect(foreign.status).toBe(403);
    expect(missing.status).toBe(403);
    expect(await getBirthProfile(db, userId)).toBeNull();
  });

  test("answers 400 for a body that is not JSON, and for JSON that is not an object", async () => {
    const { token } = await signedIn("vk-r2");

    expect((await call(null, { token, rawBody: "{not json" })).status).toBe(400);
    expect((await call(null, { token, rawBody: "" })).status).toBe(400);
    expect((await call("1990-03-07", { token })).status).toBe(400);
    expect((await call([BODY], { token })).status).toBe(400);
    expect((await call(null, { token })).status).toBe(400);
  });

  const INVALID: [string, Record<string, unknown>][] = [
    ["date", { birthDate: "1990-02-30" }],
    ["future date", { birthDate: "2030-01-01" }],
    ["time 24:00", { time: "24:00" }],
    ["time 7:5", { time: "7:5" }],
    ["empty name", { name: "" }],
    ["too long name", { name: "а".repeat(121) }],
    ["name with a control character", { name: "Мос\u0007ква" }],
    ["latitude as a string", { latitude: "55.7" }],
    ["latitude 86", { latitude: 86 }],
    ["longitude 181", { longitude: 181 }],
    ["unknown zone", { zone: "Not/AZone" }],
    ["too long zone", { zone: "A".repeat(65) }],
  ];

  test.each(INVALID)("answers 400 for an invalid %s and stores nothing", async (_field, patch) => {
    const { token, userId } = await signedIn(`vk-bad-${_field}`);

    const response = await call({ ...BODY, ...patch }, { token });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "invalid" });
    expect(await getBirthProfile(db, userId)).toBeNull();
  });

  test("answers 400 for NaN and Infinity coordinates sent as non-JSON numbers", async () => {
    const { token } = await signedIn("vk-r3");

    expect((await call(null, { token, rawBody: '{"birthDate":"1990-03-07","time":null,"name":"М","latitude":NaN,"longitude":1,"zone":"Europe/Moscow"}' })).status).toBe(400);
    expect((await call({ ...BODY, latitude: 1e999 }, { token })).status).toBe(400);
  });

  test("answers 200 with a bare { ok: true } and stores date, time and place", async () => {
    const { token, userId } = await signedIn("vk-r4");

    const response = await call(BODY, { token });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(await getBirthProfile(db, userId)).toEqual({
      birthDate: "1990-03-07",
      time: "12:05",
      place: { name: "Москва", latitude: 55.7558, longitude: 37.6173, zone: "Europe/Moscow" },
    });
  });

  test("stores an unknown time as null", async () => {
    const { token, userId } = await signedIn("vk-r5");

    expect((await call({ ...BODY, time: null }, { token })).status).toBe(200);

    expect((await getBirthProfile(db, userId))?.time).toBeNull();
  });

  test("answers 429 on the 21st request from one client and counts clients separately", async () => {
    const { token } = await signedIn("vk-r6");
    const client = freshClient();
    for (let i = 0; i < 20; i += 1) expect((await call(BODY, { token, client })).status).toBe(200);

    const limited = await call(BODY, { token, client });

    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ ok: false, error: "rate_limited" });
    expect((await call(BODY, { token })).status).toBe(200);
  });

  test("never writes the birth data to any log, and never echoes it in a response", async () => {
    const { token } = await signedIn("vk-r7");
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));

    const ok = await (await call(BODY, { token })).text();
    const bad = await (await call({ ...BODY, name: "" }, { token })).text();
    const noSession = await (await call(BODY)).text();

    for (const text of [ok, bad, noSession]) {
      for (const secret of ["Москва", "1990-03-07", "12:05", "55.7558", "37.6173"]) expect(text).not.toContain(secret);
    }
    for (const spy of spies) expect(JSON.stringify(spy.mock.calls)).not.toMatch(/Москва|1990-03-07|12:05|55\.7558|37\.6173/);
  });
});
