# «Живая матрица» на первом экране — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** на первом экране `/matrica-sudby` показать живую диаграмму матрицы: пример на вымышленной дате, пересчёт чисел «прокруткой» при вводе настоящей даты, вспышка трёх ключевых точек, блик по линиям, лёгкий наклон за курсором.

**Architecture:** вся логика и разметка — Claude: чистые функции в `apps/web/src/lib/matrix-hero.ts` и клиентский компонент `MatrixHeroLive` с фиксированным набором классов и `data-*` («крючков») для оформления. Весь внешний вид — Codex по ТЗ `docs/design/codex-brief-matrix-live-hero.md`, правки только в конце `globals.css`. Claude оставляет рабочий минимальный каркас стилей, Codex его заменяет.

**Tech Stack:** Next.js 16 (App Router, клиентский компонент), React, SVG, vitest, Playwright; `calculateMatrix`/`parseBirthDate` из `@oracle/core`, данные диаграммы из `apps/web/src/lib/matrix-view.ts`.

**Spec:** `docs/superpowers/specs/2026-11-17-matrix-live-hero-design.md`

## Global Constraints

- Дата рождения и числа не уходят на сервер и не логируются; новых целей Метрики нет.
- Новых зависимостей, внешних скриптов, шрифтов и CDN нет.
- Цвета в стилях — только переменные `:root` из `globals.css`; новые — там же.
- Любое движение — только внутри `@media (prefers-reduced-motion: no-preference)`; при «меньше движения» диаграмма статична и числа меняются сразу.
- Запрещено `docs/design/visual-direction.md`: блёстки, мерцание, неон, «магические» шрифты.
- Диаграмма первого экрана `aria-hidden="true"`; один `<h1>` на странице; метаданные страницы и `MatrixResult` без изменений.
- 375 px без горизонтальной прокрутки, текст не мельче 14 px, контраст AA; на 390×740 кнопка «Рассчитать матрицу» выше cookie-панели при первом визите.
- Вымышленная дата примера: `1988-09-14`. Подписи: «Пример · вымышленная дата», «Ваша матрица · 7 марта 1990» (формат даты — `formatBirthDateRu`).
- Коммиты — conventional commits на английском.

## Review Focus

- Дата введена, потом стёрта или стала невозможной (например `1850-01-01`): диаграмма остаётся на последнем корректном состоянии, не падает и не показывает пустые узлы.
- Дата из портрета, браузера или `takeMatrixHandoff` приходит в `value` при загрузке: диаграмма сразу на ней, без «прокрутки» от примера.
- Быстрая смена даты (две подряд): незавершённая «прокрутка» отменяется, конечные числа равны `calculateMatrix` новой даты.
- Размонтирование во время «прокрутки»: нет обновления состояния после размонтирования и висящих таймеров.
- Вкладка скрыта или диаграмма вне экрана: цикл `requestAnimationFrame` не работает, числа всё равно сходятся к верным при возвращении.
- Дата до 1900 или в будущем: те же правила, что у `parseBirthDate`, поле ошибки не меняется.

---

### Task 1: Чистая логика `matrix-hero.ts`

**Files:**
- Create: `apps/web/src/lib/matrix-hero.ts`
- Test: `apps/web/src/lib/matrix-hero.test.ts`

**Interfaces:**
- Consumes: `parseBirthDate(value: unknown, today: Date): BirthDate | null`, `calculateMatrix(birth: BirthDate): Matrix`, `formatBirthDateRu(birth: BirthDate): string`, `Matrix`, `MatrixPoint`, `MATRIX_POINTS` из `@oracle/core`.
- Produces:
  - `export const HERO_EXAMPLE_DATE = "1988-09-14"`
  - `export type HeroState = { kind: "example" | "date"; iso: string; caption: string; matrix: Matrix }`
  - `export function nextHero(value: string, today: Date, previous: HeroState | null): HeroState` — корректная дата → `kind: "date"`; пустая или невозможная → `previous`, а если `previous === null` — пример.
  - `export function rollValue(from: number, to: number, progress: number): number` — «прокрутка» значений арканов 1…22.
  - `export function rollDelay(index: number): number` — задержка узла в мс для эффекта волны.
  - `export const ROLL_MS = 650`

