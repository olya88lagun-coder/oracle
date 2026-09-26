# Задача 5 — дата в браузере, очистка, цели Метрики, фраза в политике

**Files:**
- Create: `apps/web/src/lib/birth-date-storage.ts`; Test: `apps/web/src/lib/birth-date-storage.test.ts`
- Create: `apps/web/src/components/LogoutButton.tsx`
- Modify: `apps/web/src/app/portret/page.tsx` (кнопка «Выйти»), `apps/web/src/app/portret/delete/DeleteForm.tsx`
- Modify: `apps/web/src/lib/analytics.ts`, `apps/web/src/lib/analytics.test.ts`
- Modify: `apps/web/src/lib/legal.ts`, `apps/web/src/app/privacy/page.tsx`, `apps/web/src/app/consent/page.tsx`

**Interfaces:**
- Consumes: `parseBirthDate`, `toIsoDate` из `@oracle/core`.
- Produces:
  - `BIRTH_DATE_KEY = "oracle-birth-date"`
  - `type DateStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">`
  - `browserStorage(): DateStorage | null` — `window.localStorage` или `null` (нет окна / доступ запрещён)
  - `readStoredBirthDate(storage: DateStorage | null, today: Date): string | null` — корректная дата `YYYY-MM-DD` или `null` (мусор удаляется)
  - `storeBirthDate(storage: DateStorage | null, iso: string): void`, `clearStoredBirthDate(storage: DateStorage | null): void`
  - `pickBirthDate(p: { profile: string | null; stored: string | null }): { date: string | null; source: "profile" | "browser" | null }` — портрет главнее
  - `GOALS` = `["login", "birth_date_saved", "matrix_calculated", "matrix_save_click", "matrix_share", "arcana_to_calculator"]`
  - `LEGAL_VERSIONS.privacy` — новая редакция, `LEGAL_DATES = { consent, privacy }`
  - клиентский `LogoutButton` (форма `POST /api/auth/logout` + очистка даты)

## Зачем

Спецификация 2а, раздел 5. Калькулятор помнит дату анонимного посетителя только в его браузере. Всё обращение к `localStorage` собрано в одном модуле: доступ к хранилищу может бросить исключение (приватный режим, запрет сайта), и тогда калькулятор просто работает без памяти. Выход и удаление данных стирают браузерную копию, иначе после «Удалить мои данные» дата продолжала бы жить в браузере. Политика получает одну фразу о расчёте в браузере — это новая редакция политики; согласие не меняется.

## Шаги

- [ ] **Step 1: Падающие тесты хранилища**

`apps/web/src/lib/birth-date-storage.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { BIRTH_DATE_KEY, browserStorage, clearStoredBirthDate, pickBirthDate, readStoredBirthDate, storeBirthDate, type DateStorage } from "./birth-date-storage";

const TODAY = new Date("2026-09-26T12:00:00Z");

function memoryStorage(initial: Record<string, string> = {}): DateStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const broken: DateStorage = {
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
  removeItem: () => {
    throw new Error("denied");
  },
};

describe("readStoredBirthDate", () => {
  test("returns a valid stored date", () => {
    expect(readStoredBirthDate(memoryStorage({ [BIRTH_DATE_KEY]: "1988-11-18" }), TODAY)).toBe("1988-11-18");
  });

  test("drops garbage and future dates", () => {
    const storage = memoryStorage({ [BIRTH_DATE_KEY]: "2099-01-01" });
    expect(readStoredBirthDate(storage, TODAY)).toBeNull();
    expect(storage.data.has(BIRTH_DATE_KEY)).toBe(false);
  });

  test("survives a missing or broken storage", () => {
    expect(readStoredBirthDate(null, TODAY)).toBeNull();
    expect(readStoredBirthDate(broken, TODAY)).toBeNull();
  });
});

describe("storeBirthDate and clearStoredBirthDate", () => {
  test("write and remove the key", () => {
    const storage = memoryStorage();
    storeBirthDate(storage, "1990-05-14");
    expect(storage.data.get(BIRTH_DATE_KEY)).toBe("1990-05-14");
    clearStoredBirthDate(storage);
    expect(storage.data.has(BIRTH_DATE_KEY)).toBe(false);
  });

  test("never throw", () => {
    expect(() => storeBirthDate(broken, "1990-05-14")).not.toThrow();
    expect(() => clearStoredBirthDate(broken)).not.toThrow();
    expect(() => storeBirthDate(null, "1990-05-14")).not.toThrow();
  });
});

describe("pickBirthDate", () => {
  test("the portrait wins over the browser copy", () => {
    expect(pickBirthDate({ profile: "1990-05-14", stored: "1988-11-18" })).toEqual({ date: "1990-05-14", source: "profile" });
  });

  test("falls back to the browser copy, then to nothing", () => {
    expect(pickBirthDate({ profile: null, stored: "1988-11-18" })).toEqual({ date: "1988-11-18", source: "browser" });
    expect(pickBirthDate({ profile: null, stored: null })).toEqual({ date: null, source: null });
  });
});

describe("browserStorage", () => {
  test("is null outside the browser", () => {
    expect(browserStorage()).toBeNull();
  });
});
```

Run: `pnpm vitest run --project web apps/web/src/lib/birth-date-storage.test.ts` — Expected: FAIL (модуля нет).

- [ ] **Step 2: Модуль хранилища**

`apps/web/src/lib/birth-date-storage.ts`:

```ts
import { parseBirthDate, toIsoDate } from "@oracle/core";

// Дата, которую посетитель ввёл без входа, живёт только в его браузере — на сервер она уходит лишь при сохранении в портрет
export const BIRTH_DATE_KEY = "oracle-birth-date";

export type DateStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Обращение к localStorage может бросить (приватный режим, запрет сайта) — тогда калькулятор работает без памяти
export function browserStorage(): DateStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function clearStoredBirthDate(storage: DateStorage | null): void {
  try {
    storage?.removeItem(BIRTH_DATE_KEY);
  } catch {
    // нечего стирать
  }
}

export function readStoredBirthDate(storage: DateStorage | null, today: Date): string | null {
  try {
    const value = storage?.getItem(BIRTH_DATE_KEY) ?? null;
    if (value === null) return null;
    const date = parseBirthDate(value, today);
    if (!date) {
      clearStoredBirthDate(storage);
      return null;
    }
    return toIsoDate(date);
  } catch {
    return null;
  }
}

export function storeBirthDate(storage: DateStorage | null, iso: string): void {
  try {
    storage?.setItem(BIRTH_DATE_KEY, iso);
  } catch {
    // дата действует до перезагрузки страницы
  }
}

// Портрет главнее браузера: у вошедшего человека показываем сохранённую дату
export function pickBirthDate(p: { profile: string | null; stored: string | null }): { date: string | null; source: "profile" | "browser" | null } {
  if (p.profile) return { date: p.profile, source: "profile" };
  if (p.stored) return { date: p.stored, source: "browser" };
  return { date: null, source: null };
}
```

Run: тест Step 1 — Expected: PASS.

- [ ] **Step 3: Очистка при выходе и удалении**

`apps/web/src/components/LogoutButton.tsx`:

```tsx
"use client";

import { browserStorage, clearStoredBirthDate } from "@/lib/birth-date-storage";

// Обычная форма выхода; перед отправкой стираем дату из браузера, чтобы она не пережила выход на общем устройстве
export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post" onSubmit={() => clearStoredBirthDate(browserStorage())}>
      <button type="submit" className="button button--ghost">
        Выйти
      </button>
    </form>
  );
}
```

В `apps/web/src/app/portret/page.tsx` блок

```tsx
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="button button--ghost">
            Выйти
          </button>
        </form>
```

заменить на `<LogoutButton />` и добавить импорт `import { LogoutButton } from "@/components/LogoutButton";`.

В `apps/web/src/app/portret/delete/DeleteForm.tsx` добавить импорт `import { browserStorage, clearStoredBirthDate } from "@/lib/birth-date-storage";` и перед `window.location.assign("/?deleted=1");` строку `clearStoredBirthDate(browserStorage());`.

- [ ] **Step 4: Цели Метрики**

`apps/web/src/lib/analytics.ts` — заменить объявление `GOALS`:

```ts
// План 1: вход и дата; план 2а: воронка матрицы судьбы
export const GOALS = ["login", "birth_date_saved", "matrix_calculated", "matrix_save_click", "matrix_share", "arcana_to_calculator"] as const;
```

`apps/web/src/lib/analytics.test.ts` — последний тест заменить:

```ts
  test("the funnel goals of plans 1 and 2a", () => {
    expect(GOALS).toEqual(["login", "birth_date_saved", "matrix_calculated", "matrix_save_click", "matrix_share", "arcana_to_calculator"]);
  });
```

- [ ] **Step 5: Новая редакция политики**

Версия и дата политики — по дню, когда открывается PR задачи 9: версия `YYYY-MM-v1` для этого месяца (если это всё ещё сентябрь 2026 — `2026-09-v2`), дата — тем же днём прописью. Ниже пример для 1 октября 2026.

`apps/web/src/lib/legal.ts` — заменить две константы:

```ts
export const LEGAL_VERSIONS = { consent: "2026-09-v1", privacy: "2026-10-v1" } as const;
export const LEGAL_DATES = { consent: "24 сентября 2026 года", privacy: "1 октября 2026 года" } as const;
```

В `apps/web/src/app/consent/page.tsx` и `apps/web/src/app/privacy/page.tsx` заменить импорт `LEGAL_DATE` на `LEGAL_DATES` и строки «Редакция … от {LEGAL_DATE}» на `{LEGAL_DATES.consent}` и `{LEGAL_DATES.privacy}` соответственно. Проверить: `grep -rn "LEGAL_DATE\b" apps/web/src` — без вывода.

В `apps/web/src/app/privacy/page.tsx` сразу после списка раздела «2. Какие данные обрабатываются» (после закрывающего `</ul>`) добавить:

```tsx
        <p>
          Калькуляторы практик считают прямо в вашем браузере. Дату рождения, введённую без входа, сайт хранит только на вашем устройстве
          (в хранилище браузера) и получает её, только когда вы сохраняете дату в портрет. Выход и удаление данных стирают и эту копию.
        </p>
```

- [ ] **Step 6: Проверки**

Run: `pnpm typecheck && pnpm test`
Expected: PASS (включая старые тесты `legal.test.ts`).

- [ ] **Step 7: Коммит**

```bash
git add apps/web/src/lib/birth-date-storage.ts apps/web/src/lib/birth-date-storage.test.ts apps/web/src/components/LogoutButton.tsx apps/web/src/app/portret apps/web/src/lib/analytics.ts apps/web/src/lib/analytics.test.ts apps/web/src/lib/legal.ts apps/web/src/app/privacy/page.tsx apps/web/src/app/consent/page.tsx
git commit -m "feat(web): browser copy of the birth date, cleared on logout and deletion; matrix goals; privacy note"
```
