# Задача 4 — возврат после входа: безопасный `next`

**Files:**
- Create: `apps/web/src/lib/next-path.ts`; Test: `apps/web/src/lib/next-path.test.ts`
- Modify: `apps/web/src/server/auth/tokens.ts`, `apps/web/src/server/auth/tokens.test.ts`
- Modify: `apps/web/src/server/login-service.ts`, `apps/web/src/server/login-service.test.ts`
- Modify: `apps/web/src/app/api/auth/vk/start/route.ts`, `apps/web/src/app/api/dev/login/route.ts`
- Modify: `apps/web/src/app/login/page.tsx`, `apps/web/src/app/login/LoginPanel.tsx`

**Interfaces:**
- Consumes: `signVkState`/`verifyVkState`, `startVkLogin`, `finishVkLogin`, `completeLogin` (план 1).
- Produces:
  - `SAFE_NEXT_PATHS = ["/portret", "/matrica-sudby"] as const`, `DEFAULT_NEXT_PATH = "/portret"`
  - `safeNextPath(value: unknown): string` — значение из белого списка или `"/portret"`
  - `loginHref(next: string): string` — `"/login"` или `"/login?next=<path>"` (для кнопки «Войти и сохранить», задача 7)
  - `type VkState = { state: string; codeVerifier: string; next: string }`
  - `startVkLogin(deps, next?: string)`, `completeLogin(deps, identity, cookies, next?: string)` — `redirectTo` = `next`
  - `GET /api/auth/vk/start?next=/matrica-sudby`, `/login?next=/matrica-sudby`, `GET /api/dev/login?name=…&next=/matrica-sudby`

## Зачем

Спецификация 2а, раздел 5. Кнопка «Войти и сохранить» на калькуляторе ведёт на вход, а после VK ID человек должен вернуться на калькулятор, где дата сохранится в портрет. Путь возврата — только из белого списка: иначе ссылка вида `/login?next=https://evil.example` превращала бы наш вход в открытый редирект. Через VK путь едет внутри уже подписанного state-токена (httpOnly-cookie), поэтому подменить его по дороге нельзя.

## Шаги

- [ ] **Step 1: Падающий тест белого списка**

`apps/web/src/lib/next-path.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { loginHref, safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  test("keeps the allowed internal paths", () => {
    expect(safeNextPath("/matrica-sudby")).toBe("/matrica-sudby");
    expect(safeNextPath("/portret")).toBe("/portret");
  });

  test.each([null, undefined, 42, "", "/", "https://evil.example", "//evil.example", "/matrica-sudby?x=1", "/matrica-sudby/../api", "/portret/delete", "/MATRICA-SUDBY"])(
    "falls back to the portrait for %s",
    (value) => {
      expect(safeNextPath(value)).toBe("/portret");
    },
  );
});

describe("loginHref", () => {
  test("adds next only when it differs from the default", () => {
    expect(loginHref("/portret")).toBe("/login");
    expect(loginHref("/matrica-sudby")).toBe("/login?next=%2Fmatrica-sudby");
    expect(loginHref("https://evil.example")).toBe("/login");
  });
});
```

Run: `pnpm vitest run --project web apps/web/src/lib/next-path.test.ts` — Expected: FAIL (модуля нет).

- [ ] **Step 2: Белый список**

`apps/web/src/lib/next-path.ts`:

```ts
// Куда можно вернуть человека после входа. Только точные внутренние пути — иначе вход стал бы открытым редиректом
export const SAFE_NEXT_PATHS = ["/portret", "/matrica-sudby"] as const;
export const DEFAULT_NEXT_PATH = "/portret";

export function safeNextPath(value: unknown): string {
  return typeof value === "string" && (SAFE_NEXT_PATHS as readonly string[]).includes(value) ? value : DEFAULT_NEXT_PATH;
}

export function loginHref(next: string): string {
  const safe = safeNextPath(next);
  return safe === DEFAULT_NEXT_PATH ? "/login" : `/login?next=${encodeURIComponent(safe)}`;
}
```

Run: тест из Step 1 — Expected: PASS.

- [ ] **Step 3: `next` в state-токене — тесты**

В `apps/web/src/server/auth/tokens.test.ts` заменить блок `describe("vk state tokens", …)`:

```ts
describe("vk state tokens", () => {
  test("round-trip the state, verifier and return path", async () => {
    const payload = { state: "st-1", codeVerifier: "ver-1", next: "/matrica-sudby" };

    expect(await verifyVkState(await signVkState(payload, SECRET), SECRET)).toEqual(payload);
  });

  test("never returns a return path outside the allow-list", async () => {
    const token = await signVkState({ state: "s", codeVerifier: "v", next: "https://evil.example" }, SECRET);

    expect((await verifyVkState(token, SECRET))?.next).toBe("/portret");
  });
});
```

Строку `const state = await signVkState({ state: "s", codeVerifier: "v" }, SECRET);` ниже в файле заменить на `const state = await signVkState({ state: "s", codeVerifier: "v", next: "/portret" }, SECRET);`.

Run: `pnpm vitest run --project web apps/web/src/server/auth/tokens.test.ts` — Expected: FAIL (типы/значение `next`).

- [ ] **Step 4: `next` в state-токене — реализация**

В `apps/web/src/server/auth/tokens.ts`: добавить импорт `import { safeNextPath } from "../../lib/next-path";` и заменить тип и две функции:

```ts
export type VkState = { state: string; codeVerifier: string; next: string };

export async function signVkState(state: VkState, secret: string): Promise<string> {
  return sign({ ...state }, AUDIENCE.vkState, VK_STATE_TTL, secret);
}

export async function verifyVkState(token: string, secret: string): Promise<VkState | null> {
  const payload = await verify(token, AUDIENCE.vkState, secret);
  if (typeof payload?.state !== "string" || typeof payload.codeVerifier !== "string") return null;
  return { state: payload.state, codeVerifier: payload.codeVerifier, next: safeNextPath(payload.next) };
}
```

