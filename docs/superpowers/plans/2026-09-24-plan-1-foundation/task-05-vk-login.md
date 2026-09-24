# Задача 5 — Вход через VK ID с согласием

**Files:**
- Create: `apps/web/src/server/http.ts`; Test: `apps/web/src/server/http.test.ts`
- Create: `apps/web/src/server/auth/tokens.ts`, `apps/web/src/server/auth/vk.ts`; Test: `apps/web/src/server/auth/tokens.test.ts`, `apps/web/src/server/auth/vk.test.ts`
- Create: `apps/web/src/server/login-service.ts`; Test: `apps/web/src/server/login-service.test.ts`
- Create: `apps/web/src/server/login-response.ts`, `apps/web/src/server/deps.ts`, `apps/web/src/server/viewer.ts`
- Create: `apps/web/src/server/dev-login.ts`; Test: `apps/web/src/server/dev-login.test.ts`
- Create: `apps/web/src/lib/login-mark.ts`, `apps/web/src/lib/login-errors.ts`; Test: `apps/web/src/lib/login-mark.test.ts`, `apps/web/src/lib/login-errors.test.ts`
- Create: `apps/web/src/app/api/consent/route.ts`, `apps/web/src/app/api/auth/vk/start/route.ts`, `apps/web/src/app/api/auth/vk/callback/route.ts`, `apps/web/src/app/api/auth/logout/route.ts`, `apps/web/src/app/api/dev/login/route.ts`
- Create: `apps/web/src/app/login/page.tsx`, `apps/web/src/app/login/LoginPanel.tsx`

**Interfaces:**
- Consumes: `upsertUserFromIdentity`, `getUser`, `type Database`, `type IdentityInput`, `type Consent`, `type UserRecord`, `createTestDb` из `@oracle/db`; `AppEnv`, `getEnv` (задача 3); `getDb` (задача 3); `LEGAL_VERSIONS` (задача 4).
- Produces:
  - cookie: `SESSION_COOKIE = "oracle_session"`, `CONSENT_COOKIE = "oracle_consent"`, `VK_STATE_COOKIE = "oracle_vk_oauth"`; `sessionCookieOptions(appUrl)`, `consentCookieOptions(appUrl)`, `vkStateCookieOptions(appUrl)`, `expiredCookieOptions(options)`, `isSameOrigin(request, appUrl)`
  - `signSession`/`verifySession`, `signVkState`/`verifyVkState`, `signConsent`/`verifyConsent`
  - `type LoginDeps = { db: Database; env: AppEnv; now: () => Date; fetchFn: FetchFn }`; `type LoginCookies = { consent: string | null }`; `type LoginOutcome = { ok: true; sessionToken: string; redirectTo: string } | { ok: false; error: string }`
  - `CONSENT_VERSION`; `giveConsent(deps)`, `completeLogin(deps, identity, cookies)`, `startVkLogin(deps)`, `finishVkLogin(deps, p)`, `getCurrentUser(deps, sessionToken)`
  - `loginDeps(): LoginDeps`; `currentUser(): Promise<UserRecord | null>`; `requireUser(): Promise<UserRecord>` (без сессии — редирект на `/login`)
  - `LOGIN_MARK`, `withLoginMark(path)` — метка для цели Метрики `login` (задача 7)
  - `loginErrorMessage(code: string | null): string | null`
  - маршруты: `POST /api/consent`, `GET /api/auth/vk/start`, `GET /api/auth/vk/callback`, `POST /api/auth/logout`, `GET /api/dev/login?name=...` (только `DEV_LOGIN=1` и не production)

## Зачем

Спецификация 4, п. 5: «Сохранить в портрет» → вход через VK ID, предлагаем, а не требуем. Логика входа уже отлажена в Гранях (`C:\dev\grani-test\apps\web\src\server\`): VK ID OAuth 2.1 с PKCE, `state` в подписанной cookie, согласие фиксируется подписанной cookie до перехода в VK (VK не возвращает наши параметры), сессия — JWT на 30 дней. Здесь она переносится без Telegram, без отложенных ответов теста и без пола. После входа человек попадает в портрет.

## Шаги

- [ ] **Шаг 1. Тесты примитивов (RED).**

`apps/web/src/server/http.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { expiredCookieOptions, isSameOrigin, sessionCookieOptions, vkStateCookieOptions } from "./http";

describe("cookie options", () => {
  test("are secure on https and relaxed on local http", () => {
    expect(sessionCookieOptions("https://oracle.test")).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2592000 });
    expect(sessionCookieOptions("http://localhost:3000").secure).toBe(false);
  });

  test("the VK state cookie is sent only to the VK routes", () => {
    expect(vkStateCookieOptions("https://oracle.test")).toMatchObject({ path: "/api/auth/vk", maxAge: 600 });
  });

  test("an expired copy keeps the path and zeroes the age", () => {
    expect(expiredCookieOptions(vkStateCookieOptions("https://oracle.test"))).toMatchObject({ path: "/api/auth/vk", maxAge: 0 });
  });
});

