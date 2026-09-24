# Задача 6 — «Мой портрет»: дата рождения и удаление данных

**Files:**
- Create: `apps/web/src/server/rate-limit.ts`; Test: `apps/web/src/server/rate-limit.test.ts`
- Create: `apps/web/src/server/profile-service.ts`; Test: `apps/web/src/server/profile-service.test.ts`
- Create: `apps/web/src/server/account-service.ts`; Test: `apps/web/src/server/account-service.test.ts`
- Create: `apps/web/src/app/api/profile/birth-date/route.ts`, `apps/web/src/app/api/me/delete/route.ts`
- Create: `apps/web/src/app/portret/page.tsx`, `apps/web/src/app/portret/BirthDateForm.tsx`
- Create: `apps/web/src/app/portret/delete/page.tsx`, `apps/web/src/app/portret/delete/DeleteForm.tsx`

**Interfaces:**
- Consumes: `parseBirthDate`, `toIsoDate`, `formatBirthDateRu`, `type BirthDate` из `@oracle/core`; `saveBirthDate`, `getBirthDate`, `deleteUserData`, `seedUser`, `createTestDb` из `@oracle/db`; `getCurrentUser`, `completeLogin`, `giveConsent`, `loginDeps`, `currentUser`, `requireUser`, cookie-помощники из задачи 5; `PRACTICES` (задача 3).
- Produces:
  - `createRateLimiter(p: { limit: number; windowMs: number; now?: () => number }): RateLimiter`; `profileLimiter`; `clientKeyFromHeaders(headers): string`
  - `type ProfileDeps = { db: Database; env: AppEnv; now: () => Date }`
  - `saveBirthDateForSession(deps, p: { sessionToken: string | null; value: unknown }): Promise<{ ok: true; birthDate: BirthDate } | { ok: false; error: "unauthorized" | "invalid_date" }>`
  - `loadPortrait(deps: Pick<ProfileDeps, "db" | "now">, userId: string): Promise<{ birthDate: BirthDate | null }>`
  - `deleteAccount(deps: { db; env }, p: { sessionToken: string | null }): Promise<{ ok: true } | { ok: false; error: "unauthorized" }>`
  - маршруты `POST /api/profile/birth-date` (тело `{ birthDate: "YYYY-MM-DD" }`), `POST /api/me/delete`
  - страницы `/portret`, `/portret/delete`; клиентский `BirthDateForm` (задача 7 добавит в него цель `birth_date_saved`)

## Зачем

Спецификация 3 и 4: «Мой портрет» — личное пространство, где дата рождения вводится один раз и дальше служит всем практикам. В плане 1 портрет хранит дату и показывает, какие практики в нём откроются. Анонимному посетителю портрет не закрыт редиректом: страница объясняет, зачем входить, и предлагает войти («предлагаем, не требуем»).

«Удалить мои данные» — обязательная функция по 152-ФЗ и обещание политики (задача 4 уже ссылается на `/portret/delete`).

Пользователь всегда берётся из сессии, а не из тела запроса: сохранить дату или удалить данные можно только свои.

## Шаги

- [ ] **Шаг 1. Тесты (RED).**

`apps/web/src/server/rate-limit.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { clientKeyFromHeaders, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  test("allows the limit within a window and blocks the next request", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => 0 });

    expect([limiter.allow("a"), limiter.allow("a"), limiter.allow("a")]).toEqual([true, true, false]);
  });

  test("counts keys separately and opens a new window after it passes", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => now });
    limiter.allow("a");

    expect(limiter.allow("b")).toBe(true);
    now = 1000;
    expect(limiter.allow("a")).toBe(true);
  });
});

describe("clientKeyFromHeaders", () => {
  test("takes the first forwarded address and falls back to a shared key", () => {
    expect(clientKeyFromHeaders(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientKeyFromHeaders(new Headers())).toBe("unknown");
  });
});
```

`apps/web/src/server/profile-service.test.ts`:

```ts
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
```

