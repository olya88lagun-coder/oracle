# Совместимость по квадрату Пифагора — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** бесплатный калькулятор `/numerologiya/kvadrat-pifagora/sovmestimost`: две даты → общий квадрат пары, тексты пары по ячейкам и линиям.

**Architecture:** ядро не меняется (`calculatePythagorasSquare` дважды). Сравнение — чистые функции в `apps/web/src/lib/pythagoras-compat.ts`. Тексты — новый вид нумерологии `pair` (файл `packages/content/numerology/pair-sovmestimost.md`, партия 8), открывается через `NUMEROLOGY_ACCEPTED_BATCHES`. Страница — статичная папка рядом с `[cell]`, клиентский калькулятор получает с сервера только 43 коротких текста пары.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Vitest + Testing Library, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-09-pythagoras-compat-design.md`. Визуал потом доводит Codex: `docs/design/codex-brief-pythagoras-compat.md` (тексты и роли, перечисленные там в «Должно остаться на месте», в разметке должны совпасть дословно).

**Старт:** ветка `feat/pythagoras-compat` перебазируется на свежий `master` после мержа PR #200 (`git fetch && git rebase origin/master`).

## Global Constraints

- Даты обоих не попадают в адрес, `localStorage`/`sessionStorage`, цели Метрики и запросы к серверу.
- Ни процентов, ни вердиктов «подходите / не подходите»; тексты — «вы», символическая практика, без стоп-слов `packages/content/src/check.ts` («карм», «долг», здоровье).
- 375 px без горизонтальной прокрутки, текст ≥ 14 px, зоны нажатия ≥ 44 px, один `<h1>`, ошибки `role="alert"`, контраст AA, без внешних ресурсов.
- Дословные тексты: `<h1>` «Совместимость по квадрату Пифагора»; поля «Ваша дата рождения», «Дата рождения партнёра»; кнопка «Сравнить квадраты»; «Бесплатно, без регистрации. Даты остаются в браузере.»; заголовки «Ваши квадраты Пифагора», «Где вы похожи», «Где различаетесь», «Линии пары»; подписи «Вы», «Партнёр», «похоже», «по-разному», «у обоих пусто», «мало», «средне», «много»; ссылка на страницу с других мест — «Сравнить с квадратом партнёра».
- Отношение ячейки: `empty` (a = 0 и b = 0), `close` (a > 0, b > 0, |a − b| ≤ 1), `apart` (иначе). Уровень линии: `low` 0–2, `mid` 3–5, `high` ≥ 6; отношение линии `same`/`differ`.
- Цель Метрики `pythagoras_compat_calculated`, без параметров, через `reachNumerologyGoal`.
- Страница и ссылки на неё существуют только при принятой партии 8; до этого `/numerologiya/kvadrat-pifagora/sovmestimost` — 404 и нет в sitemap.
- Коммиты — conventional commits на английском, с `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Одинаковые даты у обоих** — все ячейки `close` или `empty`, блок «Где различаетесь» заменён строкой «Во всех ячейках у вас похожая картина.»; тест в Task 3/4.
2. **Ошибка только во второй дате** (будущая дата, пусто) — ошибка у поля партнёра, фокус туда, первая дата не сбрасывается; тест в Task 4.
3. **Повторный расчёт** — новая пара заменяет результат, цель ставится на каждый успешный расчёт ровно один раз; тест в Task 4.
4. **Ячейка с пятью и больше цифрами** — ссылка ведёт на якорь последнего варианта (`squareVariant`), строки цифр не обрезаются; тест в Task 4.
5. **Непринятая партия** — страница 404, ссылки «Сравнить с квадратом партнёра» на соседних страницах не выводятся; тест в Task 5/6.

---

### Task 1: Вид текстов `pair` в контенте

**Files:**
- Modify: `packages/content/src/numerology-manifest.ts` (тип `NumerologyKind`, запись в `NUMEROLOGY_PAGES`)
- Modify: `packages/content/src/numerology.ts` (`KINDS`, `KEY`, разделы и минимальный объём для `pair`)
- Modify: `packages/content/src/numerology-texts.ts` (экспорт новых констант)
- Test: `packages/content/src/numerology.test.ts`

