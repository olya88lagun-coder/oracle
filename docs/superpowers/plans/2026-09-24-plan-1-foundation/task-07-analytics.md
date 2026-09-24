# Задача 7 — Cookie-баннер, Яндекс.Метрика после согласия, цели, код Вебмастера

**Files:**
- Create: `apps/web/src/lib/analytics.ts`; Test: `apps/web/src/lib/analytics.test.ts`
- Create: `apps/web/src/components/Analytics.tsx`, `apps/web/src/components/CookieSettingsButton.tsx`
- Modify: `apps/web/src/components/Footer.tsx` (кнопка «Настройки cookie»)
- Modify: `apps/web/src/app/layout.tsx` (`<Analytics />`, код Вебмастера)
- Modify: `apps/web/src/app/portret/BirthDateForm.tsx` (цель `birth_date_saved`)

**Interfaces:**
- Consumes: `LOGIN_MARK` из `@/lib/login-mark` (задача 5); `SITE_URL` (задача 3).
- Produces:
  - `METRIKA_ID: number | null`, `YANDEX_VERIFICATION: string | null` — значения от владелицы; пока `null`, Метрика и метатег выключены
  - `GOALS = ["login", "birth_date_saved"] as const`; `type Goal`
  - `CONSENT_KEY = "oracle-cookie-consent"`, `COOKIE_SETTINGS_EVENT = "oracle:cookie-settings"`, `type CookieChoice = "all" | "necessary"`
  - `readChoice(storage)`, `saveChoice(storage, choice)`, `sanitizePath(path)`, `sanitizeReferrer(referrer, origin)`
  - `reachGoal(goal: Goal, params?: Record<string, string | number>, counterId?: number | null): void`
  - компоненты `Analytics`, `CookieSettingsButton`

## Зачем

Спецификация 9: метрики воронки нужны с первого дня, а в плане 2 от них зависит решение о рекламе. По 152-ФЗ cookie Метрики ставятся только после явного «Принять»; «Только необходимые» — Метрика не загружается совсем (политика, раздел 9, уже это обещает). Механика взята из Граней (`C:\dev\grani-test\apps\web\src\components\Analytics.tsx`): очередь `ym` до загрузки `tag.js`, просмотры отправляются вручную с очищенным адресом, после отказа загруженная Метрика выгружается перезагрузкой страницы.

Цели плана 1 — только `login` (вход) и `birth_date_saved` (сохранение даты). Цели калькуляторов и покупок добавит план 2.

## Шаги

- [ ] **Шаг 1. Тест (RED).** `apps/web/src/lib/analytics.test.ts`:

```ts
import { afterEach, describe, expect, test, vi } from "vitest";
import { CONSENT_KEY, GOALS, reachGoal, readChoice, sanitizePath, sanitizeReferrer, saveChoice } from "./analytics";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

const brokenStorage = {
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cookie choice", () => {
  test("reads only known values", () => {
    expect(readChoice(memoryStorage({ [CONSENT_KEY]: "all" }))).toBe("all");
    expect(readChoice(memoryStorage({ [CONSENT_KEY]: "necessary" }))).toBe("necessary");
    expect(readChoice(memoryStorage({ [CONSENT_KEY]: "yes" }))).toBeNull();
    expect(readChoice(memoryStorage())).toBeNull();
  });

  test("survives a storage that refuses access", () => {
    expect(readChoice(brokenStorage)).toBeNull();
    expect(() => saveChoice(brokenStorage, "all")).not.toThrow();
  });

  test("saves the choice under the consent key", () => {
    const storage = memoryStorage();

    saveChoice(storage, "necessary");

    expect(storage.getItem(CONSENT_KEY)).toBe("necessary");
  });
});

describe("sanitizePath", () => {
  test("drops the query and the hash", () => {
    expect(sanitizePath("/portret?from=login#date")).toBe("/portret");
    expect(sanitizePath("")).toBe("/");
  });
});

describe("sanitizeReferrer", () => {
  test("keeps our own path without the query and only the origin of other sites", () => {
    expect(sanitizeReferrer("https://oracle.test/portret?from=login", "https://oracle.test")).toBe("https://oracle.test/portret");
    expect(sanitizeReferrer("https://yandex.ru/search/?text=матрица", "https://oracle.test")).toBe("https://yandex.ru");
  });

  test("is empty for no or broken referrers", () => {
    expect(sanitizeReferrer("", "https://oracle.test")).toBeUndefined();
    expect(sanitizeReferrer("not a url", "https://oracle.test")).toBeUndefined();
  });
});

describe("reachGoal", () => {
  test("sends the goal to the loaded counter", () => {
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });

    reachGoal("login", undefined, 123);

    expect(ym).toHaveBeenCalledWith(123, "reachGoal", "login", undefined);
  });

  test("does nothing without a counter id or before Metrika is loaded", () => {
    const ym = vi.fn();
    vi.stubGlobal("window", { ym });

    reachGoal("login", undefined, null);
    vi.stubGlobal("window", {});
    reachGoal("birth_date_saved", undefined, 123);

    expect(ym).not.toHaveBeenCalled();
  });

  test("the plan 1 funnel has exactly two goals", () => {
    expect(GOALS).toEqual(["login", "birth_date_saved"]);
  });
});
```

