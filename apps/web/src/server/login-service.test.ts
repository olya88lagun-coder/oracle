import { createTestDb, getUser, type Database } from "@oracle/db/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { verifySession } from "./auth/tokens";
import type { AppEnv } from "./env";
import { completeLogin, finishVkLogin, getCurrentUser, giveConsent, startVkLogin, type LoginCookies, type LoginDeps } from "./login-service";

const NOW = new Date("2026-09-24T12:00:00Z");
const ENV: AppEnv = { APP_URL: "https://oracle.test", DATABASE_URL: "postgres://unused", SESSION_SECRET: "s".repeat(40), VK_CLIENT_ID: "555" };
const NO_COOKIES: LoginCookies = { consent: null };
const ANNA = { provider: "vk", externalId: "42", displayName: "Аня" } as const;

let db: Database;
let deps: LoginDeps;

const jsonResponse = (body: unknown) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });

async function userIdOf(outcome: Awaited<ReturnType<typeof completeLogin>>): Promise<string | null> {
  return outcome.ok ? verifySession(outcome.sessionToken, ENV.SESSION_SECRET) : null;
}

beforeEach(async () => {
  db = await createTestDb();
  deps = { db, env: ENV, now: () => NOW, fetchFn: vi.fn() };
});

describe("completeLogin", () => {
  test("does not create a user without consent", async () => {
    expect(await completeLogin(deps, ANNA, NO_COOKIES)).toEqual({ ok: false, error: "consent_required" });
  });

  test("creates a user with consent and opens the portrait", async () => {
    const outcome = await completeLogin(deps, ANNA, { consent: await giveConsent(deps) });

    expect(outcome.ok && outcome.redirectTo).toBe("/portret");
    const userId = await userIdOf(outcome);
    expect(userId && (await getUser(db, userId))?.displayName).toBe("Аня");
  });

  test("ignores a forged consent cookie", async () => {
    expect(await completeLogin(deps, ANNA, { consent: "forged" })).toEqual({ ok: false, error: "consent_required" });
  });

  test("lets a returning user in without a new consent", async () => {
    const first = await completeLogin(deps, ANNA, { consent: await giveConsent(deps) });

    const second = await completeLogin(deps, ANNA, NO_COOKIES);

    expect(await userIdOf(second)).toBe(await userIdOf(first));
  });
});

describe("VK ID login", () => {
  async function finishWith(fetchFn: LoginDeps["fetchFn"], consent: string | null) {
    const { redirectUrl, stateCookie } = await startVkLogin(deps);
    const state = new URL(redirectUrl).searchParams.get("state");
    deps.fetchFn = fetchFn;
    return finishVkLogin(deps, { code: "code", deviceId: "device", state, stateCookie, cookies: { consent } });
  }

  test("sends the user to VK ID with PKCE and our callback address", async () => {
    const { redirectUrl } = await startVkLogin(deps);
    const params = new URL(redirectUrl).searchParams;

    expect(params.get("client_id")).toBe("555");
    expect(params.get("redirect_uri")).toBe("https://oracle.test/api/auth/vk/callback");
    expect(params.get("code_challenge_method")).toBe("S256");
  });

  test("round-trips state and creates a user with the full name from VK", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "at" }))
      .mockResolvedValueOnce(jsonResponse({ user: { user_id: 777, first_name: "Аня", last_name: "Петрова" } }));

    const outcome = await finishWith(fetchFn, await giveConsent(deps));

    const userId = await userIdOf(outcome);
    expect(userId && (await getUser(db, userId))?.displayName).toBe("Аня Петрова");
  });

  test("reports the token exchange error with a vk_ prefix", async () => {
    const outcome = await finishWith(vi.fn().mockResolvedValueOnce(jsonResponse({ error: "invalid_grant" })), null);

    expect(outcome).toEqual({ ok: false, error: "vk_invalid_grant" });
  });

  test("rejects a state that does not match the signed cookie", async () => {
    const { stateCookie } = await startVkLogin(deps);

    const outcome = await finishVkLogin(deps, { code: "c", deviceId: "d", state: "forged", stateCookie, cookies: NO_COOKIES });

    expect(outcome).toEqual({ ok: false, error: "vk_state_mismatch" });
  });

  test("reports missing callback parameters", async () => {
    const outcome = await finishVkLogin(deps, { code: null, deviceId: "d", state: "s", stateCookie: "x", cookies: NO_COOKIES });

    expect(outcome).toEqual({ ok: false, error: "vk_missing_params" });
  });
});

describe("getCurrentUser", () => {
  test("returns the signed-in user and null for anonymous or forged sessions", async () => {
    const outcome = await completeLogin(deps, ANNA, { consent: await giveConsent(deps) });
    const token = outcome.ok ? outcome.sessionToken : null;

    expect((await getCurrentUser(deps, token))?.displayName).toBe("Аня");
    expect(await getCurrentUser(deps, null)).toBeNull();
    expect(await getCurrentUser(deps, "forged")).toBeNull();
  });
});