`apps/web/src/server/account-service.test.ts`:

```ts
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
```

Запуск: `pnpm vitest run apps/web/src/server`. Ожидается FAIL: модули не найдены.

- [ ] **Шаг 2. Реализация сервисов.**

`apps/web/src/server/rate-limit.ts`:

```ts
export type RateLimiter = { allow(key: string): boolean };

const MAX_TRACKED_KEYS = 10_000;
const MINUTE_MS = 60_000;
const PROFILE_SAVES_PER_MINUTE = 20;

// Память процесса: на одном контейнере web этого достаточно, чтобы не дать засыпать базу запросами
export function createRateLimiter(p: { limit: number; windowMs: number; now?: () => number }): RateLimiter {
  const now = p.now ?? Date.now;
  const windows = new Map<string, { startedAt: number; count: number }>();
  return {
    allow(key) {
      const current = now();
      if (windows.size > MAX_TRACKED_KEYS) windows.clear();
      const window = windows.get(key);
      if (!window || current - window.startedAt >= p.windowMs) {
        windows.set(key, { startedAt: current, count: 1 });
        return true;
      }
      if (window.count >= p.limit) return false;
      windows.set(key, { startedAt: window.startedAt, count: window.count + 1 });
      return true;
    },
  };
}

export const profileLimiter = createRateLimiter({ limit: PROFILE_SAVES_PER_MINUTE, windowMs: MINUTE_MS });

// Caddy заменяет X-Forwarded-For, пришедший от клиента, поэтому первый адрес — настоящий
export function clientKeyFromHeaders(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
```

`apps/web/src/server/profile-service.ts`:

```ts
import { parseBirthDate, toIsoDate, type BirthDate } from "@oracle/core";
import { getBirthDate, saveBirthDate, type Database } from "@oracle/db";
import type { AppEnv } from "./env";
import { getCurrentUser } from "./login-service";

export type ProfileDeps = { db: Database; env: AppEnv; now: () => Date };
export type SaveBirthDateOutcome = { ok: true; birthDate: BirthDate } | { ok: false; error: "unauthorized" | "invalid_date" };

export async function saveBirthDateForSession(deps: ProfileDeps, p: { sessionToken: string | null; value: unknown }): Promise<SaveBirthDateOutcome> {
  const user = await getCurrentUser(deps, p.sessionToken);
  if (!user) return { ok: false, error: "unauthorized" };
  const birthDate = parseBirthDate(p.value, deps.now());
  if (!birthDate) return { ok: false, error: "invalid_date" };
  await saveBirthDate(deps.db, user.id, toIsoDate(birthDate), deps.now());
  return { ok: true, birthDate };
}

export async function loadPortrait(deps: Pick<ProfileDeps, "db" | "now">, userId: string): Promise<{ birthDate: BirthDate | null }> {
  const stored = await getBirthDate(deps.db, userId);
  return { birthDate: stored ? parseBirthDate(stored, deps.now()) : null };
}
```

`apps/web/src/server/account-service.ts`:

```ts
import { deleteUserData, type Database } from "@oracle/db";
import type { AppEnv } from "./env";
import { getCurrentUser } from "./login-service";

export type AccountDeps = { db: Database; env: AppEnv };
export type DeleteAccountOutcome = { ok: true } | { ok: false; error: "unauthorized" };

// Удалить можно только свои данные: пользователь берётся из сессии, а не из запроса
export async function deleteAccount(deps: AccountDeps, p: { sessionToken: string | null }): Promise<DeleteAccountOutcome> {
  const user = await getCurrentUser(deps, p.sessionToken);
  if (!user) return { ok: false, error: "unauthorized" };
  await deleteUserData(deps.db, user.id);
  return { ok: true };
}
```

Запуск: `pnpm vitest run apps/web/src/server`. Ожидается PASS.

- [ ] **Шаг 3. Маршруты.**