describe("isSameOrigin", () => {
  const post = (origin: string | null) => new Request("https://oracle.test/api/consent", { method: "POST", headers: origin ? { origin } : {} });

  test("accepts only the site's own origin", () => {
    expect(isSameOrigin(post("https://oracle.test"), "https://oracle.test")).toBe(true);
    expect(isSameOrigin(post("https://evil.test"), "https://oracle.test")).toBe(false);
    expect(isSameOrigin(post(null), "https://oracle.test")).toBe(false);
  });
});
```

`apps/web/src/server/auth/tokens.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { signConsent, signSession, signVkState, verifyConsent, verifySession, verifyVkState } from "./tokens";

const SECRET = "a".repeat(64);

describe("session tokens", () => {
  test("round-trip a user id", async () => {
    expect(await verifySession(await signSession("user-1", SECRET), SECRET)).toBe("user-1");
  });

  test("reject another secret and garbage", async () => {
    expect(await verifySession(await signSession("user-1", "b".repeat(64)), SECRET)).toBeNull();
    expect(await verifySession("not-a-jwt", SECRET)).toBeNull();
  });
});

describe("vk state tokens", () => {
  test("round-trip the state and verifier", async () => {
    const payload = { state: "st-1", codeVerifier: "ver-1" };

    expect(await verifyVkState(await signVkState(payload, SECRET), SECRET)).toEqual(payload);
  });
});

describe("consent tokens", () => {
  test("round-trip the version and time with second precision", async () => {
    const consent = { version: "2026-09-v1", at: new Date("2026-09-24T10:00:00.750Z") };

    expect(await verifyConsent(await signConsent(consent, SECRET), SECRET)).toEqual({ version: "2026-09-v1", at: new Date("2026-09-24T10:00:00.000Z") });
  });
});

describe("audiences", () => {
  test("a token of one kind is never accepted as another", async () => {
    const session = await signSession("user-1", SECRET);
    const consent = await signConsent({ version: "v", at: new Date() }, SECRET);
    const state = await signVkState({ state: "s", codeVerifier: "v" }, SECRET);

    expect(await verifyConsent(session, SECRET)).toBeNull();
    expect(await verifySession(consent, SECRET)).toBeNull();
    expect(await verifyVkState(session, SECRET)).toBeNull();
    expect(await verifySession(state, SECRET)).toBeNull();
  });
});
```

`apps/web/src/server/auth/vk.test.ts` — перенести из Граней и поправить:

```bash
cp /c/dev/grani-test/apps/web/src/server/auth/vk.test.ts apps/web/src/server/auth/vk.test.ts
sed -i 's#https://grani-test.ru#https://oracle.test#g' apps/web/src/server/auth/vk.test.ts
```

Затем в этом файле заменить весь блок `describe("fetchVkUser", ...)` на:

```ts
describe("fetchVkUser", () => {
  test("reads the id and names, turning an empty last name into null", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ user: { user_id: 777, first_name: "Аня", last_name: "", sex: 1 } }));

    expect(await fetchVkUser({ clientId: "123", accessToken: "at-1", fetchFn })).toEqual({
      ok: true,
      user: { id: "777", firstName: "Аня", lastName: null },
    });
  });

  test("fails on a malformed response", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ user: {} }));

    expect(await fetchVkUser({ clientId: "1", accessToken: "a", fetchFn })).toEqual({ ok: false, error: "malformed_user_info" });
  });

  test("reports a network failure as an error instead of throwing", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("ECONNRESET"));

    expect(await fetchVkUser({ clientId: "1", accessToken: "a", fetchFn })).toEqual({ ok: false, error: "network" });
  });
});
```

`apps/web/src/lib/login-mark.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { LOGIN_MARK, withLoginMark } from "./login-mark";

