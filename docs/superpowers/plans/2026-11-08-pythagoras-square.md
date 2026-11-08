# Квадрат Пифагора — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Бесплатный калькулятор квадрата Пифагора, 9 страниц ячеек и страница линий в разделе «Нумерология».

**Architecture:** Расчёт — чистая функция в `packages/core/src/numerology.ts` рядом с числом судьбы. Тексты — новый вид страницы `square` в существующем формате нумерологии (`packages/content/numerology/square-<key>.md`, приёмка партиями через `NUMEROLOGY_ACCEPTED_BATCHES`). Страницы — `apps/web/src/app/numerologiya/kvadrat-pifagora/`, общий `NumerologyPageView`, адреса и тексты интерфейса — новый `apps/web/src/lib/pythagoras.ts`.

**Tech Stack:** TypeScript, Next.js App Router, Vitest (`renderToStaticMarkup`, без DOM), pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-11-08-pythagoras-square-design.md`

## Global Constraints

- Бесплатно, без входа, без БД и сервера: расчёт в браузере, дата не попадает в адрес, хранилище (кроме передачи в матрицу через `prepareMatrixHandoff`), цели Метрики.
- Метод Александрова без «+19»; третье число по модулю; нули в квадрат не идут.
- Названия ячеек и линий — дословно из таблиц спеки. Ячейка 4 «Выносливость», ячейка 8 «Ответственность»; о здоровье и болезнях не пишем, слов с основой «карм» нет, `findStopPhrases` пуст.
- Объём: страница ячейки ≥ 4 500 знаков тела, страница линий ≥ 5 000.
- Страница непринятой партии — 404, её нет в `PUBLIC_PATHS` и sitemap, на неё нет ссылок (в том числе из калькулятора).
- 375 px без горизонтальной прокрутки, текст ≥ 14 px, зоны нажатия ≥ 44 px, один `<h1>`, ошибки `role="alert"`, квадрат — `<table>` с `<caption>`.
- Коммиты — conventional commits на английском с `Co-Authored-By`.

## Review Focus

1. **День с ведущим нулём** (07.03.1990): в третьем числе удваивается 7, а не 0. Тест — задача 1.
2. **Отрицательное третье число** (09.01.2000: 12 − 18): берётся 6. Тест — задача 1.
3. **Шесть и больше одинаковых цифр**: в калькуляторе ссылка и текст ведут на последний вариант «ddddd и больше». Тест — задача 4.
4. **Непринятая партия**: у ячейки без принятого текста в результате нет ссылки, вместо описания — «Описание появится позже.». Тест — задача 5.
5. **Пустая ячейка**: в квадрате «—», ссылка на якорь `#pusto`, в таблице есть `<caption>`. Тест — задача 5.

---

### Task 1: Расчёт квадрата в ядре

**Files:**
- Modify: `packages/core/src/numerology.ts`
- Test: `packages/core/src/numerology.test.ts`

**Interfaces:**
- Produces:
  - `type SquareLineId = "celeustremlennost" | "semya" | "privychki" | "samoocenka" | "byt" | "talant" | "duhovnost" | "temperament"`
  - `SQUARE_LINES: readonly { id: SquareLineId; cells: readonly [number, number, number] }[]` — порядок и ячейки из таблицы линий спеки (строки 1-4-7, 2-5-8, 3-6-9; столбцы 1-2-3, 4-5-6, 7-8-9; диагонали 1-5-9, 3-5-7).
  - `type PythagorasSquare = { readonly working: readonly [number, number, number, number]; readonly counts: readonly number[] /* индекс 1–9, counts[0] не используется */; readonly lines: readonly { id: SquareLineId; count: number }[] }`
  - `calculatePythagorasSquare(iso: string, today: Date): PythagorasSquare | null` — через `parseBirthDate`, как `calculateFateNumber`.

- [ ] **Step 1: Write the failing tests** в `numerology.test.ts`, `describe("Pythagoras square")`:
  - 1987-05-14 → `working` `[35, 8, 33, 6]`; `counts.slice(1)` `[2, 0, 3, 1, 2, 1, 1, 2, 1]`; линия `celeustremlennost` = 4 (1+4+7: 2+1+1), `temperament` = 6 (3+5+7: 3+2+1).
  - 1990-03-07 → `working` `[29, 11, 15, 6]` (удваивается 7).
  - 2000-01-09 → `working` `[12, 3, 6, 6]` (12 − 18 → модуль 6).
  - `""`, `"2027-01-01"`, `"1991-02-29"` → `null`.
  - `SQUARE_LINES` — 8 записей, все `id` разные, каждая ячейка 1–9 встречается ровно в двух строках-столбцах (строки + столбцы), 5 — ещё в обеих диагоналях.