**Interfaces:**
- Produces: `NumerologyKind` включает `"pair"`; страница `{ kind: "pair", key: "sovmestimost", batch: 8 }`; `PAIR_RELATION_TITLES = { empty: "у обоих пусто", close: "похоже", apart: "по-разному" }`; `PAIR_LINE_TITLES = { same: "один уровень", differ: "разный уровень" }`; `pairSectionTitles(): readonly string[]`; `pairCellSection(cell: number, relation: "empty" | "close" | "apart"): string` → `"1 · похоже"`; `pairLineSection(id: SquareLineId, relation: "same" | "differ"): string` → `"Темперамент · один уровень"`. Все — из `@oracle/content/numerology`.

- [ ] **Step 1: Failing tests** в `numerology.test.ts`:
  - `pairSectionTitles()` начинается с `["Как считается совместимость по квадрату", "Как читать сравнение"]`, затем 27 разделов ячеек (для 1…9 по порядку `у обоих пусто`, `похоже`, `по-разному`), затем 16 разделов линий в порядке `SQUARE_LINES` (`один уровень`, `разный уровень`), последний — `"Частые вопросы"`; длина 46.
  - `pairCellSection(4, "apart") === "4 · по-разному"`, `pairLineSection("temperament", "same") === "Темперамент · один уровень"`.
  - `parseNumerologyPage` принимает собранный в тесте `pair`-файл (`kind: pair`, `key: sovmestimost`, все разделы, объём ≥ 18 000) и отклоняет файл с пропущенным разделом и файл короче 18 000 знаков.
  - `NUMEROLOGY_PAGES` содержит `{ kind: "pair", key: "sovmestimost", batch: 8 }`; 8 нет в `NUMEROLOGY_ACCEPTED_BATCHES`.
- [ ] **Step 2:** `pnpm --filter @oracle/content test numerology` — FAIL.
- [ ] **Step 3:** реализовать: `KEY` пропускает `sovmestimost`; `NUMEROLOGY_MIN_BODY.pair = 18000`; в `parseNumerologyPage` разделы `pair` берутся из `pairSectionTitles()`. Сообщение `kind` — «kind — fate, year, clock, square или pair».
- [ ] **Step 4:** тест — PASS; `pnpm typecheck` — PASS (в `apps/web` всё, что перебирает `NumerologyKind` через `Record`, получает `pair`).
- [ ] **Step 5:** commit `feat(content): numerology pair texts kind for Pythagoras compatibility`.

### Task 2: Тексты партии 8

**Files:**
- Create: `packages/content/numerology/pair-sovmestimost.md`
- Modify: `packages/content/src/generated/numerology.json` (через `pnpm content:build`)

Шапка: `kind: pair`, `key: sovmestimost`, `title: Совместимость по квадрату Пифагора`, `description` 90–175 знаков, `batch: 8`. Разделы — ровно `pairSectionTitles()`. Объёмы из спеки: два вводных вместе ≥ 2 000, ячейки 400–700, линии 300–600, FAQ 5–6 вопросов (в т. ч. «Почему нет процента совместимости?», «Что если квадраты совсем разные?», «Можно ли сравнить квадрат с ребёнком, другом или коллегой?»). Первый абзац раздела — самостоятельный (его показывает калькулятор). «По-разному» — симметрично («у одного из вас… у другого…»). Пример пары в «Как считается» — даты, проверенные расчётом (взять пару из Task 3).

- [ ] **Step 1:** написать файл, правила тона — `docs/oracle-article-writer.md`.
- [ ] **Step 2:** `pnpm content:build` — без ошибок формата.
- [ ] **Step 3:** `pnpm --filter @oracle/content test` — PASS (стоп-слова через `findStopPhrases` проверяют и `pair`; если общий тест перебирает только принятые — добавить `pair-sovmestimost` в проверку стоп-слов явно).
- [ ] **Step 4:** commit `content(numerology): batch 8 — Pythagoras square compatibility`. Партия не принимается в этом коммите; приёмка — отдельным коммитом `content(numerology): accept batch 8` после «принято» владелицы.

### Task 3: Сравнение двух квадратов

**Files:**
- Create: `apps/web/src/lib/pythagoras-compat.ts`
- Test: `apps/web/src/lib/pythagoras-compat.test.ts`