describe("withLoginMark", () => {
  test("adds the mark to a bare path", () => {
    expect(withLoginMark("/portret")).toBe(`/portret?${LOGIN_MARK.param}=${LOGIN_MARK.value}`);
  });

  test("keeps the existing query and hash", () => {
    expect(withLoginMark("/portret?tab=1#date")).toBe("/portret?tab=1&from=login#date");
  });
});
```

`apps/web/src/lib/login-errors.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { loginErrorMessage } from "./login-errors";

describe("loginErrorMessage", () => {
  test("is silent without an error", () => {
    expect(loginErrorMessage(null)).toBeNull();
  });

  test("explains known errors in plain words", () => {
    expect(loginErrorMessage("consent_required")).toMatch(/согласие/);
    expect(loginErrorMessage("vk_state_mismatch")).toMatch(/слишком много времени/);
  });

  test("falls back to a generic message and never shows the raw code", () => {
    const message = loginErrorMessage("vk_invalid_grant");

    expect(message).toMatch(/VK ID/);
    expect(message).not.toMatch(/invalid_grant/);
  });
});
```

`apps/web/src/server/dev-login.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { isDevLoginEnabled } from "./dev-login";

describe("isDevLoginEnabled", () => {
  test("works only when explicitly switched on outside production", () => {
    expect(isDevLoginEnabled({ DEV_LOGIN: "1", NODE_ENV: "development" })).toBe(true);
    expect(isDevLoginEnabled({ DEV_LOGIN: "1", NODE_ENV: "production" })).toBe(false);
    expect(isDevLoginEnabled({ NODE_ENV: "development" })).toBe(false);
  });
});
```

Запуск: `pnpm vitest run apps/web`. Ожидается FAIL: модули не найдены.

- [ ] **Шаг 2. Примитивы.**

`apps/web/src/server/http.ts`:

```ts
export const SESSION_COOKIE = "oracle_session";
export const CONSENT_COOKIE = "oracle_consent";
export const VK_STATE_COOKIE = "oracle_vk_oauth";

const DAY_SECONDS = 86400;
const SESSION_MAX_AGE_SECONDS = 30 * DAY_SECONDS;
const CONSENT_MAX_AGE_SECONDS = 3600;
const VK_STATE_MAX_AGE_SECONDS = 600;

export type CookieOptions = { httpOnly: true; secure: boolean; sameSite: "lax"; path: string; maxAge: number };

function options(appUrl: string, maxAge: number, path = "/"): CookieOptions {
  return { httpOnly: true, secure: appUrl.startsWith("https://"), sameSite: "lax", path, maxAge };
}

export const sessionCookieOptions = (appUrl: string) => options(appUrl, SESSION_MAX_AGE_SECONDS);
export const consentCookieOptions = (appUrl: string) => options(appUrl, CONSENT_MAX_AGE_SECONDS);
export const vkStateCookieOptions = (appUrl: string) => options(appUrl, VK_STATE_MAX_AGE_SECONDS, "/api/auth/vk");

export function expiredCookieOptions(cookie: CookieOptions): CookieOptions {
  return { ...cookie, maxAge: 0 };
}

export function isSameOrigin(request: Request, appUrl: string): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(appUrl).origin;
}
```

`apps/web/src/server/auth/tokens.ts`:

```ts
import type { Consent } from "@oracle/db";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

const SESSION_TTL = "30d";
const VK_STATE_TTL = "10m";
const CONSENT_TTL = "1h";

const AUDIENCE = { session: "session", vkState: "vk-state", consent: "consent" } as const;

const key = (secret: string) => new TextEncoder().encode(secret);

async function sign(payload: JWTPayload, audience: string, ttl: string, secret: string, subject?: string): Promise<string> {
  const jwt = new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setAudience(audience).setIssuedAt().setExpirationTime(ttl);
  return (subject ? jwt.setSubject(subject) : jwt).sign(key(secret));
}