- [ ] **Step 2: Run** `pnpm vitest run packages/core/src/numerology.test.ts` — Expected: FAIL, `calculatePythagorasSquare is not a function`.
- [ ] **Step 3: Implement** в `numerology.ts`: цифры ДДММГГГГ из разобранной даты; первое — сумма цифр; второе — `digitSum` первого; третье — `Math.abs(first - 2 * firstNonZeroDigitOfDay)`; четвёртое — `digitSum` третьего; счёт ненулевых цифр даты и всех четырёх чисел.
- [ ] **Step 4: Run** тот же тест — Expected: PASS; затем `pnpm vitest run packages/core` — PASS.
- [ ] **Step 5: Commit** `feat(core): Pythagoras square calculation`.

### Task 2: Вид страницы `square` в контенте

**Files:**
- Modify: `packages/content/src/numerology-manifest.ts`, `packages/content/src/numerology.ts`
- Test: `packages/content/src/numerology.test.ts`

**Interfaces:**
- Consumes: `SQUARE_LINES` (задача 1).
- Produces:
  - `NumerologyKind` += `"square"`; ключи `"1"`…`"9"` и `"linii"`.
  - `NUMEROLOGY_PAGES` += ячейки 1–5 партия 6, ячейки 6–9 и `linii` партия 7.
  - `squareSectionTitles(key: string): readonly string[]` — для ячейки d: `["Что значит ячейка", "Пустая ячейка", d, dd, ddd, dddd, "ddddd и больше", "Вопрос для себя", "Частые вопросы"]`; для `linii`: `["Что такое линии", ...8 названий линий из спеки по порядку SQUARE_LINES, "Частые вопросы"]`.
  - Минимальный объём: ячейка 4 500, `linii` 5 000 (`NUMEROLOGY_MIN_BODY.square = 4500`, исключение для `linii` — в парсере).
  - `KEY` допускает `linii`.

