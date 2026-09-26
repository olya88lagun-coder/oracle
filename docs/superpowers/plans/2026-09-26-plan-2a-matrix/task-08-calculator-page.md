# Задача 8 — страница `/matrica-sudby`: ввод, результат, сохранение, «Поделиться»

**Files:**
- Create: `apps/web/src/lib/matrix-save.ts`; Test: `apps/web/src/lib/matrix-save.test.ts`
- Create: `apps/web/src/components/matrix/MatrixCalculator.tsx`, `SaveBlock.tsx`, `ShareButton.tsx`
- Create: `apps/web/src/app/matrica-sudby/page.tsx`
- Modify: `apps/web/src/app/globals.css` (блок «Калькулятор матрицы»)

**Interfaces:**
- Consumes: `parseBirthDate`, `toIsoDate`, `formatBirthDateRu`, `calculateMatrix` (`@oracle/core`); `arcanumByNumber` (`@oracle/content`); `browserStorage`, `readStoredBirthDate`, `storeBirthDate`, `pickBirthDate` (задача 5); `loginHref` (задача 4); `MATRIX_PATH`, `arcanumPath` (задача 6); `MatrixResult` (задача 7); `ArcanaIndex` (задача 6); `reachGoal`; `currentUser`, `loadPortrait`, `getDb` (план 1); `publicMetadata`; `SITE_URL`.
- Produces:
  - `type SaveStatus = "idle" | "saving" | "error"`, `type SaveBlockState = "guest" | "offer" | "saving" | "saved" | "error"`
  - `saveBlockState(p: { signedIn: boolean; profileDate: string | null; date: string; status: SaveStatus }): SaveBlockState`
  - `SAVE_INTENT_KEY = "oracle-save-after-login"`, `sessionStore(): IntentStorage | null`, `markSaveIntent(storage)`, `takeSaveIntent(storage): boolean`
  - `shareContent(arcanum: { number; name; slug }, siteUrl: string): { title: string; text: string; url: string }`
  - `DATE_ERROR = "Проверьте дату: она должна быть настоящей и не позже сегодняшней."`
  - страница `/matrica-sudby` (индексируется) с клиентским `<MatrixCalculator signedIn profileDate intro />`

## Зачем

Спецификация 2а, разделы 4–5; каркас, экраны 1–3. Первый экран — поле даты без регистрации. Результат считается в браузере и появляется ниже на той же странице. Блок сохранения:

| Состояние | Когда | Что видно |
|---|---|---|
| `guest` | не вошли | «Войти и сохранить» → `/login?next=/matrica-sudby` |
| `offer` | вошли, в портрете нет даты или другая дата | «Сохранить в портрет» (без перехода) |
| `saving` | идёт запрос | «Сохраняем…» в `role="status"` |
| `saved` | дата совпадает с портретом | «Сохранено.» в `role="status"` + «Открыть портрет» |
| `error` | запрос не удался | сообщение в `role="alert"` + «Повторить» |

После «Войти и сохранить» страница помечает намерение в `sessionStorage` (`oracle-save-after-login`). Вернувшись со входа, калькулятор сохраняет браузерную дату, **только если портрет пуст** (портрет главнее, без спроса не перезаписываем).

## Шаги

- [ ] **Step 1: Падающие тесты**

`apps/web/src/lib/matrix-save.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { markSaveIntent, SAVE_INTENT_KEY, saveBlockState, sessionStore, shareContent, takeSaveIntent, type IntentStorage } from "./matrix-save";

const DATE = "1988-11-18";

describe("saveBlockState", () => {
  test.each([
    [{ signedIn: false, profileDate: null, date: DATE, status: "idle" }, "guest"],
    [{ signedIn: true, profileDate: null, date: DATE, status: "idle" }, "offer"],
    [{ signedIn: true, profileDate: "1990-05-14", date: DATE, status: "idle" }, "offer"],
    [{ signedIn: true, profileDate: DATE, date: DATE, status: "idle" }, "saved"],
    [{ signedIn: true, profileDate: null, date: DATE, status: "saving" }, "saving"],
    [{ signedIn: true, profileDate: null, date: DATE, status: "error" }, "error"],
  ] as const)("%o → %s", (input, expected) => {
    expect(saveBlockState(input)).toBe(expected);
  });
});

function memory(): IntentStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe("save intent", () => {
  test("is taken exactly once", () => {
    const storage = memory();
    markSaveIntent(storage);
    expect(storage.data.get(SAVE_INTENT_KEY)).toBe("1");
    expect(takeSaveIntent(storage)).toBe(true);
    expect(takeSaveIntent(storage)).toBe(false);
  });

  test("survives a missing or broken storage", () => {
    const broken: IntentStorage = {
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
    expect(() => markSaveIntent(broken)).not.toThrow();
    expect(takeSaveIntent(broken)).toBe(false);
    expect(takeSaveIntent(null)).toBe(false);
    expect(sessionStore()).toBeNull();
  });
});

describe("shareContent", () => {
  test("links to the arcanum page and never contains the birth date", () => {
    const content = shareContent({ number: 11, name: "Сила", slug: "sila" }, "https://oracle.test");

    expect(content).toEqual({
      title: "Мой центр в матрице судьбы — аркан 11, «Сила»",
      text: "Мой центр в матрице судьбы — аркан 11, «Сила»",
      url: "https://oracle.test/matrica-sudby/arkan-11-sila",
    });
    expect(JSON.stringify(content)).not.toMatch(/\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4}/);
  });
});
```

