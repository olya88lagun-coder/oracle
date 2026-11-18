# «Нить» (график судьбы), этап 1: бесплатная страница — план

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Страница `/numerologiya/grafik-sudby`: по дате рождения в браузере строится плавная золотая нить личных годов, точка «вы здесь», четыре периода жизни, карточки годов и периодов, открытая формула, FAQ, «Нить для сторис». Закрыта (404), пока партия текстов 9 не принята владелицей.

**Architecture:** Чистый расчёт в `@oracle/core` (`life-thread.ts`), кривая и путь SVG — чистые функции в `apps/web/src/lib/life-thread-curve.ts`, картинка — клиентский компонент `ThreadChart` по утверждённому макету, тексты — два новых вида нумерологии (`thread`, `period`, партия 9) в существующей системе партий. Страница по образцу `lichnyy-god-2027`.

**Tech Stack:** Next.js 16 (App Router), React, TypeScript, vitest, SVG без библиотек, pnpm-монорепозиторий.

**Spec:** `docs/superpowers/specs/2026-11-18-life-thread-design.md` (этап 1). Этап 2 (платный «Разбор нити») — отдельный план после принятия текстов этапа 1. Эталон картинки: `docs/design/mockups/thread/thread-premium.html`.

## Global Constraints

- Работа в ветке `feat/web-life-thread` от свежего `origin/master`; сдача pull request'ом, мерж только владелицей. Коммиты — conventional commits на английском (`feat(web): …`).
- Перед сдачей: `pnpm install`, `pnpm typecheck`, `pnpm test` зелёные.
- Тексты сайта на русском, на «вы», без обещаний предсказать будущее; слов-оценок «благоприятный/неблагоприятный», «плохой», «спад», «чёрная полоса» нет.
- Дата рождения не попадает в адрес, в хранилище браузера и в запросы; расчёт только в браузере; в цель Метрики дата не передаётся.
- Внешних шрифтов, CDN и скриптов нет. Цвета только через переменные `globals.css` (в макете HEX — перевести в переменные: `--accent`, `--accent-soft`, `--ink`, `--ink-soft`, `--ink-faint`, `--lavender`, `--line`, `--line-strong`, `--surface`, `--bg`).
- Мобильные в приоритете: 375 px без горизонтальной прокрутки страницы, текст не мельче 14 px, зоны нажатия не меньше 44 px, контраст AA, фокус виден.
- Любое движение только внутри `@media (prefers-reduced-motion: no-preference)`; при «меньше движения» нить сразу готова.
- Правки существующих файлов только добавлениями (список принятых партий, манифест, карта сайта, список на `/numerologiya`, цели Метрики, плакат). Существующее поведение и тесты не менять, кроме счётчика `NUMEROLOGY_PAGES` (69 → 87).
- Шкала высот (владелица принимает вместе с текстами): `{1:.42, 2:.08, 3:.5, 4:.22, 5:.62, 6:.4, 7:.18, 8:1, 9:.66}`, двойное сглаживание `(a + 2b + c) / 4`, интерполяция Catmull-Rom.
- Названия личных годов: 1 старт, 2 терпение, 3 самовыражение, 4 фундамент, 5 перемены, 6 забота, 7 осмысление, 8 урожай, 9 завершение. Ось подписана «высоко» и «тихо». На картинке подпись вершины только у года 8.
- Дословно: поле «Дата рождения», кнопка «Показать мою нить», надзаголовок «График судьбы по дате рождения», заголовок «Вся жизнь — одной нитью», подпись точки «Вы здесь · год N», кнопка «Вся жизнь», кнопка «Картинка для сторис», подписи периодов «I период» … «IV период» (у последнего «IV период · и дальше»). Ошибка даты — константа `DATE_ERROR` из `lib/matrix-save`.

## Review Focus

Ввод и состояния, про которые спека молчит, но которые сломают человека (каждая строка имеет тест в указанной задаче):