- [ ] **Step 1: Write the failing tests** в `matrix-hero.test.ts`:
  - `rollValue(7, 19, 0) === 7`, `rollValue(7, 19, 1) === 19`, `rollValue(5, 5, 1) === 5`, `rollValue(22, 1, 1) === 1`;
  - для всех `from, to` в 1…22 и прогресса 0, 0.1, …, 1 результат — целое от 1 до 22 (перебор в цикле, одна проверка на пару);
  - `rollValue(7, 19, -0.5) === 7` и `rollValue(7, 19, 2) === 19` (прогресс зажимается);
  - `nextHero("", today, null).kind === "example"` и `.iso === HERO_EXAMPLE_DATE`, подпись равна «Пример · вымышленная дата»;
  - `nextHero("1990-03-07", today, null)`: `kind: "date"`, подпись «Ваша матрица · 7 марта 1990», `matrix` совпадает с `calculateMatrix` той же даты (точки `A`=7, `E`=4, `D`=11);
  - `nextHero("1850-01-01", today, prev) === prev` (та же ссылка) и `nextHero("", today, prev) === prev`;
  - `rollDelay(0) === 0`, `rollDelay` не убывает и `rollDelay(40) <= 400`.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/matrix-hero.test.ts` — ожидается FAIL «module not found».
- [ ] **Step 3: Implement** `matrix-hero.ts`. `rollValue`: прогресс зажать в 0…1, сглаживание `1 - (1 - p)^3`, всего `spin = 22 + ((to - from + 22) % 22)` шагов вперёд по кругу 1…22, значение — `((from - 1 + floor(eased * spin)) % 22) + 1`; при `p = 1` это ровно `to`. `rollDelay(i) = min(i * 12, 336)`. Подпись примера и формат подписи даты — как в Global Constraints.
- [ ] **Step 4: Run** тот же файл — PASS; затем `pnpm --filter @oracle/web typecheck`.
- [ ] **Step 5: Commit** `feat(web): pure logic for the live matrix hero`.

### Task 2: Компонент `MatrixHeroLive` и подключение

**Files:**
- Create: `apps/web/src/components/matrix/MatrixHeroLive.tsx`
- Create: `apps/web/src/components/matrix/MatrixHeroLive.test.tsx`
- Modify: `apps/web/src/components/matrix/MatrixCalculator.tsx` (разметка `matrix-hero__copy`, строки около 180–216: вставить между `{intro}` и `<form>`)
- Modify: `apps/web/src/app/globals.css` (каркас в конце файла)

**Interfaces:**
- Consumes: Task 1 (`nextHero`, `rollValue`, `rollDelay`, `ROLL_MS`, `HeroState`); `DIAGRAM_POINTS`, `DIAGRAM_LINES`, `DIAGRAM_SIZE`, `KEY_POINTS`, `keyArcana` из `@/lib/matrix-view`.
- Produces: `export function MatrixHeroLive({ value }: { value: string }): JSX.Element`. Разметка и классы — как в таблице «Крючки» ТЗ для Codex (`docs/design/codex-brief-matrix-live-hero.md`); имена менять нельзя без правки ТЗ.

- [ ] **Step 1: Write the failing test** `MatrixHeroLive.test.tsx` через `renderToStaticMarkup`: при `value=""` разметка содержит «Пример · вымышленная дата», `aria-hidden="true"` на корне, 28 элементов `data-point`, `data-state="example"`, три `.matrix-live__key` с подписями «Личность», «Центр», «Задача»; при `value="1990-03-07"` — `data-state="date"` и «Ваша матрица · 7 марта 1990».
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/components/matrix/MatrixHeroLive.test.tsx` — FAIL.
- [ ] **Step 3: Implement** компонент (`"use client"`). Состояние: `hero` (через `nextHero` при каждом изменении `value`), `shown: Record<MatrixPoint, number>` (то, что нарисовано сейчас). При первой установке даты (из пустого примера) и при смене даты: если движение разрешено (`matchMedia("(prefers-reduced-motion: no-preference)")`) — один цикл `requestAnimationFrame` длиной `ROLL_MS + rollDelay(maxIndex)`, на каждом кадре `shown[point] = rollValue(from, to, clamp((t - rollDelay(index)) / ROLL_MS))`; новый запуск отменяет прежний (`cancelAnimationFrame`), размонтирование тоже; иначе `shown` ставится сразу. Первая отрисовка с `value`, уже содержащим дату (портрет, handoff), идёт без «прокрутки». Корень `figure.matrix-live` получает `data-state`, `data-phase` (`idle` | `rolling`), `data-visible` (`IntersectionObserver` + `document.visibilityState`), `data-run` (счётчик, +1 при каждой смене даты) и переменные `--tilt-x`, `--tilt-y` (градусы, ±3; только `pointermove` мышью при `(hover: hover) and (pointer: fine)` и «движение разрешено», обновление через `requestAnimationFrame`, сброс в 0 при `pointerleave`). Ключевым точкам при смене даты на 2,4 с добавляется класс `is-flash` (порядок через `--k`, как в `MatrixDiagram`), таймер очищается при размонтировании. Список `ul.matrix-live__keys` — из `keyArcana(hero.matrix)`. Путь блика — `polyline.matrix-live__comet` (`pathLength={1}`) по точкам `A → E → D` из `DIAGRAM_POINTS`, рисуется поверх линий. Числа в узлах — `shown[point]`; в статической разметке — значения `hero.matrix`.
- [ ] **Step 4: Wire** в `MatrixCalculator.tsx`: `<MatrixHeroLive value={value} />` между `{intro}` и `<form>`. Ничего другого в этом файле не менять.
- [ ] **Step 5: Каркас стилей** в конце `globals.css` под комментарием `/* Живая матрица (MatrixHeroLive): каркас, оформление — Codex */`: `.matrix-live` блок по центру шириной `min(100%, 360px)`, `svg` на всю ширину, `aria`-скрытая подпись видна, нет собственного движения. На десктопе (`min-width: 900px`) каркас может не раскладывать в две колонки — это работа Codex. Камень (`.matrix-hero__art img`) не трогать.
- [ ] **Step 6: Run** `pnpm vitest run apps/web/src/components/matrix` и `pnpm --filter @oracle/web typecheck` — PASS.
- [ ] **Step 7: Commit** `feat(web): live matrix on the first screen of the matrix page`.

