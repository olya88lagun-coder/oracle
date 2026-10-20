import { createTestDb, getBirthProfile, type Database } from "@oracle/db/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { verifySession } from "./auth/tokens";
import type { AppEnv } from "./env";
import { completeLogin, giveConsent, type LoginDeps } from "./login-service";
import { loadPortrait, saveBirthDateForSession, saveBirthPlaceForSession, type ProfileDeps } from "./profile-service";

const NOW = new Date("2026-09-24T12:00:00Z");
const ENV: AppEnv = { APP_URL: "https://oracle.test", DATABASE_URL: "postgres://unused", SESSION_SECRET: "s".repeat(40), VK_CLIENT_ID: "555", payments: null, paidReports: false, paidLila: false, paidNatal: false, ownerVkId: null };

let db: Database;
let deps: ProfileDeps;

async function signedIn(name: string): Promise<{ sessionToken: string; userId: string }> {
  const login: LoginDeps = { db, env: ENV, now: () => NOW, fetchFn: vi.fn() };
  const outcome = await completeLogin(login, { provider: "vk", externalId: name, displayName: name }, { consent: await giveConsent(login) });
  if (!outcome.ok) throw new Error("login failed");
  return { sessionToken: outcome.sessionToken, userId: (await verifySession(outcome.sessionToken, ENV.SESSION_SECRET))! };
}

beforeEach(async () => {
  db = await createTestDb();
  deps = { db, env: ENV, now: () => NOW };
});

describe("saveBirthDateForSession", () => {
  test("requires a signed-in user", async () => {
    expect(await saveBirthDateForSession(deps, { sessionToken: null, value: "1990-03-07" })).toEqual({ ok: false, error: "unauthorized" });
    expect(await saveBirthDateForSession(deps, { sessionToken: "forged", value: "1990-03-07" })).toEqual({ ok: false, error: "unauthorized" });
  });

  test("rejects an impossible or future date", async () => {
    const { sessionToken } = await signedIn("vk-1");

    expect(await saveBirthDateForSession(deps, { sessionToken, value: "1990-02-30" })).toEqual({ ok: false, error: "invalid_date" });
    expect(await saveBirthDateForSession(deps, { sessionToken, value: "2030-01-01" })).toEqual({ ok: false, error: "invalid_date" });
  });

  test("saves the date to the signed-in user's portrait", async () => {
    const { sessionToken, userId } = await signedIn("vk-2");

    const outcome = await saveBirthDateForSession(deps, { sessionToken, value: "1990-03-07" });

    expect(outcome).toEqual({ ok: true, birthDate: { year: 1990, month: 3, day: 7 } });
    expect(await loadPortrait(deps, userId)).toEqual({ birthDate: { year: 1990, month: 3, day: 7 }, time: null, place: null });
  });
});

describe("loadPortrait", () => {
  test("has no date until one is saved", async () => {
    const { userId } = await signedIn("vk-3");

    expect(await loadPortrait(deps, userId)).toEqual({ birthDate: null, time: null, place: null });
  });
});

const BODY = { birthDate: "1990-03-07", time: "12:05", name: "Москва", latitude: 55.7558, longitude: 37.6173, zone: "Europe/Moscow" };
const PLACE = { name: "Москва", latitude: 55.7558, longitude: 37.6173, zone: "Europe/Moscow" };