- [ ] **Step 1: Write the failing tests:** манифест содержит 10 страниц `square` (9 ячеек + `linii`) с партиями 6/7; парсер принимает фикстуру ячейки 4 с разделами `«4»…«44444 и больше»` и отвергает фикстуру с разделом «1» на странице 4; парсер принимает фикстуру `linii` ≥ 5 000 знаков и отвергает 4 600; ни одна страница `square` не публикуется, пока партии 6/7 не приняты.
- [ ] **Step 2: Run** `pnpm vitest run packages/content/src/numerology.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement**: `expected` в `parseNumerologyPage` — `kind === "square" ? squareSectionTitles(key) : NUMEROLOGY_SECTION_TITLES[kind]` (тип `NUMEROLOGY_SECTION_TITLES` — `Record<Exclude<NumerologyKind, "square">, …>`); экспорт `squareSectionTitles` из `@oracle/content/numerology`.
- [ ] **Step 4: Run** `pnpm vitest run packages/content` и `pnpm typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(content): square page kind for numerology`.

### Task 3: Якоря разделов в `NumerologyPageView`

**Files:**
- Modify: `apps/web/src/components/numerology/NumerologyPageView.tsx`
- Test: `apps/web/src/components/numerology/NumerologyPageView.test.tsx` (новый)

**Interfaces:**
- Produces: проп `anchors?: Readonly<Record<string, string>>` — заголовок раздела → `id` его `<section>`. Без пропа разметка прежняя.

- [ ] **Step 1: Write the failing test:** с `anchors={{ "44": "44" }}` у раздела «44» `id="44"`; без пропа ни у одного `<section>` нет `id`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** — `id={anchors?.[section.title]}`.
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src/components/numerology apps/web/src/app/numerologiya` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): section anchors in numerology pages`.

### Task 4: Адреса, названия и цели

**Files:**
- Create: `apps/web/src/lib/pythagoras.ts`, `apps/web/src/lib/pythagoras.test.ts`
- Modify: `apps/web/src/lib/analytics.ts`, `apps/web/src/lib/analytics.test.ts`, `apps/web/src/lib/numerology.ts` (тип цели в `reachNumerologyGoal`)

**Interfaces:**
- Consumes: `calculatePythagorasSquare`, `SQUARE_LINES`, `SquareLineId` (1); `acceptedNumerologyPages` (2).
- Produces:
  - `PYTHAGORAS_PATH = "/numerologiya/kvadrat-pifagora"`, `squareCellPath(cell: number): string`, `SQUARE_LINES_PATH = PYTHAGORAS_PATH + "/linii"`, `acceptedSquarePaths(): string[]`.
  - `SQUARE_CELL_NAMES: Readonly<Record<number, string>>` и `SQUARE_LINE_NAMES: Readonly<Record<SquareLineId, string>>` — дословно из спеки.
  - `squareVariant(cell: number, count: number): { title: string; anchor: string }` — 0 → `{ "Пустая ячейка", "pusto" }`, 1–4 → цифра n раз, ≥ 5 → `{ "ddddd и больше", "ddddd" }`.
  - `type SquareOutcome = { ok: true; iso: string; square: PythagorasSquare } | { ok: false; error: string }`, `squareOutcome(iso: string, today: Date): SquareOutcome` (ошибка — `DATE_ERROR`).
  - `SQUARE_FAQ` — 5–6 вопросов, среди них «Как рассчитать квадрат Пифагора по дате рождения?» с примером 14.05.1987 и числами 35, 8, 33, 6, и «Почему у других калькуляторов другой квадрат?» (про «+19» и раскладку).
  - `GOALS` += `"pythagoras_calculated"`, `"pythagoras_to_matrix"`; `reachNumerologyGoal` принимает и `pythagoras_*`.

- [ ] **Step 1: Write the failing tests:** адреса; `squareVariant(4, 0/1/3/5/7)`; `squareOutcome` для 1987-05-14 и `""`; названия ячеек 4 и 8 — «Выносливость», «Ответственность»; FAQ — вопросы уникальны, ответы без «карм» и «болезн»; `GOALS` содержит обе цели.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/pythagoras.test.ts apps/web/src/lib/analytics.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** тот же набор и `pnpm typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): Pythagoras square paths, names and goals`.

### Task 5: Калькулятор `/numerologiya/kvadrat-pifagora`

**Files:**
- Create: `apps/web/src/components/numerology/PythagorasCalculator.tsx`, `PythagorasResult.tsx`, `PythagorasResult.test.tsx`; `apps/web/src/app/numerologiya/kvadrat-pifagora/page.tsx`, `page.test.tsx`, `page.accepted.test.tsx`
- Modify: `apps/web/src/app/numerologiya/numerology.css` (только новые классы `numerology-square*`)

**Interfaces:**
- Consumes: всё из задачи 4; `numerologyText`, `acceptedNumerologyPages` (2); `prepareMatrixHandoff`, `sessionStore` (как в `FateResult`).
- Produces: `type SquareSummaries = { cells: Readonly<Record<number, Readonly<Record<string /* anchor */, string>>>>; lines: Readonly<Record<SquareLineId, string>> }` — первые абзацы разделов принятых текстов; страница собирает их на сервере и передаёт пропом.

- [ ] **Step 1: Write the failing tests:**
  - `PythagorasResult` для 1987-05-14: рабочие числа «35, 8, 33, 6» и строка с цифрами; `<table>` с `<caption>`; ячейка 2 — «—» и (при тексте) ссылка на `/numerologiya/kvadrat-pifagora/2#pusto`; ячейка 3 — «333»; 8 линий с количеством; при пустых `summaries` нет ни одной ссылки на страницу ячейки и есть «Описание появится позже.»; 1911-11-11 (девять единиц: `working` `[16, 7, 14, 5]`) — ссылка на `/numerologiya/kvadrat-pifagora/1#11111`.
  - Страница: title начинается с «Квадрат Пифагора по дате рождения», длина с « — Твой оракул» ≤ 60, description 90–175, canonical; JSON-LD `WebApplication`, `FAQPage`, `BreadcrumbList`; один `<h1>`; поле «Дата рождения», кнопка «Построить квадрат»; ссылки на `/numerologiya` и `/numerologiya/chislo-sudby/…` не на 404.
  - `page.accepted.test.tsx` (мок партий `[1…7]`): каталог ссылается на 9 ячеек и на `/linii`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** по образцу `FateCalculator`/`FateResult`: пустая дата → `DATE_ERROR`, фокус в поле, без цели; успех → цель `pythagoras_calculated`; кнопка «Посчитать матрицу по этой дате» → `prepareMatrixHandoff` и `pythagoras_to_matrix`; ссылка на число судьбы — `fatePath(calculateFateNumber(iso).value)` только если эта страница принята.
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src/components/numerology apps/web/src/app/numerologiya` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): Pythagoras square calculator`.

### Task 6: Страницы ячеек и линий

