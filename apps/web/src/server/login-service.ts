import { randomBytes } from "node:crypto";
import { getUser, upsertUserFromIdentity, type Database, type IdentityInput, type UserRecord } from "@oracle/db";
import { LEGAL_VERSIONS } from "../lib/legal";
import { DEFAULT_NEXT_PATH, safeNextPath } from "../lib/next-path";
import { signConsent, signSession, signVkState, verifyConsent, verifySession, verifyVkState } from "./auth/tokens";
import { buildVkAuthorizeUrl, createPkcePair, exchangeVkCode, fetchVkUser, type FetchFn } from "./auth/vk";
import type { AppEnv } from "./env";

export const CONSENT_VERSION = LEGAL_VERSIONS.consent;
const STATE_BYTES = 24;

export type LoginDeps = { db: Database; env: AppEnv; now: () => Date; fetchFn: FetchFn };
export type LoginCookies = { consent: string | null };
export type LoginOutcome = { ok: true; sessionToken: string; redirectTo: string } | { ok: false; error: string };

const vkRedirectUri = (env: AppEnv) => new URL("/api/auth/vk/callback", env.APP_URL).toString();

export async function giveConsent(deps: Pick<LoginDeps, "env" | "now">): Promise<string> {
  return signConsent({ version: CONSENT_VERSION, at: deps.now() }, deps.env.SESSION_SECRET);
}

export async function completeLogin(deps: LoginDeps, identity: IdentityInput, cookies: LoginCookies, next: string = DEFAULT_NEXT_PATH): Promise<LoginOutcome> {
  const consent = cookies.consent ? await verifyConsent(cookies.consent, deps.env.SESSION_SECRET) : null;
  const upserted = await upsertUserFromIdentity(deps.db, identity, consent);
  if (!upserted.ok) return { ok: false, error: "consent_required" };
  return { ok: true, sessionToken: await signSession(upserted.user.id, deps.env.SESSION_SECRET), redirectTo: safeNextPath(next) };
}

export async function startVkLogin(deps: LoginDeps, next: string = DEFAULT_NEXT_PATH): Promise<{ redirectUrl: string; stateCookie: string }> {
  const { codeVerifier, codeChallenge } = createPkcePair();
  const state = randomBytes(STATE_BYTES).toString("base64url");
  const stateCookie = await signVkState({ state, codeVerifier, next: safeNextPath(next) }, deps.env.SESSION_SECRET);
  const redirectUrl = buildVkAuthorizeUrl({ clientId: deps.env.VK_CLIENT_ID, redirectUri: vkRedirectUri(deps.env), state, codeChallenge });
  return { redirectUrl, stateCookie };
}

export async function finishVkLogin(
  deps: LoginDeps,
  p: { code: string | null; deviceId: string | null; state: string | null; stateCookie: string | null; cookies: LoginCookies },
): Promise<LoginOutcome> {
  if (!p.code || !p.deviceId || !p.state || !p.stateCookie) return { ok: false, error: "vk_missing_params" };
  const saved = await verifyVkState(p.stateCookie, deps.env.SESSION_SECRET);
  if (!saved || saved.state !== p.state) return { ok: false, error: "vk_state_mismatch" };

  const token = await exchangeVkCode({
    clientId: deps.env.VK_CLIENT_ID,
    redirectUri: vkRedirectUri(deps.env),
    code: p.code,
    codeVerifier: saved.codeVerifier,
    deviceId: p.deviceId,
    state: p.state,
    fetchFn: deps.fetchFn,
  });
  if (!token.ok) return { ok: false, error: `vk_${token.error}` };

  const profile = await fetchVkUser({ clientId: deps.env.VK_CLIENT_ID, accessToken: token.accessToken, fetchFn: deps.fetchFn });
  if (!profile.ok) return { ok: false, error: `vk_${profile.error}` };

  const { user } = profile;
  // Политика и согласие обещают хранить только имя из VK ID: фамилию не показываем нигде на сайте, поэтому не сохраняем и её
  return completeLogin(deps, { provider: "vk", externalId: user.id, displayName: user.firstName }, p.cookies, saved.next);
}

export async function getCurrentUser(deps: Pick<LoginDeps, "db" | "env">, sessionToken: string | null): Promise<UserRecord | null> {
  if (!sessionToken) return null;
  const userId = await verifySession(sessionToken, deps.env.SESSION_SECRET);
  return userId ? getUser(deps.db, userId) : null;
}