1. Рождённый 29 февраля: в невисокосные годы год начинается 1 марта, заканчивается 28 февраля (Task 1).
2. Сегодня ровно день рождения или за день до него: личный год переключается именно в день рождения (Task 1).
3. Родился 3 года назад: окно подрезано по году рождения, точек меньше девятнадцати, график не ломается (Task 2, Task 6).
4. Родился в 1900-м: «Вся жизнь» до «сейчас + 9», период IV без конца (Task 1, Task 6).
5. Телефон и клавиатура: подсказка по касанию, таблица «Год — личный год — тема» под картинкой, при «меньше движения» никакой анимации (Task 6).
6. Невозможная и будущая дата: ошибка на месте с `role="alert"`, результат не показан (Task 7).

---

### Task 1: Расчёт нити в `@oracle/core`

**Files:**
- Create: `packages/core/src/life-thread.ts`
- Create: `packages/core/src/life-thread.test.ts`
- Modify: `packages/core/src/index.ts` (добавить `export * from "./life-thread";` рядом с `./numerology`)

**Interfaces:**
- Consumes: `parseBirthDate(value, today): BirthDate | null` из `./birth-date` (`BirthDate = { year, month, day }`).
- Produces (все экспортируются из `@oracle/core`):
  - `foldToNine(n: number): number` — сворачивает сложением цифр до 1–9, мастер-чисел нет.
  - `personalYearOf(birth: BirthDate, year: number): number`
  - `type ThreadYear = { readonly year: number; readonly value: number; readonly start: string; readonly end: string }` (`start`/`end` — ISO `ГГГГ-ММ-ДД`, `end` — день перед следующим началом).
  - `type ThreadPeriod = { readonly index: 1 | 2 | 3 | 4; readonly value: number; readonly fromYear: number; readonly toYear: number | null }` (границы — календарные годы, граница падает на день рождения).
  - `type LifeThread = { readonly birth: BirthDate; readonly lifePath: number; readonly years: readonly ThreadYear[]; readonly currentYear: number; readonly periods: readonly ThreadPeriod[] }`
  - `calculateLifeThread(iso: string, today: Date): LifeThread | null`

- [ ] **Step 1: Write the failing tests** в `life-thread.test.ts` (дата — вымышленная `1990-07-15`, `today = new Date("2026-11-18T12:00:00Z")`):
  - `personalYearOf` для `{1990,7,15}`: 2017→5, 2020→8, 2026→5, 2029→8, 2030→9, 2031→1; вызов для каждого года подряд всегда `value % 9 + 1` предыдущего.
  - `calculateLifeThread` вернул `lifePath` 5; `periods` ровно `[{index:1,value:4,fromYear:1990,toYear:2021},{index:2,value:7,fromYear:2021,toYear:2030},{index:3,value:2,fromYear:2030,toYear:2039},{index:4,value:8,fromYear:2039,toYear:null}]`.
  - `currentYear` 2026; `years` начинаются с 1990 и заканчиваются годом `max(1990 + 90, 2026 + 9)` = 2080; у года 2026 `start` `"2026-07-15"`, `end` `"2027-07-14"`.
  - Граница дня рождения: `today = 2026-07-14` → `currentYear` 2025; `today = 2026-07-15` → 2026.
  - Рождённый 29.02.1992: у 2027 `start` `"2027-03-01"`, `end` `"2028-02-28"`; у 2028 (високосный) `start` `"2028-02-29"`.
  - Рождённый 01.01.1900, `today` 2026: `years` до 2035 (`2026 + 9`), у последнего периода `toYear` `null`.
  - Невозможная дата, дата из будущего, не строка → `null`.

- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run packages/core/src/life-thread.test.ts` — Expected: FAIL (модуль не найден).

- [ ] **Step 3: Implement** в `life-thread.ts` по сигнатурам выше. Формулы из спеки: личный год — цифры дня + цифры месяца + цифры года, свёртка до 1–9; периоды: d, m, y — свёрнуты до 1–9; p1 = m+d, p2 = d+y, p3 = p1+p2, p4 = m+y, каждый свёрнут; L — свёртка суммы всех цифр даты; первая граница — год рождения + 36 − L, затем +9 и ещё +9; последний период без конца. Начало года N — день рождения в году N; для 29 февраля в невисокосный год — 1 марта. Диапазон `years` — от года рождения до `max(рождение + 90, год today + 9)`. `currentYear` — `год today`, если сегодня (по UTC-полям `today`) не раньше дня рождения этого года, иначе на единицу меньше.

- [ ] **Step 4: Run to verify PASS** той же командой.

- [ ] **Step 5: Commit** `feat(core): life thread calculation (personal years and four periods)`

---

### Task 2: Кривая нити — `lib/life-thread-curve.ts`

**Files:**
- Create: `apps/web/src/lib/life-thread-curve.ts`
- Create: `apps/web/src/lib/life-thread-curve.test.ts`

**Interfaces:**
- Consumes: `ThreadYear` из `@oracle/core` (Task 1).
- Produces:
  - `THREAD_LEVELS: Readonly<Record<number, number>>` — шкала из Global Constraints.
  - `YEAR_NAMES: Readonly<Record<number, string>>` — названия личных годов.
  - `curveLevels(values: readonly number[]): number[]` — двойное сглаживание уровней; соседи за краем берутся из цикла (следующий год = `value % 9 + 1`, предыдущий = `value === 1 ? 9 : value - 1`); результат нормирован на 0…1 по min/max самого списка.
  - `threadWindow(years: readonly ThreadYear[], currentYear: number, mode: "window" | "all"): readonly ThreadYear[]` — `window`: от `currentYear − 9` до `currentYear + 9`, обрезано по первому и последнему году списка; `all`: весь список.
  - `smoothPath(points: readonly { x: number; y: number }[]): string` — путь `M… C…` по Catmull-Rom (`c1 = p1 + (p2 − p0)/6`, `c2 = p2 − (p3 − p1)/6`, края дублируются).

- [ ] **Step 1: Failing tests:** `curveLevels([5,6,7,8,9,1,2,3,4,5])` → длина 10, минимум 0, максимум 1, значение у года 8 больше, чем у соседних 7 и 9; результат не зависит от того, что окно обрезано посреди цикла (`curveLevels([8])` — длина 1, без `NaN`); `threadWindow` для рождённого 3 года назад (`years` от 2023, `currentYear` 2026) начинается с 2023 (меньше девятнадцати точек); `mode: "all"` возвращает весь список; `smoothPath` для двух точек начинается с `"M"` и содержит ровно один `"C"`; для одной точки возвращает `"M…"` без `"C"`.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run apps/web/src/lib/life-thread-curve.test.ts`
- [ ] **Step 3: Implement** по сигнатурам.
- [ ] **Step 4: Run to verify PASS.**
- [ ] **Step 5: Commit** `feat(web): thread curve helpers (levels, window, smooth path)`

---

### Task 3: Виды текстов `thread` и `period`, партия 9 (без самих текстов)

**Files:**
- Modify: `packages/content/src/numerology-manifest.ts` (`NumerologyKind` + `"thread" | "period"`; в `NUMEROLOGY_PAGES` по девять страниц каждого вида с `batch: 9`; в `NUMEROLOGY_ACCEPTED_BATCHES` номер 9 **не добавлять**)
- Modify: `packages/content/src/numerology.ts` (`KINDS`; `NUMEROLOGY_SECTION_TITLES` для `thread`: «Тема года», «На что опереться», «Где осторожнее», «Вопрос для себя»; для `period`: «Сила периода», «Трудность периода», «Как пройти границу», «Вопрос для себя»; `NUMEROLOGY_MIN_BODY`: `thread` 1800, `period` 1800)
- Modify: `packages/content/src/numerology.test.ts` (счётчик `NUMEROLOGY_PAGES` 69 → 87; добавить проверку, что у партии 9 восемнадцать страниц: девять `thread` и девять `period`)
- Modify: `packages/content/src/numerology-texts.ts` (реэкспорт, если новые константы нужны наружу; иначе без изменений)

**Interfaces:**
- Consumes: существующая система партий (`NUMEROLOGY_PAGES`, `parseNumerologyPage`).
- Produces: `NumerologyKind` включает `"thread"` и `"period"`; ключи 1–9; файлы `packages/content/numerology/thread-N.md`, `period-N.md`; `acceptedNumerologyPages("thread" | "period")` пуст, пока партия 9 не принята.