Run: `pnpm vitest run --project web apps/web/src/lib/matrix-save.test.ts` — Expected: FAIL (модуля нет).

- [ ] **Step 2: Логика сохранения и шеринга**

`apps/web/src/lib/matrix-save.ts`:

```ts
import { arcanumPath } from "./arcana-paths";

export type SaveStatus = "idle" | "saving" | "error";
export type SaveBlockState = "guest" | "offer" | "saving" | "saved" | "error";

export const DATE_ERROR = "Проверьте дату: она должна быть настоящей и не позже сегодняшней.";

export function saveBlockState(p: { signedIn: boolean; profileDate: string | null; date: string; status: SaveStatus }): SaveBlockState {
  if (p.status === "saving") return "saving";
  if (p.status === "error") return "error";
  if (!p.signedIn) return "guest";
  return p.profileDate === p.date ? "saved" : "offer";
}

// «Войти и сохранить»: намерение переживает переход в VK ID и обратно в той же вкладке
export const SAVE_INTENT_KEY = "oracle-save-after-login";
export type IntentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function sessionStore(): IntentStorage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function markSaveIntent(storage: IntentStorage | null): void {
  try {
    storage?.setItem(SAVE_INTENT_KEY, "1");
  } catch {
    // без хранилища человек просто нажмёт «Сохранить в портрет» после входа
  }
}

export function takeSaveIntent(storage: IntentStorage | null): boolean {
  try {
    const marked = storage?.getItem(SAVE_INTENT_KEY) === "1";
    storage?.removeItem(SAVE_INTENT_KEY);
    return marked;
  } catch {
    return false;
  }
}

// Делимся страницей аркана центра — дата рождения в ссылку не попадает
export function shareContent(arcanum: { number: number; name: string; slug: string }, siteUrl: string): { title: string; text: string; url: string } {
  const text = `Мой центр в матрице судьбы — аркан ${arcanum.number}, «${arcanum.name}»`;
  return { title: text, text, url: `${siteUrl}${arcanumPath(arcanum)}` };
}
```

Run: тест Step 1 — Expected: PASS.

- [ ] **Step 3: Блок сохранения**

`apps/web/src/components/matrix/SaveBlock.tsx`:

```tsx
"use client";

import { formatBirthDateRu, parseBirthDate } from "@oracle/core";
import Link from "next/link";
import { reachGoal } from "@/lib/analytics";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { markSaveIntent, sessionStore, type SaveBlockState } from "@/lib/matrix-save";
import { loginHref } from "@/lib/next-path";

type Props = { state: SaveBlockState; profileDate: string | null; onSave: () => void };

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.7 2.7L16 9.8" />
    </svg>
  );
}

export function SaveBlock({ state, profileDate, onSave }: Props) {
  const other = profileDate ? parseBirthDate(profileDate, new Date()) : null;
  return (
    <div className="card stack save-block">
      <h3>{state === "saved" ? "Дата в портрете" : "Сохранить в портрет"}</h3>
      {(state === "guest" || state === "offer") && (
        <p className="muted">
          {state === "offer" && other
            ? `В портрете сейчас другая дата — ${formatBirthDateRu(other)}. Сохранить эту вместо неё?`
            : "Дата сохранится в «Моём портрете» — следующие практики возьмут её оттуда."}
        </p>
      )}
      {state === "guest" && (
        <p>
          <a
            className="button button--lavender"
            href={loginHref(MATRIX_PATH)}
            onClick={() => {
              markSaveIntent(sessionStore());
              reachGoal("matrix_save_click");
            }}
          >
            Войти и сохранить
          </a>
        </p>
      )}
      {state === "offer" && (
        <p>
          <button
            type="button"
            className="button button--lavender"
            onClick={() => {
              reachGoal("matrix_save_click");
              onSave();
            }}
          >
            Сохранить в портрет
          </button>
        </p>
      )}
      <p className="saved-note" role="status">
        {state === "saving" && "Сохраняем…"}
        {state === "saved" && (
          <>
            <CheckIcon />
            Сохранено.
          </>
        )}
      </p>
      {state === "saved" && <Link href="/portret">Открыть портрет</Link>}
      {state === "error" && (
        <>
          <p className="error" role="alert">
            Не получилось сохранить. Проверьте интернет и попробуйте ещё раз.
          </p>
          <p>
            <button type="button" className="button button--lavender" onClick={onSave}>
              Повторить
            </button>
          </p>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: «Поделиться»**

`apps/web/src/components/matrix/ShareButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { shareContent } from "@/lib/matrix-save";
import { SITE_URL } from "@/lib/site";