### Task 3: Сквозные тесты

**Files:**
- Create: `e2e/matrix-hero.spec.ts`
- Modify: `e2e/first-screen.spec.ts` (добавить тест для `/matrica-sudby` рядом с тестом главной)

**Interfaces:**
- Consumes: Task 2 (крючки `.matrix-live`, `[data-point]`, `data-state`); хелперы из `e2e/helpers.ts` и `visibleAboveCookie` из `first-screen.spec.ts`.
- Produces: тесты, на которые Codex ориентируется при оформлении.

- [ ] **Step 1: Write the tests** в `matrix-hero.spec.ts`:
  - «the first screen shows an example diagram before any date is typed»: `/matrica-sudby`, `.matrix-live` виден, `data-state="example"`, текст «Пример · вымышленная дата»;
  - «typing a date turns the diagram into the visitor's matrix»: ввод `1990-03-07` в поле «Дата рождения» (повторять в `toPass`, как в других тестах: до гидратации поле не слушает), `data-state="date"`, подпись «Ваша матрица · 7 марта 1990», в узлах `A`, `E`, `D` после остановки — 7, 4, 11; дата не попала в адрес;
  - «an impossible date leaves the diagram as it was»: после ввода `1850-01-01` диаграмма остаётся в прежнем состоянии;
  - «with reduced motion the diagram changes at once»: `page.emulateMedia({ reducedMotion: "reduce" })`, после ввода даты узлы сразу равны итоговым и `data-phase="idle"`;
  - «there is no horizontal scroll at 375 px»: `scrollWidth <= innerWidth`.
- [ ] **Step 2: Write** в `first-screen.spec.ts` тест «the matrix button on /matrica-sudby is visible above the cookie panel on a short phone»: тот же `SHORT_PHONE` и `visibleAboveCookie`, кнопка «Рассчитать матрицу», внутри `test.describe` с чистым `storageState`.
- [ ] **Step 3: Run** (нужны `dev:db`, `dev:web`, `dev:worker`): `pnpm test:e2e e2e/matrix-hero.spec.ts e2e/first-screen.spec.ts`. Ожидается: функциональные тесты PASS на каркасе; тест «кнопка выше cookie-панели» может падать до оформления Codex — тогда Claude правит каркас (размер диаграммы на телефоне), Codex дорабатывает.
- [ ] **Step 4: Commit** `test(e2e): cover the live matrix hero`.

### Task 4: Оформление — Codex

**Files:**
- Modify: `apps/web/src/app/globals.css` (только раздел «Живая матрица — оформление» в конце файла; каркас Claude заменить)

**Interfaces:**
- Consumes: ТЗ `docs/design/codex-brief-matrix-live-hero.md` целиком и крючки из Task 2.
- Produces: готовый вид; все функциональные тесты из Task 3 остаются зелёными.

- [ ] **Step 1: Передать** Codex текст ТЗ и ссылку на ветку `feat/web-matrix-live-hero` (после Task 3, запушенную).
- [ ] **Step 2: Codex делает** оформление и пушит в ту же ветку коммитом `style(web): finish the live matrix hero`.
- [ ] **Step 3: Run** `pnpm test:e2e e2e/matrix-hero.spec.ts e2e/first-screen.spec.ts` — PASS, в том числе «кнопка выше cookie-панели» на 390×740.

### Task 5: Проверка и PR

**Files:** без изменений кода.

- [ ] **Step 1: Run** `pnpm typecheck` и `pnpm test` — PASS.
- [ ] **Step 2: Просмотр в браузере** (`preview_start`, dev-сервер): десктоп и 390 px, до ввода, после ввода, при «меньше движения» (`emulateMedia`), скриншоты для PR.
- [ ] **Step 3: Open PR** в `master`: описание — что показывает диаграмма, как проверено, что оформление сделано Codex. Мерж только владелица.