- [ ] **Step 1: Failing test** в `numerology.test.ts`: `NUMEROLOGY_PAGES.filter(p => p.batch === 9)` — 18 элементов; `parseNumerologyPage` текста с `kind: thread` и правильными разделами принимается, а с `kind: thread` и разделами от `year` — отклоняется («разделы по порядку»).
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run packages/content/src/numerology.test.ts`
- [ ] **Step 3: Implement** изменения по списку файлов.
- [ ] **Step 4: Run to verify PASS** (весь файл).
- [ ] **Step 5: Commit** `feat(content): thread and period text kinds, batch 9`

---

### Task 4: Девять карточек «Год N в вашей жизни» (партия 9)

**Files:**
- Create: `packages/content/numerology/thread-1.md` … `thread-9.md`
- Modify (сборка): `pnpm content:build` обновляет `packages/content/src/generated/numerology.json`

**Interfaces:**
- Consumes: формат файла из `parseNumerologyPage` (шапка `kind: thread`, `key: N`, `title`, `description` 90–175 знаков, `batch: 9`, четыре раздела из Task 3, не меньше 1800 знаков, каждый абзац отдельной строкой через пустую строку).
- Produces: тексты, которые читает `numerologyText("thread", String(n))` после принятия партии.

- [ ] **Step 1:** написать девять файлов в стиле соседних `year-N.md`: год N цикла вообще (не 2027), тема, три-четыре опоры, осторожности, один вопрос себе; название года из Global Constraints в первом абзаце; без прогнозов событий и оценок, «символическое прочтение».
- [ ] **Step 2:** `pnpm content:build`, затем `pnpm exec vitest run packages/content/src/numerology.test.ts`. Expected: PASS (формат и длина проверены тестом, который читает все файлы каталога).
- [ ] **Step 3: Commit** `feat(content): nine "year in your life" cards for the thread page (batch 9)`

---

### Task 5: Девять карточек «Период с числом N» (партия 9)

**Files:**
- Create: `packages/content/numerology/period-1.md` … `period-9.md`

**Interfaces:**
- Consumes: формат из Task 3 (`kind: period`, разделы «Сила периода», «Трудность периода», «Как пройти границу», «Вопрос для себя», не меньше 1800 знаков).
- Produces: тексты, ключ — число периода 1–9; один текст годится для любого из четырёх периодов (позиция периода подписывается в интерфейсе: «I период — формирование» и т. п. задаётся константой в Task 7, не в тексте).

- [ ] **Step 1:** написать девять файлов; формулировки не привязаны к возрасту и к номеру периода; без приговоров и обещаний.
- [ ] **Step 2:** `pnpm content:build` и `pnpm exec vitest run packages/content/src/numerology.test.ts`. Expected: PASS.
- [ ] **Step 3: Commit** `feat(content): nine period cards for the thread page (batch 9)`

---

### Task 6: Картинка `ThreadChart`

**Files:**
- Create: `apps/web/src/components/numerology/ThreadChart.tsx`
- Create: `apps/web/src/components/numerology/ThreadChart.test.tsx`

**Interfaces:**
- Consumes: `LifeThread`, `ThreadYear`, `ThreadPeriod` из `@oracle/core` (Task 1); `curveLevels`, `threadWindow`, `smoothPath`, `YEAR_NAMES` из `@/lib/life-thread-curve` (Task 2).
- Produces: `ThreadChart(props: { thread: LifeThread })` — клиентский компонент (`"use client"`): SVG по макету `docs/design/mockups/thread/thread-premium.html` (сетка, зоны периодов, засечки лет, свечение и заливка нити, дымка будущего, вершины-кольца у года 8, «Вы здесь · год N» лавандовым, ведущий огонёк), кнопка-переключатель «Вся жизнь» / «Окно» (`aria-pressed`, зона нажатия не меньше 44 px), под SVG таблица `<table>` «Год — личный год — тема» (все годы выбранного диапазона; текущий отмечен `aria-current="date"`).

- [ ] **Step 1: Failing tests** (`renderToStaticMarkup`, дата `1990-07-15`, `today` через расчёт из Task 1):
  - В разметке есть `role="img"` с `aria-label`, начинающимся с «Линия жизни по годам»; текст «Вы здесь · год 5»; подписи «I период» … «IV период · и дальше»; кнопка «Вся жизнь».
  - У года 2029 в таблице «урожай»; строки таблицы 19 в окне; у 2026 `aria-current="date"`.
  - Для рождённого 3 года назад строк в таблице меньше 19 и нет `NaN` в разметке.
  - Ни одного слова из `["плох", "спад", "приговор"]` в разметке.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run apps/web/src/components/numerology/ThreadChart.test.tsx`