Запуск: `pnpm vitest run apps/web/src/lib/analytics.test.ts`. Ожидается FAIL: модуль не найден.

- [ ] **Шаг 2. Реализация.** `apps/web/src/lib/analytics.ts`:

```ts
export { LOGIN_MARK } from "./login-mark";

// Номер счётчика и код Вебмастера видны в коде страницы любому, это не секреты.
// Пока значений нет (null), Метрика не загружается и метатег не выводится
export const METRIKA_ID: number | null = null;
export const YANDEX_VERIFICATION: string | null = null;

export const GOALS = ["login", "birth_date_saved"] as const;
export type Goal = (typeof GOALS)[number];

export const CONSENT_KEY = "oracle-cookie-consent";
export const COOKIE_SETTINGS_EVENT = "oracle:cookie-settings";
export type CookieChoice = "all" | "necessary";
type StorageLike = Pick<Storage, "getItem" | "setItem">;

// localStorage бывает недоступен (приватный режим, запрет сайта) — тогда баннер просто спросит снова
export function readChoice(storage: StorageLike): CookieChoice | null {
  try {
    const value = storage.getItem(CONSENT_KEY);
    return value === "all" || value === "necessary" ? value : null;
  } catch {
    return null;
  }
}

export function saveChoice(storage: StorageLike, choice: CookieChoice): void {
  try {
    storage.setItem(CONSENT_KEY, choice);
  } catch {
    // выбор действует до перезагрузки страницы
  }
}

// Параметры адреса не уходят в Метрику: в них может оказаться что-то личное
export function sanitizePath(path: string): string {
  const [pathname] = path.split(/[?#]/);
  return pathname || "/";
}

export function sanitizeReferrer(referrer: string, origin: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    return url.origin === origin ? `${origin}${sanitizePath(url.pathname)}` : url.origin;
  } catch {
    return undefined;
  }
}

type Ym = (id: number, method: string, ...args: unknown[]) => void;

export function reachGoal(goal: Goal, params?: Record<string, string | number>, counterId: number | null = METRIKA_ID): void {
  if (counterId === null) return;
  const ym = (globalThis as { window?: { ym?: Ym } }).window?.ym;
  ym?.(counterId, "reachGoal", goal, params);
}
```

Запуск: `pnpm vitest run apps/web/src/lib/analytics.test.ts`. Ожидается PASS.

- [ ] **Шаг 3. Компоненты.** `apps/web/src/components/CookieSettingsButton.tsx`:

```tsx
"use client";

import { COOKIE_SETTINGS_EVENT } from "@/lib/analytics";

export function CookieSettingsButton() {
  return (
    <button type="button" className="link-button" onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}>
      Настройки cookie
    </button>
  );
}
```

