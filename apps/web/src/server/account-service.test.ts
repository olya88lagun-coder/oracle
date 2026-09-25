import { createTestDb, getBirthDate, getUser, saveBirthDate, type Database } from "@oracle/db/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { verifySession } from "./auth/tokens";
import { deleteAccount } from "./account-service";
import type { AppEnv } from "./env";
import { completeLogin, giveConsent } from "./login-service";

const ENV: AppEnv = { APP_URL: "https://oracle.test", DATABASE_URL: "postgres://unused", SESSION_SECRET: "s".repeat(40), VK_CLIENT_ID: "555" };

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

describe("deleteAccount", () => {
  test("refuses without a session", async () => {
    expect(await deleteAccount({ db, env: ENV }, { sessionToken: null })).toEqual({ ok: false, error: "unauthorized" });
  });

  test("deletes only the signed-in user's data and ends the session", async () => {
    const login = { db, env: ENV, now: () => new Date(), fetchFn: vi.fn() };
    const outcome = await completeLogin(login, { provider: "vk", externalId: "vk-1", displayName: "Аня" }, { consent: await giveConsent(login) });
    const sessionToken = outcome.ok ? outcome.sessionToken : null;
    const userId = (await verifySession(sessionToken!, ENV.SESSION_SECRET))!;
    await saveBirthDate(db, userId, "1990-03-07", new Date());

    expect(await deleteAccount({ db, env: ENV }, { sessionToken })).toEqual({ ok: true });

    expect(await getUser(db, userId)).toBeNull();
    expect(await getBirthDate(db, userId)).toBeNull();
    expect(await deleteAccount({ db, env: ENV }, { sessionToken })).toEqual({ ok: false, error: "unauthorized" });
  });
});