**Files:**
- Create: `apps/web/src/app/numerologiya/kvadrat-pifagora/[cell]/page.tsx`, `page.test.tsx`, `page.accepted.test.tsx`

**Interfaces:**
- Consumes: задачи 2–4.
- Produces: маршрут `[cell]` с ключами `1`…`9` и `linii`, `dynamicParams = false`.

- [ ] **Step 1: Write the failing tests:**
  - Без принятых партий: `generateStaticParams()` пуст, `1`, `linii`, `0`, `10`, `01` → 404, `generateMetadata` → `{}`.
  - С моком `[6, 7]`: 10 адресов; у `4` canonical `/numerologiya/kvadrat-pifagora/4`, JSON-LD `Article`, `FAQPage`, `BreadcrumbList` [«Нумерология», «Квадрат Пифагора», «Ячейка 4»]; разделы с `id` `pusto`, `4`, `44`, `444`, `4444`, `44444`; ссылки на калькулятор, `/linii` и соседние ячейки; у `linii` разделы с `id` из `SquareLineId`; описания всех 10 страниц разные; один `<h1>`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** по образцу `chislo-sudby/[n]/page.tsx`: `NumerologyPageView` с `anchors` (варианты — из `squareVariant`, линии — `SQUARE_LINE_NAMES` → `id`), `emblem` — цифра ячейки или «3×3» у линий, `siblings` — остальные принятые ячейки и линии.
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src/app/numerologiya` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): Pythagoras square cell and line pages`.

### Task 7: Подключение к сайту

**Files:**
- Modify: `apps/web/src/lib/seo.ts`, `apps/web/src/app/sitemap.ts`, `apps/web/src/app/numerologiya/page.tsx` (+ его тест), `AGENTS.md` (строка «Нумерология»)

- [ ] **Step 1: Write the failing tests:** `PUBLIC_PATHS` содержит `PYTHAGORAS_PATH` и все `acceptedSquarePaths()`; на `/numerologiya` есть ссылка на `PYTHAGORAS_PATH`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement**: `PUBLIC_PATHS` += `PYTHAGORAS_PATH, ...acceptedSquarePaths()`; `PRACTICE_PATHS` в sitemap += `PYTHAGORAS_PATH`; ссылка «Квадрат Пифагора по дате рождения» в блоке ссылок `/numerologiya`; в `AGENTS.md` — адреса и файлы квадрата.
- [ ] **Step 4: Run** `pnpm vitest run && pnpm typecheck`, сборка `NEXT_PUBLIC_SITE_URL=https://tvoy-orakul.ru pnpm --filter @oracle/web exec next build` — Expected: PASS. В браузере на 375 px (временно приняв 6 и 7, без коммита): 14.05.1987, пустая дата, 01.01.2000, страница ячейки 4 и `/linii`; нет горизонтальной прокрутки и элементов < 44 px.
- [ ] **Step 5: Commit** `feat(web): link Pythagoras square into the site`.

### Task 8: Тексты (партии 6 и 7)

**Files:**
- Create: `packages/content/numerology/square-{1..9}.md`, `square-linii.md`; `packages/content/src/generated/numerology.json` (сборкой)
- Modify: `docs/superpowers/specs/2026-11-08-pythagoras-square-design.md` (частотность)

- [ ] **Step 1: Вордстат.** Сверить «квадрат пифагора», «психоматрица», «квадрат пифагора расшифровка», «111 в квадрате пифагора», записать в раздел «Зачем» спеки. Если на всю тему < 10 тыс. в месяц — остановиться и спросить владелицу. Если Вордстат всё ещё не работает — сказать владелице и спросить, писать ли тексты без цифр.
- [ ] **Step 2: Партия 6** — ячейки 1–5. В первом абзаце — традиционное имя ячейки; у каждого варианта пример даты, проверенный `calculatePythagorasSquare` (одноразовый скрипт в scratchpad); ячейка 4 — без суждений о здоровье. `pnpm content:build`, `pnpm vitest run packages/content` — PASS. Commit `content(numerology): batch 6 — Pythagoras square cells 1–5`. Приёмка владелицей → отдельный commit с `6` в `NUMEROLOGY_ACCEPTED_BATCHES`.
- [ ] **Step 3: Партия 7** — ячейки 6–9 и `linii`, так же. Commit `content(numerology): batch 7 — cells 6–9 and lines`, приёмка → commit с `7`.
- [ ] **Step 4:** `pnpm vitest run && pnpm typecheck`, push, PR «Нумерология: квадрат Пифагора»; мерж — по «да» владелицы.
