import { createTestDb, type Database } from "@oracle/db/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { verifySession } from "./auth/tokens";
import type { AppEnv } from "./env";
import { completeLogin, giveConsent, type LoginDeps } from "./login-service";
import { loadPortrait, saveBirthDateForSession, type ProfileDeps } from "./profile-service";

const NOW = new Date("2026-09-24T12:00:00Z");
const ENV: AppEnv = { APP_URL: "https://oracle.test", DATABASE_URL: "postgres://unused", SESSION_SECRET: "s".repeat(40), VK_CLIENT_ID: "555" };

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
    expect(await loadPortrait(deps, userId)).toEqual({ birthDate: { year: 1990, month: 3, day: 7 } });
  });
});

describe("loadPortrait", () => {
  test("has no date until one is saved", async () => {
    const { userId } = await signedIn("vk-3");

    expect(await loadPortrait(deps, userId)).toEqual({ birthDate: null });
  });
});