`apps/web/src/app/api/profile/birth-date/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { loginDeps } from "@/server/deps";
import { isSameOrigin, SESSION_COOKIE } from "@/server/http";
import { saveBirthDateForSession, type SaveBirthDateOutcome } from "@/server/profile-service";
import { clientKeyFromHeaders, profileLimiter } from "@/server/rate-limit";

const STATUS: Record<Extract<SaveBirthDateOutcome, { ok: false }>["error"], number> = { unauthorized: 401, invalid_date: 400 };

export async function POST(request: NextRequest) {
  const deps = loginDeps();
  if (!isSameOrigin(request, deps.env.APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  if (!profileLimiter.allow(clientKeyFromHeaders(request.headers))) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  const body: unknown = await request.json().catch(() => null);
  const value = typeof body === "object" && body !== null ? (body as { birthDate?: unknown }).birthDate : undefined;
  const outcome = await saveBirthDateForSession(deps, { sessionToken: request.cookies.get(SESSION_COOKIE)?.value ?? null, value });
  if (!outcome.ok) return NextResponse.json(outcome, { status: STATUS[outcome.error] });
  return NextResponse.json(outcome);
}
```

`apps/web/src/app/api/me/delete/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { deleteAccount } from "@/server/account-service";
import { loginDeps } from "@/server/deps";
import { expiredCookieOptions, isSameOrigin, SESSION_COOKIE, sessionCookieOptions } from "@/server/http";

export async function POST(request: NextRequest) {
  const deps = loginDeps();
  if (!isSameOrigin(request, deps.env.APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403 });
  const outcome = await deleteAccount(deps, { sessionToken: request.cookies.get(SESSION_COOKIE)?.value ?? null });
  if (!outcome.ok) return NextResponse.json(outcome, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", expiredCookieOptions(sessionCookieOptions(deps.env.APP_URL)));
  return response;
}
```

- [ ] **Шаг 4. Страницы.**

`apps/web/src/app/portret/BirthDateForm.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERRORS: Record<string, string> = {
  invalid_date: "Проверьте дату: она должна быть настоящей и не позже сегодняшней.",
  unauthorized: "Сессия закончилась — войдите снова.",
  rate_limited: "Слишком много попыток подряд. Подождите минуту.",
};

export function BirthDateForm({ initial }: { initial: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile/birth-date", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ birthDate: value }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ kind: "error", text: ERRORS[body.error ?? ""] ?? "Не получилось сохранить. Попробуйте ещё раз." });
        return;
      }
      setMessage({ kind: "success", text: "Сохранено." });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Не получилось сохранить. Проверьте интернет и попробуйте ещё раз." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <div className="field">
        <label htmlFor="birth-date">Дата рождения</label>
        <input id="birth-date" className="input" type="date" required min="1900-01-01" value={value} onChange={(event) => setValue(event.target.value)} />
      </div>
      <button type="submit" className="button" disabled={!value || sending}>
        {sending ? "Сохраняем…" : "Сохранить"}
      </button>
      {message && (
        <p className={message.kind} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
    </form>
  );
}
```

`apps/web/src/app/portret/page.tsx`:

```tsx
import { formatBirthDateRu, toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import Link from "next/link";
import { PRACTICES } from "@/lib/practices";
import { getDb } from "@/server/db";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";
import { BirthDateForm } from "./BirthDateForm";

export const metadata: Metadata = { title: "Мой портрет" };

function firstName(displayName: string): string {
  return displayName.split(" ")[0] ?? displayName;
}

export default async function PortraitPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <main className="page stack">
        <p className="eyebrow">Мой портрет</p>
        <h1 className="display">Одна дата — для всех практик</h1>
        <p className="lead">
          В портрете хранится дата рождения. Каждая практика ORACLE, которая откроется, возьмёт её отсюда — вводить заново не придётся.
        </p>
        <p>
          <Link className="button" href="/login">
            Войти через VK ID
          </Link>
        </p>
      </main>
    );
  }

  const { birthDate } = await loadPortrait({ db: getDb(), now: () => new Date() }, user.id);
  return (
    <main className="page stack">
      <p className="eyebrow">Мой портрет</p>
      <h1 className="display">Здравствуйте, {firstName(user.displayName)}</h1>

      <section className="card stack" aria-labelledby="birth">
        <h2 id="birth">Дата рождения</h2>
        {birthDate && <p className="lead">{formatBirthDateRu(birthDate)}</p>}
        <BirthDateForm initial={birthDate ? toIsoDate(birthDate) : null} />
      </section>

      <section className="stack" aria-labelledby="practices">
        <h2 id="practices">Практики в портрете</h2>
        <p className="muted">Практики открываются по очереди. Когда откроется следующая, её расчёт появится здесь автоматически.</p>
        <ul className="practice-grid">
          {PRACTICES.map((practice) => (
            <li key={practice.slug} className="practice-card">
              <span className="tag">Скоро</span>
              <h3>{practice.title}</h3>
              <p>{practice.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="row">
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="button button--ghost">
            Выйти
          </button>
        </form>
        <Link href="/portret/delete" className="muted">
          Удалить мои данные
        </Link>
      </div>
    </main>
  );
}
```

`apps/web/src/app/portret/delete/DeleteForm.tsx`:

```tsx
"use client";

import { useState } from "react";

export function DeleteForm() {
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/me/delete", { method: "POST" });
      if (response.ok) {
        window.location.assign("/?deleted=1");
        return;
      }
      setError(response.status === 401 ? "Сессия закончилась — войдите снова и повторите." : "Не получилось удалить данные. Попробуйте ещё раз.");
    } catch {
      setError("Не получилось удалить данные. Проверьте интернет и попробуйте ещё раз.");
    }
    setSending(false);
  }

  return (
    <div className="stack">
      <label className="choice">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        <span>Понимаю, что данные удалятся без возможности восстановления</span>
      </label>
      <button type="button" className="button" disabled={!confirmed || sending} onClick={remove}>
        {sending ? "Удаляем…" : "Удалить навсегда"}
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

`apps/web/src/app/portret/delete/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/viewer";
import { DeleteForm } from "./DeleteForm";

export const metadata: Metadata = { title: "Удалить мои данные" };

export default async function DeleteDataPage() {
  await requireUser();
  return (
    <main className="page stack">
      <h1 className="display">Удалить мои данные</h1>
      <section className="card stack">
        <h2>Что удалится</h2>
        <ul>
          <li>дата рождения из портрета;</li>
          <li>вход через VK ID и имя из VK.</li>
        </ul>
        <p className="muted">Если войти снова через тот же VK ID, это будет новый портрет с новым согласием.</p>
      </section>
      <DeleteForm />
      <p>
        <Link href="/portret">Передумали — вернуться в портрет</Link>
      </p>
    </main>
  );
}
```

- [ ] **Шаг 5. Проверка в браузере.** `pnpm dev:db`, `pnpm dev:web`:
  1. `/portret` без входа — приглашение и кнопка «Войти через VK ID».
  2. `/api/dev/login?name=Аня%20Проверка` → `/portret`, «Здравствуйте, Аня».
  3. Ввести `07.03.1990` в поле даты → «Сохранено», над формой «7 марта 1990»; перезагрузка страницы сохраняет дату.
  4. «Выйти» → главная; `/portret` снова показывает приглашение.
  5. Снова dev-вход → «Удалить мои данные» → отметить → «Удалить навсегда» → главная; `/portret` показывает приглашение; повторный dev-вход с тем же именем открывает пустой портрет.
  6. `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/me/delete` → `403` (нет `Origin`).
  7. Ширина 375 px: форма и карточки без горизонтальной прокрутки. Скриншот портрета с датой — в отчёт.

- [ ] **Шаг 6. Проверки и коммит.**

```bash
pnpm vitest run
pnpm test:coverage
pnpm typecheck
git add apps/web/src
git commit -m "feat(web): portrait with birth date, rate limiting and data deletion"
```

Покрытие — не ниже 80% по всем четырём метрикам.