async function verify(token: string, audience: string, secret: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), { audience, algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export async function signSession(userId: string, secret: string): Promise<string> {
  return sign({}, AUDIENCE.session, SESSION_TTL, secret, userId);
}

export async function verifySession(token: string, secret: string): Promise<string | null> {
  const payload = await verify(token, AUDIENCE.session, secret);
  return typeof payload?.sub === "string" ? payload.sub : null;
}

export type VkState = { state: string; codeVerifier: string };

export async function signVkState(state: VkState, secret: string): Promise<string> {
  return sign({ ...state }, AUDIENCE.vkState, VK_STATE_TTL, secret);
}

export async function verifyVkState(token: string, secret: string): Promise<VkState | null> {
  const payload = await verify(token, AUDIENCE.vkState, secret);
  if (typeof payload?.state !== "string" || typeof payload.codeVerifier !== "string") return null;
  return { state: payload.state, codeVerifier: payload.codeVerifier };
}

// Время согласия — это iat токена: его нельзя подменить, не зная секрета
export async function signConsent(consent: Consent, secret: string): Promise<string> {
  const iat = Math.floor(consent.at.getTime() / 1000);
  return new SignJWT({ version: consent.version }).setProtectedHeader({ alg: "HS256" }).setAudience(AUDIENCE.consent).setIssuedAt(iat).setExpirationTime(CONSENT_TTL).sign(key(secret));
}

export async function verifyConsent(token: string, secret: string): Promise<Consent | null> {
  const payload = await verify(token, AUDIENCE.consent, secret);
  if (typeof payload?.version !== "string" || typeof payload.iat !== "number") return null;
  return { version: payload.version, at: new Date(payload.iat * 1000) };
}
```

`apps/web/src/server/auth/vk.ts`:

```ts
import { createHash, randomBytes } from "node:crypto";

export const VK_ID_HOST = "https://id.vk.ru";
const VK_SCOPE = "vkid.personal_info";
const FORM_HEADERS = { "content-type": "application/x-www-form-urlencoded" };
const PKCE_VERIFIER_BYTES = 48;

export type FetchFn = (input: string, init: RequestInit) => Promise<Response>;
export type VkUser = { id: string; firstName: string; lastName: string | null };

export function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomBytes(PKCE_VERIFIER_BYTES).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildVkAuthorizeUrl(p: { clientId: string; redirectUri: string; state: string; codeChallenge: string }): string {
  const url = new URL("/authorize", VK_ID_HOST);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    state: p.state,
    code_challenge: p.codeChallenge,
    code_challenge_method: "S256",
    scope: VK_SCOPE,
  }).toString();
  return url.toString();
}

async function postForm(fetchFn: FetchFn, path: string, form: Record<string, string>): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetchFn(`${VK_ID_HOST}${path}`, { method: "POST", headers: FORM_HEADERS, body: new URLSearchParams(form).toString() });
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function exchangeVkCode(p: {
  clientId: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
  deviceId: string;
  state: string;
  fetchFn: FetchFn;
}): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const body = await postForm(p.fetchFn, "/oauth2/auth", {
    grant_type: "authorization_code",
    code: p.code,
    code_verifier: p.codeVerifier,
    client_id: p.clientId,
    device_id: p.deviceId,
    redirect_uri: p.redirectUri,
    state: p.state,
  });
  if (body === null) return { ok: false, error: "network" };
  if (typeof body.access_token === "string") return { ok: true, accessToken: body.access_token };
  return { ok: false, error: typeof body.error === "string" ? body.error : "token_exchange_failed" };
}

// Пол из VK ID не читается: обращение на сайте нейтральное, лишние данные не храним
export async function fetchVkUser(p: { clientId: string; accessToken: string; fetchFn: FetchFn }): Promise<{ ok: true; user: VkUser } | { ok: false; error: string }> {
  const body = await postForm(p.fetchFn, "/oauth2/user_info", { access_token: p.accessToken, client_id: p.clientId });
  if (body === null) return { ok: false, error: "network" };
  const user = body.user as Record<string, unknown> | undefined;
  const id = user?.user_id;
  if (!user || (typeof id !== "string" && typeof id !== "number") || typeof user.first_name !== "string") return { ok: false, error: "malformed_user_info" };
  const lastName = typeof user.last_name === "string" && user.last_name.length > 0 ? user.last_name : null;
  return { ok: true, user: { id: String(id), firstName: user.first_name, lastName } };
}
```

`apps/web/src/lib/login-mark.ts`:

```ts
// Вход — серверный редирект, поэтому цель Метрики отмечается меткой в адресе и снимается на первой странице после входа
export const LOGIN_MARK = { param: "from", value: "login" } as const;