- [ ] **Step 3: Implement.** Алгоритм (макет — эталон): координаты `x` — равномерно по годам, `y` — `curveLevels` по значениям окна, путь — `smoothPath`; анимация «рисования» — `requestAnimationFrame` (3400 мс, `easeInOutCubic`) с `clipPath`, управляемым из эффекта; при `matchMedia("(prefers-reduced-motion: reduce)")` — сразу готово; наведение и касание (`onPointerMove`/`onPointerDown`) показывают линию, точку и карточку «ГГГГ · год N» с названием года; подсказка не выходит за край (`clamp`). Классы `thread-*`, цвета — переменные.
- [ ] **Step 4: Run to verify PASS.**
- [ ] **Step 5: Commit** `feat(web): premium life thread chart`

---

### Task 7: Калькулятор и результат

**Files:**
- Create: `apps/web/src/lib/life-thread.ts`
- Create: `apps/web/src/lib/life-thread.test.ts`
- Create: `apps/web/src/components/numerology/ThreadCalculator.tsx`
- Create: `apps/web/src/components/numerology/ThreadResult.tsx`
- Create: `apps/web/src/components/numerology/ThreadResult.test.tsx`
- Modify: `apps/web/src/lib/analytics.ts` (в `GOALS` добавить `"thread_calculated"`, `"thread_poster"`)
- Modify: `apps/web/src/lib/numerology.ts` (в `NumerologyGoal` добавить `` `thread_${string}` ``)

**Interfaces:**
- Consumes: `calculateLifeThread`, `LifeThread` (Task 1); `ThreadChart` (Task 6); `DATE_ERROR` из `@/lib/matrix-save`; `reachNumerologyGoal` из `@/lib/numerology`.
- Produces (в `lib/life-thread.ts`): `THREAD_PATH = "/numerologiya/grafik-sudby"`; `type ThreadOutcome = { ok: true; iso: string; thread: LifeThread } | { ok: false; error: string }`; `threadOutcome(iso: string, today: Date): ThreadOutcome`; `THREAD_FAQ: readonly { question: string; answer: string }[]` (6 вопросов: как считается нить, чем отличается от личного года 2027 и матрицы, почему год от дня рождения, что значит «тихий» год, это предсказание — нет, куда попадает дата); `PERIOD_POSITIONS: Readonly<Record<1|2|3|4, string>>` («формирование», «зрелость», «плоды», «мудрость»); `type ThreadCard = { readonly sections: readonly { readonly title: string; readonly paragraphs: readonly string[] }[] }`; `type ThreadTexts = { readonly years: Readonly<Record<number, ThreadCard>>; readonly periods: Readonly<Record<number, ThreadCard>> }`.
  Компоненты: `ThreadCalculator(props: { texts: ThreadTexts })` — форма и результат; `ThreadResult(props: { thread: LifeThread; texts: ThreadTexts })` — карточка «Где вы сейчас» (год, число, название, «до <дата>»), `ThreadChart`, четыре периода с диапазоном лет, открытая формула с примером на `1990-07-15`, кнопка «Картинка для сторис» (подключается в Task 9).