describe("saveBirthPlaceForSession", () => {
  test("requires a signed-in user", async () => {
    expect(await saveBirthPlaceForSession(deps, { sessionToken: null, value: BODY })).toEqual({ ok: false, error: "unauthorized" });
    expect(await saveBirthPlaceForSession(deps, { sessionToken: "forged", value: BODY })).toEqual({ ok: false, error: "unauthorized" });
  });

  test("saves date, time and place together and the portrait returns them", async () => {
    const { sessionToken, userId } = await signedIn("vk-n1");

    expect(await saveBirthPlaceForSession(deps, { sessionToken, value: BODY })).toEqual({ ok: true });

    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1990-03-07", time: "12:05", place: PLACE });
    expect(await loadPortrait(deps, userId)).toEqual({ birthDate: { year: 1990, month: 3, day: 7 }, time: "12:05", place: PLACE });
  });

  test("accepts an unknown time (null), trims the name and ignores unknown keys", async () => {
    const { sessionToken, userId } = await signedIn("vk-n2");

    const outcome = await saveBirthPlaceForSession(deps, { sessionToken, value: { ...BODY, time: null, name: "  Москва ", extra: { x: 1 }, id: "other" } });

    expect(outcome).toEqual({ ok: true });
    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1990-03-07", time: null, place: PLACE });
  });

  test("accepts the limits: 85 degrees, 180 degrees, a 120-character name", async () => {
    const { sessionToken } = await signedIn("vk-n3");
    const name = "а".repeat(120);

    expect(await saveBirthPlaceForSession(deps, { sessionToken, value: { ...BODY, latitude: 85, longitude: -180, name } })).toEqual({ ok: true });
    expect(await saveBirthPlaceForSession(deps, { sessionToken, value: { ...BODY, latitude: -85, longitude: 180, time: "23:59" } })).toEqual({ ok: true });
  });

  const INVALID: [string, unknown][] = [
    ["a missing body", undefined],
    ["null", null],
    ["a string body", "1990-03-07"],
    ["an array body", [BODY]],
    ["a missing date", { ...BODY, birthDate: undefined }],
    ["an impossible date", { ...BODY, birthDate: "1990-02-30" }],
    ["a future date", { ...BODY, birthDate: "2030-01-01" }],
    ["a date before 1900", { ...BODY, birthDate: "1899-12-31" }],
    ["a date as an object", { ...BODY, birthDate: { year: 1990, month: 3, day: 7 } }],
    ["24:00", { ...BODY, time: "24:00" }],
    ["7:5", { ...BODY, time: "7:5" }],
    ["12:60", { ...BODY, time: "12:60" }],
    ["a time with seconds", { ...BODY, time: "12:05:00" }],
    ["a missing time (must be null, not absent)", { ...BODY, time: undefined }],
    ["a numeric time", { ...BODY, time: 1205 }],
    ["an empty name", { ...BODY, name: "" }],
    ["a blank name", { ...BODY, name: "   " }],
    ["a 121-character name", { ...BODY, name: "а".repeat(121) }],
    ["a huge name", { ...BODY, name: "а".repeat(100_000) }],
    ["a name with a newline", { ...BODY, name: "Мос\nква" }],
    ["a name with a NUL", { ...BODY, name: "Мос\u0000ква" }],
    ["an array name", { ...BODY, name: ["Москва"] }],
    ["a numeric name", { ...BODY, name: 5 }],
    ["latitude as a string", { ...BODY, latitude: "55.7" }],
    ["latitude NaN", { ...BODY, latitude: Number.NaN }],
    ["latitude Infinity", { ...BODY, latitude: Number.POSITIVE_INFINITY }],
    ["latitude above 85", { ...BODY, latitude: 85.01 }],
    ["latitude below -85", { ...BODY, latitude: -85.01 }],
    ["latitude as an array", { ...BODY, latitude: [55] }],
    ["longitude as a string", { ...BODY, longitude: "37.6" }],
    ["longitude -Infinity", { ...BODY, longitude: Number.NEGATIVE_INFINITY }],
    ["longitude above 180", { ...BODY, longitude: 180.01 }],
    ["longitude as an object", { ...BODY, longitude: { v: 37 } }],
    ["a missing zone", { ...BODY, zone: undefined }],
    ["an empty zone", { ...BODY, zone: "" }],
    ["an unknown zone", { ...BODY, zone: "Not/AZone" }],
    ["an offset instead of a zone", { ...BODY, zone: "+03:00" }],
    ["a 65-character zone", { ...BODY, zone: "A".repeat(65) }],
    ["a huge zone", { ...BODY, zone: "A".repeat(100_000) }],
    ["a zone as an array", { ...BODY, zone: ["Europe/Moscow"] }],
  ];

  test.each(INVALID)("rejects %s without touching the portrait", async (_name, value) => {
    const { sessionToken, userId } = await signedIn(`vk-bad-${_name.length}-${Math.random()}`);

    expect(await saveBirthPlaceForSession(deps, { sessionToken, value })).toEqual({ ok: false, error: "invalid" });
    expect(await getBirthProfile(db, userId)).toBeNull();
  });

  test("a rejected save leaves the previous data in place", async () => {
    const { sessionToken, userId } = await signedIn("vk-n4");
    await saveBirthPlaceForSession(deps, { sessionToken, value: BODY });

    await saveBirthPlaceForSession(deps, { sessionToken, value: { ...BODY, birthDate: "1991-04-08", latitude: 999 } });

    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1990-03-07", time: "12:05", place: PLACE });
  });
});