// Хост не важен: нужен только разбор пути; наружу уходят путь, параметры и якорь
const PARSE_BASE = "http://localhost";

export function withLoginMark(path: string): string {
  const url = new URL(path, PARSE_BASE);
  url.searchParams.set(LOGIN_MARK.param, LOGIN_MARK.value);
  return `${url.pathname}${url.search}${url.hash}`;
}
```

`apps/web/src/lib/login-errors.ts`:

```ts
const MESSAGES: Readonly<Record<string, string>> = {
  consent_required: "Чтобы войти в первый раз, отметьте согласие на обработку данных и попробуйте ещё раз.",
  vk_state_mismatch: "Вход через VK ID занял слишком много времени. Попробуйте ещё раз.",
  vk_missing_params: "VK ID не вернул данные для входа. Попробуйте ещё раз.",
};

const FALLBACK = "Не получилось войти через VK ID. Попробуйте ещё раз чуть позже.";

export function loginErrorMessage(code: string | null): string | null {
  if (code === null) return null;
  return MESSAGES[code] ?? FALLBACK;
}
```

`apps/web/src/server/dev-login.ts`:

```ts
export function isDevLoginEnabled(env: Record<string, string | undefined>): boolean {
  return env.NODE_ENV !== "production" && env.DEV_LOGIN === "1";
}
```

Запуск: `pnpm vitest run apps/web`. Ожидается PASS для всех, кроме ещё не написанного `login-service.test.ts`.

- [ ] **Шаг 3. Тест сервиса входа (RED).** `apps/web/src/server/login-service.test.ts`:

```ts
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
```

Запуск: `pnpm vitest run apps/web/src/server/login-service.test.ts`. Ожидается FAIL: модуль не найден.

- [ ] **Шаг 4. Сервис входа и обвязка.**

`apps/web/src/server/login-service.ts`:

```ts
import { randomBytes } from "node:crypto";
import { getUser, upsertUserFromIdentity, type Database, type IdentityInput, type UserRecord } from "@oracle/db";
import { LEGAL_VERSIONS } from "../lib/legal";
import { signConsent, signSession, signVkState, verifyConsent, verifySession, verifyVkState } from "./auth/tokens";
import { buildVkAuthorizeUrl, createPkcePair, exchangeVkCode, fetchVkUser, type FetchFn } from "./auth/vk";
import type { AppEnv } from "./env";

export const CONSENT_VERSION = LEGAL_VERSIONS.consent;
const STATE_BYTES = 24;
const AFTER_LOGIN_PATH = "/portret";

export type LoginDeps = { db: Database; env: AppEnv; now: () => Date; fetchFn: FetchFn };
export type LoginCookies = { consent: string | null };
export type LoginOutcome = { ok: true; sessionToken: string; redirectTo: string } | { ok: false; error: string };

const vkRedirectUri = (env: AppEnv) => new URL("/api/auth/vk/callback", env.APP_URL).toString();
const fullName = (first: string, last: string | null) => [first, last].filter(Boolean).join(" ");

export async function giveConsent(deps: Pick<LoginDeps, "env" | "now">): Promise<string> {
  return signConsent({ version: CONSENT_VERSION, at: deps.now() }, deps.env.SESSION_SECRET);
}

export async function completeLogin(deps: LoginDeps, identity: IdentityInput, cookies: LoginCookies): Promise<LoginOutcome> {
  const consent = cookies.consent ? await verifyConsent(cookies.consent, deps.env.SESSION_SECRET) : null;
  const upserted = await upsertUserFromIdentity(deps.db, identity, consent);
  if (!upserted.ok) return { ok: false, error: "consent_required" };
  return { ok: true, sessionToken: await signSession(upserted.user.id, deps.env.SESSION_SECRET), redirectTo: AFTER_LOGIN_PATH };
}

export async function startVkLogin(deps: LoginDeps): Promise<{ redirectUrl: string; stateCookie: string }> {
  const { codeVerifier, codeChallenge } = createPkcePair();
  const state = randomBytes(STATE_BYTES).toString("base64url");
  const stateCookie = await signVkState({ state, codeVerifier }, deps.env.SESSION_SECRET);
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
  return completeLogin(deps, { provider: "vk", externalId: user.id, displayName: fullName(user.firstName, user.lastName) }, p.cookies);
}