- [ ] **Step 1: Failing tests:** `threadOutcome("1990-07-15", today)` → `ok: true`, `thread.lifePath` 5; `threadOutcome("1990-02-31", today)` и дата завтрашнего года → `ok: false` с `DATE_ERROR`; `ThreadResult` для `1990-07-15` содержит «Год 5», «перемены», «до 14 июля 2027» и четыре подписи периодов с «формирование»; если `texts` пуст — блок «Описание появится позже» вместо карточки, без ссылок; `THREAD_FAQ` — ровно 6 вопросов, ни один ответ не содержит «предсказ» без отрицания «не» (ответ про предсказание начинается с «Нет.»).
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run apps/web/src/lib/life-thread.test.ts apps/web/src/components/numerology/ThreadResult.test.tsx`
- [ ] **Step 3: Implement.** `ThreadCalculator` — по образцу `PersonalYearCalculator`: поле «Дата рождения» (`<input type="date" min="1900-01-01">`, подпись `label`), кнопка «Показать мою нить», ошибка `role="alert"` и возврат фокуса в поле, абзац «Бесплатно, без регистрации. Дата остаётся в браузере.», после успеха `reachNumerologyGoal("thread_calculated")`; смена даты сбрасывает результат; `key={iso}` у результата.
- [ ] **Step 4: Run to verify PASS.**
- [ ] **Step 5: Commit** `feat(web): thread calculator and result`

---

### Task 8: Страница, закрытие партией, карта сайта, ссылки

**Files:**
- Create: `apps/web/src/app/numerologiya/grafik-sudby/page.tsx`
- Create: `apps/web/src/app/numerologiya/grafik-sudby/page.test.tsx`
- Create: `apps/web/src/app/numerologiya/grafik-sudby/page.accepted.test.tsx`
- Modify: `apps/web/src/lib/numerology-pages.ts` (добавить `acceptedThreadPaths(): string[]` — `[THREAD_PATH]`, если `acceptedNumerologyPages("thread").length` и `acceptedNumerologyPages("period").length` ненулевые, иначе `[]`)
- Modify: `apps/web/src/lib/seo.ts` (в `PUBLIC_PATHS` добавить `...acceptedThreadPaths()` после `...acceptedPairPaths()`)
- Modify: `apps/web/src/app/sitemap.ts` (добавить `THREAD_PATH` в `PRACTICE_PATHS`)
- Modify: `apps/web/src/app/numerologiya/page.tsx` и `apps/web/src/components/numerology/NumerologyMoreLinks.tsx` (ссылка «График судьбы — нить личных годов» только при `acceptedThreadPaths().length`; в `NumerologyMoreLinks` тип `current` расширить `THREAD_PATH`)

**Interfaces:**
- Consumes: `ThreadCalculator`, `ThreadTexts` (Task 7); `acceptedNumerologyPages`, `numerologyText` из `@oracle/content/numerology`; `publicMetadata`, `jsonLdScript` из `@/lib/seo`.
- Produces: страница по образцу `lichnyy-god-2027/page.tsx`: `metadata` (`title` «График судьбы по дате рождения — нить личных годов» не длиннее 60 знаков вместе с « — Твой оракул», `description` 90–175 знаков, `path: THREAD_PATH`), JSON-LD `WebApplication`, `FAQPage` из `THREAD_FAQ`, `BreadcrumbList` (Твой оракул → Нумерология → График судьбы); один `<h1>`; хлебные крошки; блок «Открытая формула» и «Не прогноз. Этап пути.»; `notFound()` из `next/navigation`, когда `acceptedNumerologyPages("thread")` или `("period")` пуст; функция сборки `ThreadTexts` из принятых текстов.

- [ ] **Step 1: Failing tests:** `page.test.tsx` — без принятой партии `Page()` вызывает `notFound` (в vitest — ловим брошенную ошибку `NEXT_HTTP_ERROR_FALLBACK;404`), `PUBLIC_PATHS` не содержит `THREAD_PATH`, `/numerologiya` не содержит ссылки на нить. `page.accepted.test.tsx` (по образцу `kvadrat-pifagora/page.accepted.test.tsx`: `vi.mock("@oracle/content/numerology", …)` с фикстурой «партия 9 принята» и короткими текстами) — разметка содержит один `<h1`, `JSON-LD` с `["WebApplication","FAQPage","BreadcrumbList"]`, `title` ≤ 60 знаков с суффиксом, `canonical` `THREAD_PATH`, ссылку на `/numerologiya/lichnyy-god-2027`; хаб `/numerologiya` теперь содержит `href="/numerologiya/grafik-sudby"`.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run apps/web/src/app/numerologiya/grafik-sudby`
- [ ] **Step 3: Implement.** Фикстуру партии 9 вынести в `grafik-sudby/thread-fixtures.ts` по образцу `kvadrat-pifagora/square-fixtures.ts`.
- [ ] **Step 4: Run to verify PASS;** затем `pnpm exec vitest run apps/web/src/lib apps/web/src/app/numerologiya` — проверить, что существующие тесты (`seo`, `client-bundle`, хаб) целы. `client-bundle.test.ts` не должен найти `@oracle/content/numerology` в клиентских компонентах (тексты уходят пропсами с сервера).
- [ ] **Step 5: Commit** `feat(web): life thread page, closed until batch 9 is accepted`