**Interfaces:**
- Consumes: `calculatePythagorasSquare`, `SQUARE_LINES`, `PythagorasSquare`, `SquareLineId` из `@oracle/core`; `DATE_ERROR` из `./matrix-save`; `PYTHAGORAS_PATH` из `./pythagoras`.
- Produces:
  - `PYTHAGORAS_COMPAT_PATH = "/numerologiya/kvadrat-pifagora/sovmestimost"`
  - `type CellRelation = "empty" | "close" | "apart"`, `cellRelation(a: number, b: number): CellRelation`
  - `type LineLevel = "low" | "mid" | "high"`, `lineLevel(count: number): LineLevel`, `LINE_LEVEL_NAMES: Record<LineLevel, string>` (`мало`, `средне`, `много`)
  - `type PairCell = { cell: number; you: number; partner: number; relation: CellRelation }`
  - `type PairLine = { id: SquareLineId; you: number; partner: number; youLevel: LineLevel; partnerLevel: LineLevel; relation: "same" | "differ" }`
  - `type PairComparison = { you: PythagorasSquare; partner: PythagorasSquare; cells: PairCell[]; lines: PairLine[] }` — `cells` по 1…9, `lines` — «Темперамент» первым, дальше порядок `SQUARE_LINES`
  - `type PairOutcome = { ok: true; key: string; youIso: string; partnerIso: string; pair: PairComparison } | { ok: false; field: "you" | "partner"; error: string }`
  - `pairOutcome(youIso: string, partnerIso: string, today: Date): PairOutcome` — первая неверная дата даёт ошибку своего поля.
  - `PAIR_FIXTURES` — экспорт в `apps/web/src/app/numerologiya/kvadrat-pifagora/sovmestimost/pair-fixtures.ts` (пары дат для тестов и для Codex: `allRelations`, `emptyBoth`, `fiveDigits`, `same`).

- [ ] **Step 1: Failing tests:**
  - `cellRelation(0,0)="empty"`, `(1,2)="close"`, `(3,3)="close"`, `(0,1)="apart"`, `(1,3)="apart"`.
  - `lineLevel`: 0→low, 2→low, 3→mid, 5→mid, 6→high, 9→high.
  - `pairOutcome("1987-05-14","1976-03-07", today)` — `ok`, `you.working` = `[35, 8, 33, 6]`, у партнёра линия `semya` = 0 (`low`), `lines[0].id === "temperament"`.
  - фикстуры: на `allRelations` встречаются все три отношения ячеек и оба отношения линий; на `emptyBoth` есть ячейка `empty`; на `fiveDigits` у кого-то ячейка ≥ 5; на `same` (одна дата дважды) нет `apart` и нет `differ`. Даты подобрать перебором в тесте или вручную и закрепить.
  - `pairOutcome("", "1990-01-01", today)` → `{ ok: false, field: "you" }`; `pairOutcome("1990-01-01", "2999-01-01", today)` → `field: "partner"`, `error === DATE_ERROR`.