export async function getCurrentUser(deps: Pick<LoginDeps, "db" | "env">, sessionToken: string | null): Promise<UserRecord | null> {
  if (!sessionToken) return null;
  const userId = await verifySession(sessionToken, deps.env.SESSION_SECRET);
  return userId ? getUser(deps.db, userId) : null;
}
```

`apps/web/src/server/login-response.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { withLoginMark } from "../lib/login-mark";
import type { AppEnv } from "./env";
import { CONSENT_COOKIE, consentCookieOptions, expiredCookieOptions, SESSION_COOKIE, sessionCookieOptions } from "./http";
import type { LoginCookies, LoginOutcome } from "./login-service";

export function readLoginCookies(request: NextRequest): LoginCookies {
  return { consent: request.cookies.get(CONSENT_COOKIE)?.value ?? null };
}

export function loginResponse(env: AppEnv, outcome: LoginOutcome): NextResponse {
  if (!outcome.ok) {
    console.warn("login failed", outcome.error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(outcome.error)}`, env.APP_URL), 303);
  }
  const response = NextResponse.redirect(new URL(withLoginMark(outcome.redirectTo), env.APP_URL), 303);
  response.cookies.set(SESSION_COOKIE, outcome.sessionToken, sessionCookieOptions(env.APP_URL));
  response.cookies.set(CONSENT_COOKIE, "", expiredCookieOptions(consentCookieOptions(env.APP_URL)));
  return response;
}
```

`apps/web/src/server/deps.ts`:

```ts
import { getDb } from "./db";
import { getEnv } from "./env";
import type { LoginDeps } from "./login-service";

export function loginDeps(): LoginDeps {
  return { db: getDb(), env: getEnv(), now: () => new Date(), fetchFn: (input, init) => fetch(input, init) };
}
```

`apps/web/src/server/viewer.ts`:

```ts
import type { UserRecord } from "@oracle/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { getEnv } from "./env";
import { SESSION_COOKIE } from "./http";
import { getCurrentUser } from "./login-service";

export async function currentUser(): Promise<UserRecord | null> {
  const store = await cookies();
  return getCurrentUser({ db: getDb(), env: getEnv() }, store.get(SESSION_COOKIE)?.value ?? null);
}

export async function requireUser(): Promise<UserRecord> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
```

Запуск: `pnpm vitest run apps/web`. Ожидается PASS.

- [ ] **Шаг 5. Маршруты.**

`apps/web/src/app/api/consent/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { loginDeps } from "@/server/deps";
import { CONSENT_COOKIE, consentCookieOptions, isSameOrigin } from "@/server/http";
import { giveConsent } from "@/server/login-service";

export async function POST(request: NextRequest) {
  const deps = loginDeps();
  if (!isSameOrigin(request, deps.env.APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CONSENT_COOKIE, await giveConsent(deps), consentCookieOptions(deps.env.APP_URL));
  return response;
}
```

`apps/web/src/app/api/auth/vk/start/route.ts`:

```ts
import { NextResponse } from "next/server";
import { loginDeps } from "@/server/deps";
import { VK_STATE_COOKIE, vkStateCookieOptions } from "@/server/http";
import { startVkLogin } from "@/server/login-service";

export async function GET() {
  const deps = loginDeps();
  const { redirectUrl, stateCookie } = await startVkLogin(deps);
  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set(VK_STATE_COOKIE, stateCookie, vkStateCookieOptions(deps.env.APP_URL));
  return response;
}
```

`apps/web/src/app/api/auth/vk/callback/route.ts`:

```ts
import type { NextRequest } from "next/server";
import { loginDeps } from "@/server/deps";
import { expiredCookieOptions, VK_STATE_COOKIE, vkStateCookieOptions } from "@/server/http";
import { loginResponse, readLoginCookies } from "@/server/login-response";
import { finishVkLogin } from "@/server/login-service";

export async function GET(request: NextRequest) {
  const deps = loginDeps();
  const q = request.nextUrl.searchParams;
  const outcome = await finishVkLogin(deps, {
    code: q.get("code"),
    deviceId: q.get("device_id"),
    state: q.get("state"),
    stateCookie: request.cookies.get(VK_STATE_COOKIE)?.value ?? null,
    cookies: readLoginCookies(request),
  });
  const response = loginResponse(deps.env, outcome);
  response.cookies.set(VK_STATE_COOKIE, "", expiredCookieOptions(vkStateCookieOptions(deps.env.APP_URL)));
  return response;
}
```

`apps/web/src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/server/env";
import { expiredCookieOptions, isSameOrigin, SESSION_COOKIE, sessionCookieOptions } from "@/server/http";

export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!isSameOrigin(request, env.APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  const response = NextResponse.redirect(new URL("/", env.APP_URL), 303);
  response.cookies.set(SESSION_COOKIE, "", expiredCookieOptions(sessionCookieOptions(env.APP_URL)));
  return response;
}
```

`apps/web/src/app/api/dev/login/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { loginDeps } from "@/server/deps";
import { isDevLoginEnabled } from "@/server/dev-login";
import { loginResponse } from "@/server/login-response";
import { completeLogin, giveConsent } from "@/server/login-service";

// Только для локальной разработки и E2E: VK ID не пускает на localhost.
// Dev-вход считает согласие данным, иначе сквозной сценарий пришлось бы проходить через настоящий VK ID
export async function GET(request: NextRequest) {
  if (!isDevLoginEnabled(process.env)) return new NextResponse(null, { status: 404 });
  const deps = loginDeps();
  const name = request.nextUrl.searchParams.get("name") ?? "Разработчик";
  const outcome = await completeLogin(deps, { provider: "vk", externalId: `dev-${name}`, displayName: name }, { consent: await giveConsent(deps) });
  return loginResponse(deps.env, outcome);
}
```

- [ ] **Шаг 6. Страница входа.**

`apps/web/src/app/login/LoginPanel.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export function LoginPanel() {
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Согласие фиксируется на сервере до перехода в VK ID: VK не возвращает наши параметры обратно
  async function signIn() {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/consent", { method: "POST" });
      if (!response.ok) throw new Error(`consent ${response.status}`);
      window.location.assign("/api/auth/vk/start");
    } catch {
      setError("Не получилось сохранить согласие. Проверьте интернет и попробуйте ещё раз.");
      setSending(false);
    }
  }

  return (
    <div className="stack">
      <label className="choice">
        <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
        <span>
          Соглашаюсь на <Link href="/consent">обработку персональных данных</Link> в соответствии с <Link href="/privacy">политикой</Link>
        </span>
      </label>
      <button type="button" className="button button--block" disabled={!agreed || sending} onClick={signIn}>
        {sending ? "Переходим в VK ID…" : "Войти через VK ID"}
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

`apps/web/src/app/login/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginErrorMessage } from "@/lib/login-errors";
import { currentUser } from "@/server/viewer";
import { LoginPanel } from "./LoginPanel";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, user] = await Promise.all([searchParams, currentUser()]);
  if (user) redirect("/portret");
  const message = loginErrorMessage(error ?? null);
  return (
    <main className="page stack">
      <p className="eyebrow">Мой портрет</p>
      <h1 className="display">Вход</h1>
      <p className="lead">Войдите, чтобы сохранить дату рождения и открывать практики без повторного ввода.</p>
      {message && (
        <p className="error" role="alert">
          {message}
        </p>
      )}
      <div className="card">
        <LoginPanel />
      </div>
    </main>
  );
}
```

- [ ] **Шаг 7. Проверка в браузере.** `pnpm dev:db`, `pnpm dev:web`:
  1. `/login`: кнопка неактивна до отметки согласия, в исходнике `noindex`.
  2. `/api/dev/login?name=Проверка` → редирект на `/portret?from=login` (страницы портрета ещё нет — 404 ожидаем до задачи 6), в DevTools → Application → Cookies есть `oracle_session` с `HttpOnly`.
  3. `/login?error=vk_state_mismatch` показывает понятный текст.
  4. Отметить согласие и нажать «Войти через VK ID» — браузер уходит на `id.vk.ru/authorize` с `client_id=1` (VK покажет ошибку приложения — это нормально для локального `VK_CLIENT_ID=1`).

- [ ] **Шаг 8. Проверки и коммит.**

```bash
pnpm vitest run
pnpm typecheck
git add apps/web/src
git commit -m "feat(web): VK ID login with consent, sessions, logout and dev login"
```