Run: тесты токенов — Expected: PASS.

- [ ] **Step 5: Сервис входа — тесты**

В `apps/web/src/server/login-service.test.ts`:

1. В `describe("completeLogin", …)` добавить:

```ts
  test("returns to the requested page after login", async () => {
    const outcome = await completeLogin(deps, ANNA, { consent: await giveConsent(deps) }, "/matrica-sudby");

    expect(outcome.ok && outcome.redirectTo).toBe("/matrica-sudby");
  });
```

2. В `describe("VK ID login", …)` заменить помощник `finishWith` и добавить тест:

```ts
  async function finishWith(fetchFn: LoginDeps["fetchFn"], consent: string | null, next?: string) {
    const { redirectUrl, stateCookie } = await startVkLogin(deps, next);
    const state = new URL(redirectUrl).searchParams.get("state");
    deps.fetchFn = fetchFn;
    return finishVkLogin(deps, { code: "code", deviceId: "device", state, stateCookie, cookies: { consent } });
  }

  test("carries the return path through VK ID in the signed state", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: "at" }))
      .mockResolvedValueOnce(jsonResponse({ user: { user_id: 778, first_name: "Вера" } }));

    const outcome = await finishWith(fetchFn, await giveConsent(deps), "/matrica-sudby");

    expect(outcome.ok && outcome.redirectTo).toBe("/matrica-sudby");
  });
```

Run: `pnpm vitest run --project web apps/web/src/server/login-service.test.ts` — Expected: FAIL (лишний аргумент / `redirectTo` = `/portret`).

- [ ] **Step 6: Сервис входа — реализация**

В `apps/web/src/server/login-service.ts`:
- заменить `const AFTER_LOGIN_PATH = "/portret";` на импорт `import { DEFAULT_NEXT_PATH, safeNextPath } from "../lib/next-path";` (константу удалить);
- заменить три функции:

```ts
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
```

- в `finishVkLogin` последнюю строку заменить на:

```ts
  return completeLogin(deps, { provider: "vk", externalId: user.id, displayName: user.firstName }, p.cookies, saved.next);
```

Run: тесты сервиса — Expected: PASS.

- [ ] **Step 7: Маршруты**

`apps/web/src/app/api/auth/vk/start/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/next-path";
import { loginDeps } from "@/server/deps";
import { VK_STATE_COOKIE, vkStateCookieOptions } from "@/server/http";
import { startVkLogin } from "@/server/login-service";

export async function GET(request: NextRequest) {
  const deps = loginDeps();
  const { redirectUrl, stateCookie } = await startVkLogin(deps, safeNextPath(request.nextUrl.searchParams.get("next")));
  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set(VK_STATE_COOKIE, stateCookie, vkStateCookieOptions(deps.env.APP_URL));
  return response;
}
```

`apps/web/src/app/api/dev/login/route.ts` — последние три строки функции заменить:

```ts
  const name = request.nextUrl.searchParams.get("name") ?? "Разработчик";
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const outcome = await completeLogin(deps, { provider: "vk", externalId: `dev-${name}`, displayName: name }, { consent: await giveConsent(deps) }, next);
  return loginResponse(deps.env, outcome);
```

и добавить импорт `import { safeNextPath } from "@/lib/next-path";`.

- [ ] **Step 8: Страница входа**

`apps/web/src/app/login/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Scene } from "@/components/Scene";
import { loginErrorMessage } from "@/lib/login-errors";
import { safeNextPath } from "@/lib/next-path";
import { currentUser } from "@/server/viewer";
import { LoginPanel } from "./LoginPanel";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const [{ error, next }, user] = await Promise.all([searchParams, currentUser()]);
  const returnTo = safeNextPath(next);
  if (user) redirect(returnTo);
  const message = loginErrorMessage(error ?? null);
  return (
    <Scene compact>
      <div className="card login-card stack">
        <p className="eyebrow eyebrow--line">Мой портрет</p>
        <h1 className="display">Вход</h1>
        <p className="lead">Войдите, чтобы сохранить дату рождения и открывать практики без повторного ввода.</p>
        {message && (
          <p className="error" role="alert">
            {message}
          </p>
        )}
        <LoginPanel next={returnTo} />
      </div>
    </Scene>
  );
}
```

`apps/web/src/app/login/LoginPanel.tsx` — сигнатура и переход:

```tsx
export function LoginPanel({ next }: { next: string }) {
```

```ts
      window.location.assign(next === "/portret" ? "/api/auth/vk/start" : `/api/auth/vk/start?next=${encodeURIComponent(next)}`);
```

(остальное без изменений).

- [ ] **Step 9: Проверки**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

Ручная проверка (dev-сервер задачи 9 или `pnpm dev:web`): открыть `/api/dev/login?name=Тест&next=/matrica-sudby` → редирект на `/matrica-sudby?from=login` (страницы ещё нет — 404 допустим до задачи 7); `/api/dev/login?name=Тест&next=https://evil.example` → `/portret?from=login`.

- [ ] **Step 10: Коммит**

```bash
git add apps/web/src/lib/next-path.ts apps/web/src/lib/next-path.test.ts apps/web/src/server/auth/tokens.ts apps/web/src/server/auth/tokens.test.ts apps/web/src/server/login-service.ts apps/web/src/server/login-service.test.ts apps/web/src/app/api/auth/vk/start/route.ts apps/web/src/app/api/dev/login/route.ts apps/web/src/app/login
git commit -m "feat(web): return to an allow-listed page after VK ID login"
```