- [ ] **Step 2:** `pnpm --filter web test pythagoras-compat` — FAIL.
- [ ] **Step 3:** реализовать; `key` — `${youIso}|${partnerIso}` (только для React `key`, никуда не уходит).
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(web): compare two Pythagoras squares`.

### Task 4: Калькулятор и результат пары

**Files:**
- Create: `apps/web/src/components/numerology/PythagorasCompatCalculator.tsx`, `PythagorasCompatResult.tsx`
- Modify: `apps/web/src/lib/analytics.ts` (`GOALS` += `"pythagoras_compat_calculated"`)
- Test: `apps/web/src/components/numerology/PythagorasCompatResult.test.tsx`, `PythagorasCompatCalculator.test.tsx`

**Interfaces:**
- Consumes: Task 3; `SQUARE_CELL_NAMES`, `SQUARE_LINE_NAMES`, `squareCellPath`, `squareVariant`, `SQUARE_LINES_PATH` из `@/lib/pythagoras`; `reachNumerologyGoal`; `COMPAT_PATH` из `@/lib/compat`.
- Produces: `type PairTexts = { cells: Record<number, Partial<Record<CellRelation, string>>>; lines: Partial<Record<SquareLineId, Partial<Record<"same" | "differ", string>>>> }` (экспорт из `PythagorasCompatResult.tsx`); `<PythagorasCompatCalculator texts={PairTexts} />` — рисует первый экран с `<h1>` и результат.

Разметка (классы `numerology-pair*`, остальное — в рамках стилей раздела; Codex доводит визуал):
- форма: два `input type="date"` (`min="1900-01-01"`), подписи из Global Constraints, кнопка «Сравнить квадраты», строка приватности; ошибка — `<p role="alert">` под своим полем, `aria-invalid` и `aria-describedby` у поля, фокус в поле;
- результат: `<section aria-labelledby>` с `<h2 tabIndex={-1}>` «Ваши квадраты Пифагора» (фокус после расчёта); `<table>` с `<caption>` «Общий квадрат пары: цифры по ячейкам», раскладка `[[1,4,7],[2,5,8],[3,6,9]]`, в ячейке «N · название», «Вы: 111», «Партнёр: —», подпись отношения; легенда над таблицей; `<details><summary>Как посчитано</summary>` с рабочими числами двоих (формат строк — как в `PythagorasResult`, вынести общий кусок в маленький компонент `SquareWorking` в том же каталоге, если копия больше 5 строк);
- «Где вы похожи» / «Где различаетесь»: по ячейке — название, «у вас 11, у партнёра 1», текст пары (нет текста — «Описание появится позже.»), ссылки «Ваш вариант: 11» и «Вариант партнёра: 1» на `squareCellPath(cell)#anchor` (пустая — «пустая ячейка»); пустой блок заменяется строкой «Во всех ячейках у вас похожая картина.» или «Во всех ячейках у вас заметные различия.»;
- «Линии пары»: строка «у вас 4 (средне), у партнёра 7 (много)», текст пары, ссылка «Подробнее о линии» на `SQUARE_LINES_PATH#id`;
- ссылки дальше: «Квадрат Пифагора по одной дате» (`PYTHAGORAS_PATH`) и «Совместимость по матрице судьбы» (`COMPAT_PATH`).

- [ ] **Step 1: Failing tests** (`PythagorasCompatResult.test.tsx`, `PythagorasCompatCalculator.test.tsx`):
  - на фикстуре `allRelations` есть таблица с подписью, 9 ячеек, в каждой «Вы:» и «Партнёр:»; есть заголовки «Где вы похожи», «Где различаетесь», «Линии пары»; первая строка линий — «Темперамент»;
  - ссылка «Вариант партнёра: …» у ячейки с пятью и больше цифрами (`fiveDigits`) ведёт на якорь `squareVariant(cell, 5).anchor`;
  - на `same` нет заголовка «Где различаетесь», есть строка «Во всех ячейках у вас похожая картина.»;
  - калькулятор: ввод двух дат и «Сравнить квадраты» → заголовок «Ваши квадраты Пифагора» в фокусе, `reachGoal` вызван один раз с `"pythagoras_compat_calculated"` (мок `@/lib/numerology` как в `FateResult.test.tsx`); второй расчёт — ещё один вызов, результат новый;
  - будущая дата партнёра → `role="alert"` у поля партнёра, фокус в нём, значение первой даты сохранено;
  - приватность: после расчёта `window.location.href` не изменился, `localStorage.length` и `sessionStorage.length` равны 0, `fetch` (шпион) не вызывался.
- [ ] **Step 2:** `pnpm --filter web test PythagorasCompat` — FAIL.
- [ ] **Step 3:** реализовать компоненты и цель.
- [ ] **Step 4:** PASS; `pnpm --filter web test analytics` — PASS.
- [ ] **Step 5:** commit `feat(web): Pythagoras square compatibility calculator`.

### Task 5: Страница, метаданные, карта сайта

**Files:**
- Create: `apps/web/src/app/numerologiya/kvadrat-pifagora/sovmestimost/page.tsx`, `page.test.tsx`, `page.accepted.test.tsx`
- Modify: `apps/web/src/app/numerologiya/kvadrat-pifagora/square-fixtures.ts` (фикстура `pair` в `mockSquareAccepted` или отдельный `mockPairAccepted`)
- Modify: `apps/web/src/lib/pythagoras.ts` (`acceptedPairPaths(): string[]` — `[PYTHAGORAS_COMPAT_PATH]`, если `acceptedNumerologyPages("pair")` не пуст), `apps/web/src/lib/seo.ts` (`PUBLIC_PATHS` += `...acceptedPairPaths()`)