export function ShareButton({ arcanum }: { arcanum: { number: number; name: string; slug: string } }) {
  const [note, setNote] = useState("");

  async function share() {
    reachGoal("matrix_share");
    const content = shareContent(arcanum, SITE_URL);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(content);
        return;
      }
      await navigator.clipboard.writeText(content.url);
      setNote("Ссылка скопирована");
    } catch (error) {
      // Закрытое окно «Поделиться» — не ошибка
      if (error instanceof Error && error.name === "AbortError") return;
      setNote(`Не получилось поделиться — вот ссылка: ${content.url}`);
    }
  }

  return (
    <div className="card stack share-block">
      <h3>Поделиться</h3>
      <p className="muted">Ссылка ведёт на страницу вашего аркана центра. Даты рождения в ней нет.</p>
      <p>
        <button type="button" className="button button--ghost" onClick={share}>
          Поделиться
        </button>
      </p>
      <p className="muted" role="status">
        {note}
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Калькулятор**

`apps/web/src/components/matrix/MatrixCalculator.tsx`:

```tsx
"use client";

import { calculateMatrix, formatBirthDateRu, parseBirthDate, toIsoDate } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { reachGoal } from "@/lib/analytics";
import { browserStorage, pickBirthDate, readStoredBirthDate, storeBirthDate } from "@/lib/birth-date-storage";
import { DATE_ERROR, saveBlockState, sessionStore, takeSaveIntent, type SaveStatus } from "@/lib/matrix-save";
import { MatrixResult } from "./MatrixResult";
import { SaveBlock } from "./SaveBlock";
import { ShareButton } from "./ShareButton";

type Props = { signedIn: boolean; profileDate: string | null; intro: ReactNode };

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function MatrixCalculator({ signedIn, profileDate: initialProfileDate, intro }: Props) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileDate, setProfileDate] = useState(initialProfileDate);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const parsed = useMemo(() => (date ? parseBirthDate(date, new Date()) : null), [date]);
  const matrix = useMemo(() => (parsed ? calculateMatrix(parsed) : null), [parsed]);

  const save = useCallback(async (iso: string) => {
    setStatus("saving");
    try {
      const response = await fetch("/api/profile/birth-date", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ birthDate: iso }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      reachGoal("birth_date_saved");
      setProfileDate(iso);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, []);

  // Дата из портрета или из браузера; после «Войти и сохранить» — сохраняем браузерную дату в пустой портрет
  useEffect(() => {
    const storage = browserStorage();
    const stored = readStoredBirthDate(storage, new Date());
    const picked = pickBirthDate({ profile: initialProfileDate, stored });
    if (picked.date) {
      setValue(picked.date);
      setDate(picked.date);
      storeBirthDate(storage, picked.date);
    }
    if (takeSaveIntent(sessionStore()) && signedIn && !initialProfileDate && stored) void save(stored);
  }, [initialProfileDate, signedIn, save]);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = parseBirthDate(value, new Date());
    if (!next) {
      setError(DATE_ERROR);
      return;
    }
    const iso = toIsoDate(next);
    setError(null);
    setStatus("idle");
    setDate(iso);
    storeBirthDate(browserStorage(), iso);
    reachGoal("matrix_calculated");
    requestAnimationFrame(() => {
      headingRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <>
      <section className="matrix-hero">
        {intro}
        <form className="card stack matrix-form" onSubmit={calculate} noValidate>
          <div className="field">
            <label htmlFor="matrix-date">Дата рождения</label>
            <input id="matrix-date" className="input" type="date" min="1900-01-01" value={value} onChange={(event) => setValue(event.target.value)} />
          </div>
          <button type="submit" className="button button--lavender" disabled={!value}>
            Рассчитать
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <p className="muted">Считается в вашем браузере — дату мы не получаем.</p>
        </form>
      </section>

      {matrix && parsed && date && (
        <MatrixResult
          matrix={matrix}
          dateLabel={formatBirthDateRu(parsed)}
          headingRef={headingRef}
          actions={
            <div className="matrix-actions">
              <SaveBlock state={saveBlockState({ signedIn, profileDate, date, status })} profileDate={profileDate} onSave={() => void save(date)} />
              <ShareButton arcanum={arcanumByNumber(matrix.E)} />
            </div>
          }
        />
      )}
    </>
  );
}
```

- [ ] **Step 6: Страница**

`apps/web/src/app/matrica-sudby/page.tsx`:

```tsx
import { toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import { ArcanaIndex } from "@/components/ArcanaIndex";
import { MatrixCalculator } from "@/components/matrix/MatrixCalculator";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { publicMetadata } from "@/lib/seo";
import { getDb } from "@/server/db";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = publicMetadata({
  title: "Матрица судьбы по дате рождения — расчёт онлайн",
  description:
    "Рассчитайте матрицу судьбы по дате рождения: все 22 аркана на диаграмме и трактовка трёх ключевых точек — личности, центра и задачи. Бесплатно, без регистрации.",
  path: MATRIX_PATH,
});

export default async function MatrixPage() {
  const user = await currentUser();
  const portrait = user ? await loadPortrait({ db: getDb(), now: () => new Date() }, user.id) : null;
  const profileDate = portrait?.birthDate ? toIsoDate(portrait.birthDate) : null;

  return (
    <main className="page page--wide stack matrix-page">
      <MatrixCalculator
        signedIn={Boolean(user)}
        profileDate={profileDate}
        intro={
          <div className="stack">
            <p className="eyebrow eyebrow--line">Практика · матрица судьбы</p>
            <h1 className="display">Матрица судьбы по дате рождения</h1>
            <p className="lead">
              22 аркана вашей даты: на что вы опираетесь, как вас видят и какую задачу стоит заметить. Без предсказаний — как зеркало для
              размышления.
            </p>
          </div>
        }
      />

      <section className="stack matrix-about" aria-labelledby="matrix-about">
        <h2 id="matrix-about">Что такое матрица судьбы</h2>
        <p>
          Матрица судьбы раскладывает дату рождения на 22 аркана — те же образы, что у старших арканов Таро. Каждое число занимает своё
          место на диаграмме: одни точки говорят о характере, другие — об опоре, третьи — о задачах и отношениях.
        </p>
        <p>
          Мы не используем матрицу для предсказаний. Это способ посмотреть на себя через символы и задать себе хорошие вопросы: где ваши
          силы, что повторяется, куда хочется расти. Трактовки — гипотезы для размышления, а не диагноз и не приговор.
        </p>
      </section>

      <ArcanaIndex />
    </main>
  );
}
```

- [ ] **Step 7: Стили**

В `apps/web/src/app/globals.css` перед `/* Карточки практик` добавить:

```css
/* Калькулятор матрицы: вводная и форма на первом экране, ниже — результат */
.matrix-hero { display: grid; gap: 24px; align-items: center; }
.matrix-form { max-width: 440px; }
.matrix-actions { display: grid; gap: 16px; }
.matrix-actions h3, .save-block h3, .share-block h3 { font-size: 24px; }
.matrix-actions p { margin: 0; }
.matrix-about { max-width: 760px; }
@media (min-width: 900px) {
  .matrix-hero { grid-template-columns: 1.2fr 1fr; gap: 48px; min-height: 420px; }
  .matrix-actions { grid-template-columns: 1fr 1fr; }
}
```

- [ ] **Step 8: Проверки**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

Локально (сервер `oracle-3100` — `APP_URL=http://localhost:3100`, см. задачу 10, Step 1): на 1440 и 375 px проверить:
1. `/matrica-sudby` без входа: ввести 18.11.1988 → «Рассчитать» → результат, A 18 Луна, E 11 Сила, D 10 Колесо Фортуны; блок «Войти и сохранить».
2. Перезагрузка — дата в поле и результат на месте.
3. 01.01.2099 → «Рассчитать» → сообщение `DATE_ERROR` в `role="alert"`.
4. «Войти и сохранить» → `/login?next=%2Fmatrica-sudby`. Затем `/api/dev/login?name=Проба&next=/matrica-sudby` (dev-вход имитирует возврат со входа) — чтобы проверить автосохранение, перед этим в консоли `sessionStorage.setItem("oracle-save-after-login","1")`: после возврата блок показывает «Сохранено.», в `/portret` — та же дата.
5. Вошли с датой в портрете, в калькуляторе ввели другую → «Сохранить в портрет» с текстом «В портрете сейчас другая дата — …».
6. Нет горизонтальной прокрутки, фокус видим, «Поделиться» на компьютере пишет «Ссылка скопирована».

- [ ] **Step 9: Коммит**

```bash
git add apps/web/src/lib/matrix-save.ts apps/web/src/lib/matrix-save.test.ts apps/web/src/components/matrix apps/web/src/app/matrica-sudby/page.tsx apps/web/src/app/globals.css
git commit -m "feat(web): /matrica-sudby calculator with browser-side result, portrait saving and sharing"
```