`apps/web/src/components/Analytics.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COOKIE_SETTINGS_EVENT, LOGIN_MARK, METRIKA_ID, reachGoal, readChoice, sanitizePath, sanitizeReferrer, saveChoice, type CookieChoice } from "@/lib/analytics";
import { SITE_URL } from "@/lib/site";

type YmWindow = Window & { ym?: ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number } };

// Счётчик работает только на боевом домене: локальная разработка и сквозные тесты статистику не портят
const canCount = () => METRIKA_ID !== null && window.location.protocol === "https:" && window.location.origin === SITE_URL;

function loadMetrika(counterId: number): void {
  const w = window as YmWindow;
  if (w.ym) return;
  // Стандартная очередь Метрики: вызовы до загрузки tag.js сохраняются и выполняются после
  const ym = ((...args: unknown[]) => {
    (ym.a ??= []).push(args);
  }) as NonNullable<YmWindow["ym"]>;
  ym.l = Date.now();
  w.ym = ym;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(script);
  // defer: просмотры отправляем сами, с очищенным адресом
  ym(counterId, "init", { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
}

function sendHit(counterId: number, pathname: string): void {
  const ym = (window as YmWindow).ym;
  if (!ym) return;
  const origin = window.location.origin;
  ym(counterId, "hit", `${origin}${sanitizePath(pathname)}`, { referer: sanitizeReferrer(document.referrer, origin) });
}

function takeLoginMark(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.get(LOGIN_MARK.param) !== LOGIN_MARK.value) return;
  reachGoal("login");
  url.searchParams.delete(LOGIN_MARK.param);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function Analytics() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<CookieChoice | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    const saved = readChoice(window.localStorage);
    setChoice(saved);
    setOpen(saved === null);
    const reopen = () => setOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (choice !== "all" || METRIKA_ID === null || !canCount()) return;
    loadMetrika(METRIKA_ID);
    loaded.current = true;
  }, [choice]);

  useEffect(() => {
    if (choice === undefined) return;
    if (loaded.current && METRIKA_ID !== null) sendHit(METRIKA_ID, pathname);
    takeLoginMark();
  }, [pathname, choice]);

  // Пока баннер открыт, он не должен закрывать кнопки внизу страницы
  useEffect(() => {
    document.body.classList.toggle("has-cookie-banner", open);
  }, [open]);

  function decide(next: CookieChoice) {
    saveChoice(window.localStorage, next);
    setOpen(false);
    // Загруженную Метрику не выгрузить — после отказа страница перезагружается без неё
    if (next === "necessary" && loaded.current) {
      window.location.reload();
      return;
    }
    setChoice(next);
  }

  if (!open) return null;
  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie">
      <p>
        Мы используем cookie, чтобы сайт работал. С вашего разрешения — ещё и Яндекс.Метрику для статистики посещений. Подробнее — в{" "}
        <Link href="/privacy">политике</Link>.
      </p>
      <div className="row">
        <button type="button" className="button" onClick={() => decide("all")}>
          Принять
        </button>
        <button type="button" className="button button--ghost" onClick={() => decide("necessary")}>
          Только необходимые
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Шаг 4. Подключение.**

`apps/web/src/components/Footer.tsx`: добавить импорт `import { CookieSettingsButton } from "./CookieSettingsButton";` и строку `<CookieSettingsButton />` последним элементом внутри `<nav>`.

`apps/web/src/app/layout.tsx` — итоговый вид:

```tsx
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { YANDEX_VERIFICATION } from "@/lib/analytics";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "600", "800"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — символические практики для самопознания`, template: `%s — ${SITE_NAME}` },
  description: "Матрица судьбы, Лила, таро и натальная карта как инструмент самопознания — без обещаний предсказать будущее.",
  // По умолчанию страницы закрыты от поиска: вход и портрет личные. Публичные страницы включают индексацию через publicMetadata
  robots: { index: false, follow: false },
  ...(YANDEX_VERIFICATION ? { verification: { yandex: YANDEX_VERIFICATION } } : {}),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={body.variable}>
      <body>
        <Header />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
```

`apps/web/src/app/portret/BirthDateForm.tsx`: добавить импорт `import { reachGoal } from "@/lib/analytics";` и строку `reachGoal("birth_date_saved");` сразу перед `setMessage({ kind: "success", text: "Сохранено." });`.

- [ ] **Шаг 5. Значения от владелицы.** Если номер счётчика и код Вебмастера (предварительные действия, п. 4–5) уже есть — вписать их в `METRIKA_ID` и `YANDEX_VERIFICATION`. Если нет — оставить `null` и вернуться к этому шагу в задаче 9 до PR.

- [ ] **Шаг 6. Проверка в браузере.** `pnpm dev:db`, `pnpm dev:web`, в новом окне без сохранённого выбора:
  1. Баннер виден внизу, кнопки портрета не перекрыты (у `body` класс `has-cookie-banner`).
  2. «Только необходимые» → баннер исчезает; в `localStorage` `oracle-cookie-consent = necessary`; во вкладке Network нет запросов к `mc.yandex.ru`.
  3. «Настройки cookie» в подвале снова открывает баннер. «Принять» — запросов к `mc.yandex.ru` по-прежнему нет: локальный адрес не боевой.
  4. `/api/dev/login?name=Метка` → адрес в строке браузера меняется на `/portret` без `?from=login`.

- [ ] **Шаг 7. Проверки и коммит.**

```bash
pnpm vitest run
pnpm typecheck
git add apps/web/src
git commit -m "feat(web): cookie banner, Metrika after consent and funnel goals"
```