Страница (серверная): при непринятой партии — `notFound()` и `generateMetadata` возвращает `{}`; иначе `publicMetadata({ title: "Совместимость по квадрату Пифагора онлайн", description: <description из текста>, path })`; JSON-LD `@graph`: WebApplication (name «Совместимость по квадрату Пифагора», `offers` 0 RUB), FAQPage из `text.faq`, BreadcrumbList (Нумерология → Квадрат Пифагора → Совместимость); хлебные крошки как в `NumerologyPageView`; `PythagorasCompatCalculator` с `PairTexts` — первый абзац каждого раздела `pairCellSection`/`pairLineSection`; ниже разделы «Как считается совместимость по квадрату», «Как читать сравнение» (все абзацы) и FAQ (`details`, как на калькуляторе квадрата); дисклеймер как на `kvadrat-pifagora/page.tsx`. Подключить `year.css` и `numerology.css`.

- [ ] **Step 1: Failing tests:**
  - `page.test.tsx` (настоящие данные, партия 8 не принята): вызов страницы бросает `notFound`; `PUBLIC_PATHS` не содержит `PYTHAGORAS_COMPAT_PATH`.
  - `page.accepted.test.tsx` (мок принятой партии): ровно один `<h1>` «Совместимость по квадрату Пифагора»; JSON-LD содержит `FAQPage` и `BreadcrumbList` из трёх пунктов; есть заголовки «Как считается совместимость по квадрату» и «Частые вопросы»; `generateMetadata`/`metadata` title — «Совместимость по квадрату Пифагора онлайн»; `PUBLIC_PATHS` (при моке) содержит путь.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** реализовать.
- [ ] **Step 4:** PASS; `pnpm --filter web test sitemap seo` — PASS.
- [ ] **Step 5:** commit `feat(web): Pythagoras compatibility page`.

### Task 6: Ссылки на страницу

**Files:**
- Modify: `apps/web/src/components/numerology/PythagorasResult.tsx` (проп `pairOpen: boolean`; при `true` — ссылка «Сравнить с квадратом партнёра» в блоке `year-action`)
- Modify: `apps/web/src/app/numerologiya/kvadrat-pifagora/page.tsx` (передаёт `pairOpen`; та же ссылка в нижнем текстовом блоке страницы)
- Modify: `apps/web/src/app/numerologiya/kvadrat-pifagora/[cell]/page.tsx` (при принятой партии — ссылка в конце страницы через существующий проп/слот `NumerologyPageView`; если слота нет — добавить проп `extraLinks?: { name: string; href: string }[]`)
- Modify: `apps/web/src/app/numerologiya/page.tsx` (`touch-link` «Совместимость по квадрату Пифагора» рядом с «Квадрат Пифагора по дате рождения»)
- Modify: `apps/web/src/app/sovmestimost/page.tsx` (в `compat-help-links` третья ссылка «Совместимость по квадрату Пифагора»; дословные тексты страницы не менять)
- Test: соответствующие `*.test.tsx` рядом

- [ ] **Step 1: Failing tests:** при моке принятой партии ссылка с `href={PYTHAGORAS_COMPAT_PATH}` есть в результате квадрата, на странице ячейки `1`, на `linii`, на хабе и на `/sovmestimost`; при настоящих данных (партия не принята) её нет нигде.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** реализовать; все проверки «открыта ли» — через `acceptedPairPaths().length > 0`.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** commit `feat(web): link Pythagoras compatibility from numerology and compat pages`.

### Task 7: Проверка и PR

- [ ] **Step 1:** `pnpm typecheck` — 0 ошибок; `pnpm test` — всё зелёное.
- [ ] **Step 2:** `pnpm --filter web build` — успех; в выводе нет маршрута `/numerologiya/kvadrat-pifagora/sovmestimost` (партия не принята).
- [ ] **Step 3:** локально с временно принятой партией 8 (не коммитить): `pnpm dev:web`, проверить в браузере на 375 и 1440 px пары из `PAIR_FIXTURES` — нет горизонтальной прокрутки, фокус, `role="alert"`, адрес не меняется, во вкладке «Сеть» нет запросов с датами. Вернуть `NUMEROLOGY_ACCEPTED_BATCHES`.
- [ ] **Step 4:** push `feat/pythagoras-compat`, PR в `master`: «feat(web): numerology — Pythagoras square compatibility», в описании — что партия 8 ждёт вычитки, ссылка на ТЗ Codex, чек-лист проверки. Мерж — только владелица.
