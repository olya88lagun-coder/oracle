# Нумерология — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Бесплатный раздел нумерологии для поискового трафика: калькулятор числа судьбы, 12 страниц чисел, личный год 2027 с 9 страницами и 45 страниц чисел на часах. Выходит двумя релизами.

**Architecture:** Расчёт — чистые функции в `packages/core/src/numerology.ts`. Тексты — markdown в `packages/content/numerology/`; они собираются в `generated/numerology.json` и публикуются только из принятых партий, как у натальной карты. Страницы — Next.js App Router в `apps/web/src/app/numerologiya/`: статические, `dynamicParams = false`, SEO через `lib/seo.ts`.

**Tech Stack:** TypeScript, Next.js App Router, Vitest, pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-11-08-numerology-design.md`

## Global Constraints

- Всё бесплатно: никаких цен, оплаты, `productEnum`, оферты, `packages/ai`. БД не меняется.
- Расчёт только в браузере. Дата не уходит на сервер и в события Метрики.
- Тон текстов — по разделу «Текст» в `docs/oracle-article-writer.md`: обращение на «вы», нейтральный род, язык гипотез, без предсказаний, без слов с основой «карм». Проверка — существующий `findStopPhrases` из `packages/content/src/check.ts`.
- Объём: страницы чисел судьбы и личного года — не меньше 4 000 знаков тела, страницы часов — не меньше 2 500. У каждой страницы свой текст.
- Страница из непринятой партии отдаёт 404, её нет в `PUBLIC_PATHS` и sitemap, на неё нет ссылок.
- Стиль: Noto Serif Display / Manrope, ночной фон, бронзовые рамки. Приоритет — 375 px, элементы ≥ 44 px, текст ≥ 14 px, видимый фокус, reduced motion.
- Релиз 1 (задачи 1–7) — к 01.12.2026. Релиз 2 (задача 8) — в декабре 2026.

## Review Focus

1. **Мастер-число в калькуляторе.** Дата с итогом 11 ведёт на `/numerologiya/chislo-sudby/11`, а не на страницу 2. Тест — в задаче 5.
2. **Непринятая партия.** Хаб и калькулятор не ссылаются на 404: у числа без принятого текста показываются только цифра и пометка «описание появится позже», без ссылки. Тест — в задаче 5.
3. **Нестандартный адрес часа.** `/numerologiya/chasy/1111` и `/numerologiya/chasy/11:11` дают 404, существует только `11-11`. Тест — в задаче 8.
4. **Пустое или неверное поле даты на телефоне.** Показывается `DATE_ERROR`, без исключения и без события `numerology_calculated`. Тест — в задаче 5.
5. **`sessionStorage` недоступен.** Кнопка перехода к матрице всё равно ведёт на `/matrica-sudby`. Тест — в задаче 5.

---

### Task 1: Расчёт в `packages/core`

**Files:**
- Create: `packages/core/src/numerology.ts`
- Create: `packages/core/src/numerology.test.ts`
- Modify: `packages/core/src/index.ts` — добавить `export * from "./numerology";`

**Interfaces:**
- Consumes: `parseBirthDate(value: unknown, today: Date): BirthDate | null` из `./birth-date`.
- Produces:
  - `export const MASTER_NUMBERS: readonly [11, 22, 33]`
  - `export const FATE_NUMBERS: readonly number[]` = `[1,2,3,4,5,6,7,8,9,11,22,33]`
  - `export type FateNumber = { readonly sum: number; readonly steps: readonly number[]; readonly value: number }` — `sum` = сумма цифр даты; `steps` = цепочка свёртки от `sum` до `value` включительно.
  - `export function calculateFateNumber(iso: string, today: Date): FateNumber | null`
  - `export const PERSONAL_YEAR = 2027`
  - `export type PersonalYear = { readonly year: 2027; readonly sum: number; readonly value: number }`
  - `export function calculatePersonalYear(iso: string, today: Date): PersonalYear | null`
  - `export type ClockKind = "repeat" | "mirror" | "both"`
  - `export type ClockTime = { readonly slug: string; readonly label: string; readonly hours: number; readonly minutes: number; readonly kind: ClockKind }` — `slug` `"11-11"`, `label` `"11:11"`.
  - `export const CLOCK_TIMES: readonly ClockTime[]` — 45 штук, по возрастанию времени.
  - `export function clockBySlug(slug: string): ClockTime | undefined`

- [ ] **Step 1: Write the failing tests** в `numerology.test.ts`:

```ts
const TODAY = new Date("2026-11-08");
test.each([
  ["1992-03-14", 29, 11],
  ["1990-11-29", 32, 5],
  ["1990-01-02", 22, 22],
  ["1980-09-15", 33, 33],
  ["2000-01-01", 4, 4],
])("fate number of %s: sum %i, value %i", (iso, sum, value) => {
  expect(calculateFateNumber(iso, TODAY)).toMatchObject({ sum, value });
});
test("sum 47 stops at master 11, not 2", () => {
  expect(calculateFateNumber("1999-09-28", TODAY)).toEqual({ sum: 47, steps: [47, 11], value: 11 });
});
test.each(["", "2027-01-01", "1991-02-29", "1992-13-01", "not-a-date"])("rejects %s", (iso) => {
  expect(calculateFateNumber(iso, TODAY)).toBeNull();
  expect(calculatePersonalYear(iso, TODAY)).toBeNull();
});
test.each([["1992-03-14", 19, 1], ["1990-11-29", 24, 6]])("personal year of %s", (iso, sum, value) => {
  expect(calculatePersonalYear(iso, TODAY)).toEqual({ year: 2027, sum, value });
});
test("personal year ignores birth year and never keeps masters", () => {
  expect(calculatePersonalYear("1990-03-14", TODAY)?.value).toBe(1);
  for (let d = 1; d <= 28; d++) for (let m = 1; m <= 12; m++) {
    const v = calculatePersonalYear(`1990-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, TODAY)!.value;
    expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(9);
  }
});
test("45 clock times: repeats, mirrors, three overlaps", () => {
  expect(CLOCK_TIMES).toHaveLength(45);
  expect(new Set(CLOCK_TIMES.map((t) => t.slug)).size).toBe(45);
  expect(CLOCK_TIMES.filter((t) => t.kind === "both").map((t) => t.slug)).toEqual(["00-00", "11-11", "22-22"]);
  expect(clockBySlug("12-21")).toMatchObject({ label: "12:21", kind: "mirror" });
  expect(clockBySlug("23-23")?.kind).toBe("repeat");
  expect(CLOCK_TIMES.every((t) => t.minutes < 60 && t.hours < 24)).toBe(true);
  expect(clockBySlug("1111")).toBeUndefined();
});
```

- [ ] **Step 2: Run** `pnpm vitest run packages/core/src/numerology.test.ts` — Expected: FAIL, модуль не найден.

- [ ] **Step 3: Implement** функции в `numerology.ts`.
  - `calculateFateNumber`: сумма цифр `ДДММГГГГ`. Если сумма в `MASTER_NUMBERS` — стоп. Иначе сумма цифр, пока значение > 9 и не мастер-число.
  - `calculatePersonalYear`: цифры дня + цифры месяца + 2 + 0 + 2 + 7, свёртка до 1–9 без остановки на мастер-числах.
  - `CLOCK_TIMES`: объединение двух множеств — `hh == mm` для hh 0–23 и `mm = reverse(hh)` для hh 0–23 — с сортировкой по `hours * 60 + minutes`.

- [ ] **Step 4: Run** тот же тест — Expected: PASS.

- [ ] **Step 5: Commit** `feat(core): numerology fate number, personal year 2027 and clock times`.

---

### Task 2: Формат и сборка текстов в `packages/content`

**Files:**
- Create: `packages/content/src/numerology-manifest.ts`
- Create: `packages/content/src/numerology.ts`
- Create: `packages/content/src/numerology-texts.ts`
- Create: `packages/content/src/numerology.test.ts`
- Create: `packages/content/numerology/.gitkeep`
- Modify: `packages/content/scripts/build-arcana.mjs` — `write(join(root, "src", "generated", "numerology.json"), collectArcana(join(root, "numerology")))`
- Modify: `packages/content/package.json` — export `"./numerology": "./src/numerology-texts.ts"`

**Interfaces:**
- Consumes: `FATE_NUMBERS`, `CLOCK_TIMES` из `@oracle/core`; `findStopPhrases` из `./check`.
- Produces:
  - `export type NumerologyKind = "fate" | "year" | "clock"`
  - `export type NumerologyPageRef = { readonly kind: NumerologyKind; readonly key: string; readonly batch: number }` — `key`: `"7"` для fate и year, `"11-11"` для clock.
  - `export const NUMEROLOGY_PAGES: readonly NumerologyPageRef[]` — 12 fate (партия 1), 9 year (партия 2), 45 clock (партии 3, 4, 5 по 15, в порядке `CLOCK_TIMES`).
  - `export const NUMEROLOGY_ACCEPTED_BATCHES: ReadonlySet<number>` — в этой задаче пустое множество.
  - `export const NUMEROLOGY_SECTION_TITLES: Record<NumerologyKind, readonly string[]>`:
    - fate: `["Суть", "Сильные стороны", "Сложности", "Отношения", "Дело", "Вопрос для себя"]`
    - year: `["Тема года", "На что опереться", "Где осторожнее", "Вопрос для себя", "Три совета"]`
    - clock: `["Коротко", "Из каких чисел", "Вопрос для себя", "Частые вопросы"]`
  - `export type NumerologyText = { readonly kind: NumerologyKind; readonly key: string; readonly title: string; readonly description: string; readonly batch: number; readonly sections: readonly { title: string; paragraphs: readonly string[] }[]; readonly faq: readonly { question: string; answer: string }[] }` — `faq` разбирается из раздела «Частые вопросы» (у fate и year пустой).
  - `export function parseNumerologyPage(source: string, file: string): NumerologyText` — бросает `NumerologyFormatError`.
  - `export function numerologyText(kind: NumerologyKind, key: string): NumerologyText | undefined` — только из принятых партий.
  - `export function acceptedNumerologyPages(kind: NumerologyKind): readonly NumerologyPageRef[]`
  - `export function numerologySummary(text: NumerologyText): string` — первый абзац первого раздела.

Файл текста: `packages/content/numerology/<kind>-<key>.md`. Шапка `kind`, `key`, `title`, `description` (90–175 знаков), `batch`. Затем разделы `## ` строго в порядке `NUMEROLOGY_SECTION_TITLES[kind]`. В «Частых вопросах» каждый вопрос — строка `**Вопрос?**`, ответ — следующий абзац.

- [ ] **Step 1: Write the failing tests** в `numerology.test.ts`:
  - `NUMEROLOGY_PAGES` — 66 записей; партии 1/2/3/4/5 содержат 12/9/15/15/15 страниц.
  - `parseNumerologyPage` на встроенной строке-образце fate разбирает 6 разделов и `faq: []`; на образце clock даёт `faq.length >= 2`.
  - Отказы: отсутствует раздел; разделы в другом порядке; `description` короче 90 знаков. Каждый случай — `NumerologyFormatError`.
  - Для каждого файла в `generated/numerology.json`: имя совпадает с `kind-key` из шапки; объём тела ≥ 4 000 знаков (fate, year) или ≥ 2 500 (clock); `findStopPhrases` пуст; нет подстроки `карм` без учёта регистра.
  - `generated/numerology.json` совпадает со сборкой из markdown — по образцу теста в `natal-keys.test.ts`.
  - `numerologyText("fate", "7")` — `undefined`, пока партия 1 не принята.

- [ ] **Step 2: Run** `pnpm content:build && pnpm vitest run packages/content/src/numerology.test.ts` — Expected: FAIL, модулей нет.

- [ ] **Step 3: Implement** манифест, парсер и загрузку по образцу `natal-manifest.ts`, `natal.ts`, `natal-texts.ts`.

- [ ] **Step 4: Run** тот же набор — Expected: PASS (файлов текстов ещё нет, проверки по файлам проходят пусто).

- [ ] **Step 5: Commit** `feat(content): numerology text format, manifest and accepted batches`.

---

### Task 3: Тексты партии 1 — числа судьбы (12)

**Files:**
- Create: `packages/content/numerology/fate-{1..9,11,22,33}.md`
- Modify: `packages/content/src/generated/numerology.json` (через `pnpm content:build`)

- [ ] **Step 1:** Написать 12 текстов по формату задачи 2. У каждого числа — свои образ, сильные стороны, сложности и вопрос; общих абзацев нет. Мастер-числа 11, 22 и 33 описываются как отдельные, а не как «усиленные 2/4/6».
- [ ] **Step 2: Run** `pnpm content:build && pnpm vitest run packages/content` — Expected: PASS.
- [ ] **Step 3: Commit** `content(numerology): batch 1 — fate numbers`.
- [ ] **Step 4:** Отдать партию владелице на приёмку: список файлов и по одному абзацу из каждого. Ждать явного «принято».
- [ ] **Step 5:** После «принято» — отдельным коммитом добавить `1` в `NUMEROLOGY_ACCEPTED_BATCHES` с комментарием-датой, как у натальных партий. Commit `content(numerology): accept batch 1`.

---

### Task 4: Тексты партии 2 — личный год 2027 (9)

**Files:**
- Create: `packages/content/numerology/year-{1..9}.md`

- [ ] **Step 1:** 9 текстов. «Три совета» — список из трёх пунктов, у каждого года свои. Тексты не повторяют смысл арканов из `/arkan-2027`: это другая практика, и страница на неё ссылается.
- [ ] **Step 2–5:** как в задаче 3: сборка и тесты → commit `content(numerology): batch 2 — personal year 2027` → приёмка владелицей → commit `content(numerology): accept batch 2`.

---

### Task 5: Калькулятор `/numerologiya` и страницы чисел судьбы

**Files:**
- Create: `apps/web/src/lib/numerology.ts` + `numerology.test.ts`
- Create: `apps/web/src/components/numerology/FateCalculator.tsx`, `FateResult.tsx`, `NumerologyPageView.tsx`, `numerology.css`
- Create: `apps/web/src/app/numerologiya/page.tsx` + `page.test.tsx`
- Create: `apps/web/src/app/numerologiya/chislo-sudby/[n]/page.tsx` + `page.test.tsx`
- Modify: `apps/web/src/lib/analytics.ts` — в `GOALS` добавить `"numerology_calculated"`, `"numerology_to_matrix"`, `"personal_year_calculated"`, `"personal_year_to_arkan"`
- Modify: `apps/web/src/lib/seo.ts` — в `PUBLIC_PATHS` добавить `NUMEROLOGY_PATH` и `...acceptedFatePaths()`
- Modify: `apps/web/src/app/sitemap.ts` — `NUMEROLOGY_PATH` в `PRACTICE_PATHS`

**Interfaces:**
- Consumes: задачи 1 и 2; `publicMetadata`, `jsonLdScript`, `breadcrumbJsonLd` из `lib/seo.ts`; `sessionStore` из `lib/matrix-save.ts`; `prepareMatrixHandoff` из `lib/year-arcana.ts`; `DATE_ERROR` из `lib/matrix-save.ts`.
- Produces (`apps/web/src/lib/numerology.ts`):
  - `export const NUMEROLOGY_PATH = "/numerologiya"`
  - `export const fatePath = (n: number): string` → `/numerologiya/chislo-sudby/${n}`
  - `export function acceptedFatePaths(): string[]`
  - `export const FATE_FAQ: readonly { question: string; answer: string }[]` — 4–6 вопросов, один из них «Как считается число судьбы» с формулой и примером 14.03.1992 → 29 → 11.

- [ ] **Step 1: Write the failing tests:**
  - `lib/numerology.test.ts`: `fatePath(11) === "/numerologiya/chislo-sudby/11"`; `acceptedFatePaths()` содержит 12 адресов, когда партия 1 принята, и 0 — когда нет (подменить множество через `vi.mock`).
  - `numerologiya/page.test.tsx` по образцу `arkan-2027/page.test.tsx`:
    - JSON-LD содержит `WebApplication`, `FAQPage` из `FATE_FAQ` и `BreadcrumbList`;
    - ввод `1992-03-14` показывает 11 и ссылку на `/numerologiya/chislo-sudby/11`;
    - пустая и неверная дата показывают `DATE_ERROR`, а `reachGoal` не вызывается;
    - если число из непринятой партии — показана цифра и текст «Описание появится позже», ссылки на страницу числа нет;
    - кнопка «Посчитать матрицу по этой дате» имеет `href="/matrica-sudby"` и работает, когда `sessionStore()` возвращает `null`.
  - `chislo-sudby/[n]/page.test.tsx`: `generateStaticParams` возвращает 12 значений; есть canonical, `Article` и `BreadcrumbList`; ссылки на соседние числа и на `/numerologiya`.

- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/numerology.test.ts apps/web/src/app/numerologiya` — Expected: FAIL.

- [ ] **Step 3: Implement.**
  - Страница калькулятора повторяет структуру `app/arkan-2027/page.tsx`: крошки, калькулятор, блок «Открытая формула», каталог 12 чисел (ссылки только на принятые), FAQ, сноска «Практика для самопознания…».
  - Title: «Число судьбы по дате рождения — рассчитать онлайн».
  - Description (90–175 знаков) отвечает на запрос «число судьбы рассчитать по дате рождения» и упоминает «бесплатно, без регистрации».
  - Страница числа: `dynamicParams = false`, разделы текста по порядку, H1 = `title` из текста.

- [ ] **Step 4: Run** тот же набор + `pnpm typecheck` — Expected: PASS.

- [ ] **Step 5: Commit** `feat(web): numerology calculator and fate number pages`.

---

### Task 6: Личный год 2027

**Files:**
- Create: `apps/web/src/components/numerology/PersonalYearCalculator.tsx`
- Create: `apps/web/src/app/numerologiya/lichnyy-god-2027/page.tsx` + `page.test.tsx`
- Create: `apps/web/src/app/numerologiya/lichnyy-god-2027/[n]/page.tsx` + `page.test.tsx`
- Modify: `apps/web/src/lib/numerology.ts` — `PERSONAL_YEAR_PATH = "/numerologiya/lichnyy-god-2027"`, `personalYearPath(n)`, `acceptedPersonalYearPaths()`, `PERSONAL_YEAR_FAQ` (4–6 вопросов, один — «Чем личный год отличается от аркана 2027»)
- Modify: `apps/web/src/lib/seo.ts`, `apps/web/src/app/sitemap.ts` — по образцу задачи 5
- Modify: `apps/web/src/app/arkan-2027/page.tsx` — в блок «Открытая формула» ссылка «Личный год 2027 по нумерологии» на `PERSONAL_YEAR_PATH`

**Interfaces:**
- Consumes: `calculatePersonalYear` (задача 1), `numerologyText("year", key)` (задача 2), `NumerologyPageView` (задача 5).
- Produces: `PERSONAL_YEAR_PATH`, `personalYearPath(n: number): string`, `acceptedPersonalYearPaths(): string[]`, `PERSONAL_YEAR_FAQ`.

- [ ] **Step 1: Write the failing tests:**
  - `1992-03-14` → 1, ссылка на `/numerologiya/lichnyy-god-2027/1`, событие `personal_year_calculated`;
  - на странице есть ссылка на `/arkan-2027`, а `arkan-2027/page.tsx` ссылается на `PERSONAL_YEAR_PATH`;
  - `[n]` даёт 9 static params и 404 для `11`;
  - JSON-LD: `WebApplication`, `FAQPage`, `BreadcrumbList`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** по образцу задачи 5. Title: «Личный год 2027 по дате рождения — нумерология».
- [ ] **Step 4: Run** тесты + `pnpm typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): personal year 2027 calculator and pages`.

---

### Task 7: Встроить в сайт и выпустить релиз 1

**Files:**
- Modify: `apps/web/src/lib/practices.ts` — `slug` дополнить `"numerology"`; новая запись шестой: `{ slug: "numerology", title: "Нумерология", summary: "Число судьбы и личный год 2027 по дате рождения: расчёт с объяснением и описание каждого числа.", href: NUMEROLOGY_PATH }`
- Modify: `apps/web/src/app/matrica-sudby/page.tsx` — одна ссылка на `/numerologiya` в справочном блоке
- Modify: тесты `practices`, главной и футера, которые проверяют число практик
- Modify: `.github/workflows/deploy.yml` — smoke-проверка `curl -fsS "$SITE/numerologiya"` + `assert_contains 'content="index, follow"'`

- [ ] **Step 1:** Обновить тесты, которые считают практики (5 → 6), и добавить проверку, что на главной есть ссылка на `/numerologiya`. Run — Expected: FAIL.
- [ ] **Step 2:** Внести изменения. Run `pnpm test && pnpm typecheck && pnpm --filter @oracle/web build` — Expected: всё зелёное, в выводе build есть `/numerologiya/chislo-sudby/[n]` и `/numerologiya/lichnyy-god-2027/[n]`.
- [ ] **Step 3:** Локальная проверка в браузере на 375 и 1280 px:
  - калькулятор: 14.03.1992 → 11;
  - переход к матрице подставляет дату;
  - нет горизонтальной прокрутки;
  - фокус виден с клавиатуры;
  - `/sitemap.xml` содержит 1 + 12 + 1 + 9 = 23 новых адреса при принятых партиях 1 и 2.
- [ ] **Step 4: Commit** `feat(web): numerology as sixth practice` → PR «Нумерология: релиз 1». Мерж — только по «да» владелицы. После деплоя IndexNow отправит новые адреса сам.

---

### Task 8: Релиз 2 — числа на часах (45)

**Files:**
- Create: `packages/content/numerology/clock-<hh-mm>.md` × 45 (партии 3, 4, 5 по 15, в порядке `CLOCK_TIMES`)
- Create: `apps/web/src/app/numerologiya/chasy/page.tsx` + `page.test.tsx`
- Create: `apps/web/src/app/numerologiya/chasy/[time]/page.tsx` + `page.test.tsx`
- Modify: `apps/web/src/lib/numerology.ts` — `CLOCK_PATH = "/numerologiya/chasy"`, `clockPath(slug: string): string`, `acceptedClockPaths(): string[]`, `relatedClocks(slug: string): readonly ClockTime[]` (2–3 ближайших того же `kind`)
- Modify: `apps/web/src/lib/seo.ts`, `apps/web/src/app/sitemap.ts`, `apps/web/src/app/numerologiya/page.tsx` (ссылка на хаб часов)

- [ ] **Step 1:** Тексты партии 3 (15 часов). Первые 2–3 строки «Коротко» прямо отвечают на «что значит HH:MM на часах»; «Частые вопросы» — не меньше двух. Сборка и тесты задачи 2 → commit → приёмка владелицей → commit с принятием. Затем так же партии 4 и 5.
- [ ] **Step 2: Write the failing tests:**
  - хаб группирует часы на «Одинаковые» и «Зеркальные», а `both` показывает в обеих группах;
  - `[time]` даёт static params только для принятых;
  - `1111` и `11:11` дают 404, `11-11` открывается;
  - JSON-LD: `Article`, `FAQPage` из `faq` текста, `BreadcrumbList`;
  - на странице ссылки на хаб и на `relatedClocks`.
- [ ] **Step 3: Run** — Expected: FAIL. **Implement** по образцу задачи 5. Title страницы: «HH:MM на часах — значение в нумерологии».
- [ ] **Step 4: Run** `pnpm test && pnpm typecheck && pnpm --filter @oracle/web build` — Expected: PASS. Проверка в браузере на 375 px.
- [ ] **Step 5: Commit** `feat(web): clock-time numerology pages` → PR «Нумерология: релиз 2», мерж по «да» владелицы.