---

### Task 9: «Нить для сторис»

**Files:**
- Modify: `apps/web/src/lib/poster.ts` (добавить `ThreadPosterSpec` и `renderThreadPoster(spec, fonts): Promise<Blob>`)
- Modify: `apps/web/src/components/PosterButton.tsx` (принять `ThreadPosterSpec` в объединении `spec`, вызывать `renderThreadPoster`)
- Modify: `apps/web/src/components/numerology/ThreadResult.tsx` (кнопка + `reachNumerologyGoal("thread_poster")` по клику)
- Create: `apps/web/src/lib/poster-thread.ts` (только `threadPosterSpec`, без канваса)
- Create: `apps/web/src/lib/poster-thread.test.ts`

**Interfaces:**
- Consumes: `POSTER_SIZE` (1080×1920), `wrapLines`, `Measure` из `lib/poster.ts`; точки и подписи из `ThreadChart` (общую функцию построения точек вынести в `lib/life-thread-curve.ts` как `threadPoints(years, level, box)`, если нужна и там, и тут).
- Produces: `type ThreadPosterSpec = { thread: "thread"; points: readonly { x: number; y: number }[]; nowIndex: number; yearLabels: readonly { x: number; text: string }[]; footer: string; fileName: string }` (`thread: "thread"` — различитель в объединении, как `trail` у `PathPosterSpec`); `renderThreadPoster`. **Даты рождения на картинке нет:** подписи — только годы, номер текущего года и надпись «Нить личных годов».

- [ ] **Step 1: Failing test** (`poster-thread.test.ts`): `ThreadPosterSpec`, собранный из `calculateLifeThread("1990-07-15")`, не содержит строки `"1990-07-15"`, `"15.07"`, `"15 июля"` ни в одном поле (`JSON.stringify(spec)`); `renderThreadPoster` не вызывается в vitest (канвас), поэтому проверяем только сборку спеки функцией `threadPosterSpec(thread: LifeThread): ThreadPosterSpec`, которая экспортируется из `lib/poster-thread.ts`.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run apps/web/src/lib/poster-thread.test.ts`
- [ ] **Step 3: Implement** по образцу `renderPathPoster` (тёмный фон, золотая нить с мягким свечением по точкам спеки, кольцо «вы здесь», подпись года, футер с адресом сайта); никаких сетевых запросов.
- [ ] **Step 4: Run to verify PASS.**
- [ ] **Step 5: Commit** `feat(web): thread poster for stories`

---

### Task 10: Стили, проверка в браузере, сдача

**Files:**
- Modify: `apps/web/src/app/numerologiya/numerology.css` (классы `thread-*`: сцена с градиентами из макета, нить, зоны периодов, таблица, подсказка; адаптив до 375 px; движение только в `@media (prefers-reduced-motion: no-preference)`)
- Modify: `.gitignore` (добавить строку `.superpowers/`)

- [ ] **Step 1:** довести стили; цвета — переменные (см. Global Constraints).
- [ ] **Step 2: Проверка в браузере.** Для просмотра закрытой страницы временно добавить `9` в `NUMEROLOGY_ACCEPTED_BATCHES` в рабочей копии (**не коммитить**). `pnpm dev:db`, `pnpm dev:web`, открыть `/numerologiya/grafik-sudby`; ввести `1990-07-15`; проверить на 1440 и 375 px: нет горизонтальной прокрутки, нить рисуется, подсказка по касанию, таблица под картинкой, «Вся жизнь» переключает диапазон; с эмуляцией `prefers-reduced-motion: reduce` нить сразу готова; консоль без ошибок. Убрать временную правку.
- [ ] **Step 3:** `pnpm install && pnpm typecheck && pnpm test` — зелёные.
- [ ] **Step 4: Commit** `style(web): life thread page styles` и открыть pull request; в описании: партия 9 не принята (страница закрыта), список решений из раздела «Уточнения» спеки, что осталось владелице (принять формулу периодов, шкалу высот, тексты).
