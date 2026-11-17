# Лунный календарь на месяц — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** страницы `/lunnyy-kalendar/<месяц>-<год>` с сеткой месяца, ключевыми датами, сменами знака Луны, таблицей «день за днём» и вопросами с настоящими датами; `/lunnyy-kalendar` ведёт на текущий месяц.

**Architecture:** расчёт месяца — чистые функции в `packages/core/src/moon/month.ts` поверх уже готовых `moonSnapshot`, `nextMoonEvent`, `moonRises`, `lunarDayFromRises`; данные страницы — `apps/web/src/lib/lunar-calendar.ts`; страница — серверные компоненты со статической сборкой (`generateStaticParams`) и суточным обновлением; интерактивная часть (сетка, большая Луна выбранного дня, ключевые даты) — клиентский `MoonMonthExplorer`, который переиспользует `AnimatedDisc` (плавное «переливание» терминатора, уже есть в `MoonExplorer`); кривая света и лента знаков — серверные SVG и разметка; отметка «сегодня» на кривой и ленте — крошечный клиентский компонент. Оформление — Codex по `docs/design/codex-brief-lunar-calendar.md`; Claude оставляет рабочий каркас стилей.

**Tech Stack:** Next.js 16 (App Router), `astronomy-engine` 2.1.19, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-17-lunar-calendar-design.md`

## Global Constraints

- Всё по Москве (UTC+3, `MOSCOW` и `moscowDayStart` из `@oracle/core/moon`); даты и время в текстах — через `Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", … })`.
- Нет оценок дней, советов по стрижке, деньгам, здоровью, свиданиям и «Луны без курса»; запрещённые слова (`FORBIDDEN_MOON_WORDS` из `@oracle/content/moon`) проверяются по всему видимому тексту страницы.
- Новых зависимостей, внешних скриптов и картинок, целей Метрики и хранилища в браузере нет. Коммиты — conventional commits на английском.
- Любое движение только внутри `prefers-reduced-motion: no-preference`; цвета только переменными; 375 px без горизонтальной прокрутки страницы, текст не мельче 14 px, контраст AA, зоны нажатия не меньше 44 px.
- Один `<h1>`: «Лунный календарь на <месяц> <год>»; подпись «По Москве»; `publicMetadata` с каноническим адресом страницы месяца; FAQPage и BreadcrumbList; дисклеймер `DISCLAIMER`.
- Слаги месяцев: `yanvar`, `fevral`, `mart`, `aprel`, `may`, `iyun`, `iyul`, `avgust`, `sentyabr`, `oktyabr`, `noyabr`, `dekabr`; адрес `/lunnyy-kalendar/<слаг>-<год>`. Окно страниц: предыдущий, текущий и 13 следующих месяцев по Москве (15); вне окна — настоящий 404.
- Next 16: перед выбором режима сборки (`generateStaticParams`, `dynamicParams`, `revalidate`) прочитать `node_modules/next/dist/docs/` (`apps/web/AGENTS.md`); клиентским компонентам подключать только `@oracle/core/moon/visual` (не главный вход `@oracle/core/moon`).

- Эффекты (раздел «Эффекты «вау»» спецификации): живая Луна месяца, световая волна (`--lit`), кривая света, лента знаков, вводная волна. Никаких блёсток и мерцания; вся анимация не длиннее 1,2 с, одноразовая или в ответ на действие, и только в `prefers-reduced-motion: no-preference`.
- Сетка остаётся `<table>`; кнопки внутри ячеек доступны с клавиатуры (одна точка входа по Tab, стрелки перемещают по дням, Home/End — первый и последний день), выбранный день — `aria-pressed="true"`, подпись выбранной Луны — `aria-live="polite"`.

## Review Focus

- Событие в первые минуты 1-го числа по Москве (например 00:xx) не попадает в предыдущий месяц, а событие в конце 31-го — в следующий (Task 2).
- Месяцы 28, 29, 30 и 31 день: февраль 2027 — 28, февраль 2028 — 29; неделя начинается с понедельника, 1 ноября 2026 — воскресенье (Tasks 2, 3).
- Два полнолуния в одном месяце (май 2026: 1.05 и 31.05) и месяц, где одного из событий нет (Tasks 2, 3).
- Смена лунных суток внутри календарного дня (17.11.2026: 8-е → 9-е в 13:53) и день без восхода Луны: показывается «—», номер не прыгает (Task 2).
- Смена знака ровно у границы суток или месяца: каждая смена попадает в один месяц, промежутки знаков без разрывов и перекрытий (Tasks 1, 2).
- Слаг месяца вне окна, с неверным месяцем или годом, регистром и лишними символами: 404, а не падение (Task 3).
- Выбранный день и «сегодня»: на статической странице первый выбор одинаков на сервере и в браузере; после загрузки в текущем месяце выбор переходит на сегодняшний день, а в другом месяце остаётся прежним (Task 5).
- Кривая света: освещённость 0 и 1 даёт точки на краях без `NaN`, месяцы из 28 и 31 дня ложатся на одну и ту же ширину (Task 3).

---

### Task 1: Смены знака Луны

**Files:**
- Create: `packages/core/src/moon/signs.ts`
- Test: `packages/core/src/moon/signs.test.ts`
- Modify: `packages/core/src/moon/index.ts`

**Interfaces:**
- Consumes: `eclipticLongitude("moon", date)` из `../natal/bodies`; `signOf`, `SignId`, `SIGNS` из `../natal/zodiac`.
- Produces: `export type SignChange = { sign: SignId; at: Date }` (знак, в который Луна входит в момент `at`); `export function moonSignChanges(from: Date, to: Date): SignChange[]` — все входы в новый знак строго после `from` и не позже `to`, по возрастанию, время с точностью до минуты (шаг по долготе в час, затем деление отрезка пополам).

- [ ] **Step 1: Write the failing tests** в `signs.test.ts`: на окне 2026-11-01…2026-12-01 (UTC) переходов от 12 до 15; каждый следующий знак — следующий по `SIGNS` по кругу (`aries` после `pisces`); моменты строго возрастают, интервал между соседними от 1,5 до 3,5 суток; на каждый найденный `at` знак Луны за минуту до — предыдущий, а в `at` — новый (`signOf(eclipticLongitude("moon", …)).sign`); пустое окно (`from === to`) даёт `[]`; окно из 10 минут вокруг известного перехода находит его; `moonSignChanges(a, b)` + `moonSignChanges(b, c)` даёт то же, что `moonSignChanges(a, c)` (без потерь и дублей на границе `b`).
- [ ] **Step 2: Run** `pnpm vitest run packages/core/src/moon/signs.test.ts` — Expected: FAIL «Cannot find module».
- [ ] **Step 3: Implement** `moonSignChanges` и экспорт из `index.ts`.
- [ ] **Step 4: Run** файл — PASS; `pnpm --filter @oracle/core typecheck`.
- [ ] **Step 5: Commit** `feat(core): Moon sign changes`.

### Task 2: Данные месяца

**Files:**
- Create: `packages/core/src/moon/month.ts`
- Test: `packages/core/src/moon/month.test.ts`
- Modify: `packages/core/src/moon/index.ts`

**Interfaces:**
- Consumes: Task 1 (`moonSignChanges`, `SignChange`); `moonSnapshot`, `MoonSnapshot`, `nextMoonEvent`, `MoonEvent`, `previousNewMoon`, `moonRises`, `moonSets`, `lunarDayFromRises`, `moscowDayStart` из соседних файлов.
- Produces:
  - `export type MoonMonthDay = { date: string; day: number; weekday: number; snapshot: MoonSnapshot; lunarDay: { number: number; changeAt: Date | null; changeTo: number | null }; rise: Date | null; set: Date | null }` — `date` вида `YYYY-MM-DD` по Москве; `weekday` 0 = понедельник … 6 = воскресенье; `snapshot` на 12:00 по Москве; `changeAt`/`changeTo` — момент и номер, если лунные сутки сменяются внутри этого календарного дня (иначе `null`)
  - `export type SignRun = { sign: SignId; from: Date; to: Date }` — непрерывные промежутки знаков внутри месяца; первый начинается с начала месяца, последний кончается в его конце
  - `export type MoonMonth = { year: number; month: number; days: MoonMonthDay[]; events: MoonEvent[]; signRuns: SignRun[] }` — `month` от 1 до 12; `events` — события, чья московская дата в месяце, по возрастанию
  - `export function moonMonth(year: number, month: number): MoonMonth`
  - `export function daysInMonth(year: number, month: number): number`

- [ ] **Step 1: Write the failing tests** в `month.test.ts`: `moonMonth(2026, 11)` — 30 дней, `days[0].weekday === 6` (1 ноября 2026 — воскресенье), `days[0].date === "2026-11-01"`, `days[29].date === "2026-11-30"`; события ноября — по порядку `new` 9.11 ≈ 10:02, `firstQuarter` 17.11 ≈ 14:47, `full` 24.11 ≈ 17:53 по Москве, допуск ±2 минуты (эталон timeanddate.com/moon/phases/russia/moscow, сверено 17.11.2026); день 17 ноября: `lunarDay.number === 9` на полдень не требуется — проверить `days[16].lunarDay.changeTo === 9` и `changeAt` ≈ 13:53 по Москве (±3 минуты), у 18 ноября `changeAt`/`changeTo` тоже заданы, а у дня без смены суток — `null`; `rise` 17 ноября ≈ 13:53, `set` ≈ 23:39 (Москва, ±3 минуты); май 2026 — два события `full` (1.05 ≈ 23:23 и 31.05 ≈ 14:45 по Москве: сверить с эталоном при реализации, допуск ±2 минуты); `daysInMonth(2027, 2) === 28`, `daysInMonth(2028, 2) === 29`, `daysInMonth(2026, 12) === 31`; граница месяцев: на ноябрь 2026 и декабрь 2026 вместе событие 9 декабря в 03:51 по Москве есть только в декабре; сумма событий по соседним месяцам не содержит дублей; `signRuns`: первый `from` — начало месяца, последний `to` — его конец, каждый следующий `from` равен предыдущему `to`, соседние знаки различаются, число промежутков 11–15.
- [ ] **Step 2: Run** `pnpm vitest run packages/core/src/moon/month.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** по сигнатурам: восходы и новолуния считать один раз на окно «месяц + 32 суток назад + 2 суток вперёд», а лунные сутки каждого дня — через `lunarDayFromRises(noon, подходящееНоволуние, восходы)`; смену суток внутри дня искать как момент, когда номер меняется между началом и концом московских суток.
- [ ] **Step 4: Run** файл — PASS (время расчёта месяца меньше 2 секунд: проверить в тесте `moonMonth(2026, 11)` замером); `pnpm --filter @oracle/core typecheck`.
- [ ] **Step 5: Commit** `feat(core): Moon data for a calendar month`.

### Task 3: Слаги, окно месяцев и данные страницы

**Files:**
- Create: `apps/web/src/lib/lunar-calendar-paths.ts`, `apps/web/src/lib/lunar-calendar.ts`
- Test: `apps/web/src/lib/lunar-calendar.test.ts`

**Interfaces:**
- Consumes: Task 2 (`moonMonth`, `MoonMonth`, `daysInMonth`); `PHASE_NAMES`, `SIGN_NAMES_LOCATIVE` из `@/lib/moon-today`; `moscowDayStart`; `MOON_PATH`.
- Produces (`lunar-calendar-paths.ts`): `export const LUNAR_CALENDAR_PATH = "/lunnyy-kalendar"`; `export const MONTH_SLUGS: readonly string[]` (12 слагов по порядку); `export function lunarMonthPath(year: number, month: number): string`; `export function parseMonthSlug(slug: string): { year: number; month: number } | null` (точное совпадение «слаг-год», год из четырёх цифр, регистр и лишнее — `null`).
- Produces (`lunar-calendar.ts`): `export function monthWindow(now: Date): { year: number; month: number }[]` — предыдущий, текущий и 13 следующих месяцев по Москве; `export function isInWindow(year: number, month: number, now: Date): boolean`; `export const MONTH_NAMES: readonly string[]` («январь» … «декабрь»); `export type MonthPage = { title: string; place: string; weeks: ({ date: string; day: number; … } | null)[][]; events: { kind: MoonEvent["kind"]; name: string; label: string }[]; signRuns: { signName: string; label: string }[]; days: DayRow[]; prev: { label: string; href: string } | null; next: { label: string; href: string } | null; months: { label: string; href: string; current: boolean }[]; faq: { question: string; answer: string }[] }` и `export function buildMonthPage(year: number, month: number, now: Date): MonthPage` (в `weeks` по 7 ячеек, пустые — `null`; ячейка несёт `snapshot` для мини-Луны, номер суток на полдень и название знака; `DayRow` — строка таблицы «день за днём»; `faq` пока строится из `MONTH_FAQ_TEMPLATES` Task 4); в `MonthPage` добавить `curve: { line: string; area: string; points: { date: string; x: number; y: number }[]; events: { kind: MoonEvent["kind"]; x: number; y: number }[] }` и `ribbon: RibbonSegment[]`; а также `export function lightCurve(days: readonly { date: string; illumination: number }[], width: number, height: number): { line: string; area: string; points: { date: string; x: number; y: number }[] }` — кривая освещённости (0 внизу, 1 вверху, `x` равномерно от 0 до `width`, одна точка на день), значения `d` линии и замкнутой области под ней; `export type RibbonSegment = { sign: SignId; signName: string; from: number; to: number; label: string }` (`from`/`to` — доли месяца от 0 до 1) и `export function ribbonSegments(signRuns: readonly SignRun[], monthStart: Date, monthEnd: Date): RibbonSegment[]`; `export function moscowDate(now: Date): string` в `lunar-calendar-paths.ts` — `YYYY-MM-DD` по Москве (безопасна для браузера: без импорта `@oracle/core/moon`).

- [ ] **Step 1: Write the failing tests**: `lunarMonthPath(2026, 12) === "/lunnyy-kalendar/dekabr-2026"`; `parseMonthSlug("dekabr-2026")` → `{ year: 2026, month: 12 }`, обратимо для всех 12 месяцев; `parseMonthSlug("Dekabr-2026")`, `"dekabr-26"`, `"dekabr-2026x"`, `"13-2026"`, `""` → `null`; `monthWindow(new Date("2026-11-17T09:00:00Z"))` — 15 месяцев от октября 2026 до декабря 2027 подряд; `isInWindow(2026, 9, now)` ложно, `(2026, 10, now)` и `(2027, 12, now)` истинны, `(2028, 1, now)` ложно; на границе суток `monthWindow(new Date("2026-11-30T21:30:00Z"))` считает текущим уже декабрь 2026 (Москва); `moscowDate(new Date("2026-11-17T21:30:00Z")) === "2026-11-18"`; `lightCurve` — число точек равно числу дней, точки стоят в серединах суточных слотов: первая `x === width / (2 * число дней)`, последняя `x === width - width / (2 * число дней)`, `y` убывает с ростом освещённости (освещённость 1 — верхний край, 0 — нижний), нет `NaN`, `line` начинается с «M»; для ноября 2026 высшая точка кривой приходится на 23–25 ноября (полнолуние 24.11), низшая — на 8–10 ноября; `ribbonSegments` — доли идут подряд без разрывов и перекрытий от 0 до 1, сумма длин равна 1 с точностью 1e-9; `buildMonthPage(2026, 11, now)`: заголовок «Лунный календарь на ноябрь 2026», 6 недель по 7 ячеек (1 ноября — воскресенье: первая неделя — шесть пустых и 1 ноября, последняя — 30 ноября и шесть пустых), ровно 30 непустых ячеек подряд; в `weeks` лежат индексы дней в `cells`, а пустые — `null`; `events` — три или четыре пункта с метками вида «9 ноября, 10:02»; `signRuns` — непрерывные промежутки; `prev` — октябрь 2026 и `next` — декабрь 2026; для крайних месяцев окна `prev` или `next` равны `null`.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/lunar-calendar.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** по сигнатурам; метки времени и дат — `Intl` по Москве; `faq` на этом шаге пустой массив (заполнит Task 4).
- [ ] **Step 4: Run** файл — PASS; `pnpm --filter @oracle/web typecheck`.
- [ ] **Step 5: Commit** `feat(web): month slugs, window and data for the lunar calendar`.

### Task 4: Вступление и вопросы с датами

**Files:**
- Create: `packages/content/src/moon-calendar.ts`
- Test: `packages/content/src/moon-calendar.test.ts`
- Modify: `packages/content/package.json` (экспорт `./moon-calendar`), `apps/web/src/lib/lunar-calendar.ts` (подключить `faq`)

**Interfaces:**
- Consumes: `FORBIDDEN_MOON_WORDS`, `findViolations` из `./moon`.
- Produces: `export const MOON_CALENDAR_TEXTS_ACCEPTED = false`; `export const MONTH_INTRO: string` (2–3 предложения, одинаковое для всех месяцев, без оценок); `export type FaqTemplate = { question: (month: string, year: number) => string; answer: (facts: MonthFacts) => string }`; `export type MonthFacts = { month: string; year: number; events: Record<"new" | "firstQuarter" | "full" | "lastQuarter", string[]> }` (метки событий в порядке месяца, у «двух полнолуний» — две метки); `export const MONTH_FAQ_TEMPLATES: readonly FaqTemplate[]` — вопросы: «Когда новолуние в <месяц> <год>?», «Когда полнолуние в <месяц> <год>?», «Какие фазы Луны в <месяц> <год>?», «Как читать лунный календарь?»; `export function checkMoonCalendarTexts(): string[]`; `export function monthIntro(): string | undefined` — `undefined`, пока тексты не приняты.

- [ ] **Step 1: Write the failing tests**: четыре шаблона; ответ на «полнолуние» при двух событиях называет обе даты, при одном — одну; при отсутствии события ответ честно сообщает, что в этом месяце его нет (без выдумывания даты); каждый ответ не короче 15 слов; `checkMoonCalendarTexts()` возвращает `[]`; ни `MONTH_INTRO`, ни ответы на примере (`MonthFacts` ноября 2026) не содержат слов из `FORBIDDEN_MOON_WORDS`; `findViolations` ловит нарушение на искусственном ответе; при `MOON_CALENDAR_TEXTS_ACCEPTED === false` `monthIntro()` — `undefined`.
- [ ] **Step 2: Run** `pnpm vitest run packages/content/src/moon-calendar.test.ts` — FAIL.
- [ ] **Step 3: Implement**; вступление и шаблоны — черновики для владелицы (так и сказать в комментарии файла); подключить `faq` в `buildMonthPage` (вопросы показываются, когда `MOON_CALENDAR_TEXTS_ACCEPTED` истинно, иначе `faq: []`; FAQ-разметка JSON-LD тоже только при принятых текстах).
- [ ] **Step 4: Run** `pnpm vitest run packages/content/src/moon-calendar.test.ts apps/web/src/lib/lunar-calendar.test.ts` — PASS; `pnpm --filter @oracle/content typecheck` и `pnpm --filter @oracle/web typecheck`.
- [ ] **Step 5: Commit** `feat(content): draft intro and dated FAQ for the lunar calendar`.

### Task 5: Интерактивная часть — `MoonMonthExplorer`

**Files:**
- Create: `apps/web/src/components/moon/AnimatedDisc.tsx` (вынести из `MoonExplorer.tsx` без изменения поведения), `apps/web/src/components/moon/MoonMonthExplorer.tsx`
- Modify: `apps/web/src/components/moon/MoonExplorer.tsx` (импортировать `AnimatedDisc` из нового файла)
- Test: `apps/web/src/components/moon/MoonMonthExplorer.test.tsx`

**Interfaces:**
- Consumes: Task 3 (`moscowDate`); `MoonDisc`; `PhaseId`, `PHASES` — только из `@oracle/core/moon/visual`.
- Produces: `export function AnimatedDisc(props: { view: MoonView; animateIntro: boolean }): JSX.Element` и тип `MoonView` (как сейчас в `MoonExplorer.tsx`; если тип нужен обоим файлам, перенести его в `AnimatedDisc.tsx` и реэкспортировать). Новое:
  - `export type ExplorerDay = { date: string; day: number; label: string; phase: PhaseId; phaseName: string; illumination: number; waxing: boolean; lunarNumber: number; lunarChange: string | null; signName: string; riseSet: string }`
  - `export type ExplorerEvent = { kind: "new" | "firstQuarter" | "full" | "lastQuarter"; name: string; label: string; dayIndex: number }`
  - `export function MoonMonthExplorer(props: { weeks: (number | null)[][]; days: readonly ExplorerDay[]; events: readonly ExplorerEvent[]; initialIndex: number }): JSX.Element` — `weeks` содержит индексы дней в `days` и `null` для пустых ячеек.
- Разметка («крючки»): корень `div.moon-month__explorer`; `aside.moon-month__panel` с `figure.moon-disc[data-phase][data-waxing]` (большая Луна через `AnimatedDisc`, `figcaption#moon-month-selected.moon-disc__caption[aria-live="polite"]`) и `dl.moon-month__details` (Лунные сутки, Знак Луны, Восход и заход); `section.moon-month__events` → `ul` из `li > button.moon-event[data-kind]` (`.moon-event__name`, `.moon-event__time`); `section.moon-month__calendar` → `table.moon-month__grid` (`caption`, `thead`, `tbody`) с `td.moon-month__cell[data-date][data-phase][data-weekday]` и `style="--lit: <0…1>; --i: <порядок>"`, внутри `button.moon-month__pick[aria-pressed][aria-label]` (`.moon-month__date`, `svg.moon-mini`, `.moon-month__lunar`, `.moon-month__sign`); пустые — `td.moon-month__cell.is-empty`; сегодняшняя — `.is-today` и `aria-current="date"` (ставится после монтирования).

- [ ] **Step 1: Write the failing tests** (`renderToStaticMarkup`, пример — 30 дней ноября 2026 с событиями): в таблице 7 `th`; ячеек с `data-date` ровно 30, пустых `is-empty` — 12 (шесть перед 1 ноября и шесть после 30 ноября), всего 42 ячейки в 6 рядах; у каждой непустой ячейки `button.moon-month__pick` с `aria-label` вида «17 ноября: Первая четверть, освещено 49 %», `aria-pressed="true"` только у выбранного (`initialIndex`), у остальных `"false"`; `--lit` в стиле каждой ячейки между 0 и 1; ровно у одной кнопки `tabindex="0"` (у остальных `-1`); в панели подпись выбранного дня и `dl` с тремя строками; кнопок `button.moon-event` столько, сколько событий, с `data-kind`; нет слов из `FORBIDDEN_MOON_WORDS`. Отдельно: страница «Луна сегодня» (`MoonExplorer`) рендерится как прежде, её тесты зелёные.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/components/moon/MoonMonthExplorer.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement**: состояние `selected`; выбор по наведению мыши (`onPointerEnter` только при `pointerType === "mouse"`), по фокусу, по нажатию и по кнопкам событий; стрелки ←/→ (±1 день), ↑/↓ (±7 дней), Home/End (первый и последний день) с переносом фокуса; одна точка входа по Tab (`tabIndex` 0 у выбранного, −1 у остальных); `useEffect` после монтирования ищет `moscowDate(new Date())` среди `days` и, если нашёл, помечает ячейку `.is-today` и `aria-current="date"` и выбирает этот день (плавный переход Луны через `AnimatedDisc`), иначе оставляет `initialIndex`; `animateIntro` у большой Луны истинно, пока человек ничего не выбрал.
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src/components/moon apps/web/src/app/luna-segodnya` и `pnpm --filter @oracle/web typecheck` — PASS.
- [ ] **Step 5: Commit** `feat(web): interactive Moon month explorer`.

### Task 6: Страницы месяца, кривая света, лента знаков, каркас стилей

**Files:**
- Create: `apps/web/src/app/lunnyy-kalendar/page.tsx` (редирект), `apps/web/src/app/lunnyy-kalendar/[month]/page.tsx`, `apps/web/src/components/moon/MoonLightCurve.tsx`, `apps/web/src/components/moon/MoonSignRibbon.tsx`, `apps/web/src/components/moon/MoonMonthDays.tsx`, `apps/web/src/components/moon/MoonTodayMark.tsx`
- Test: `apps/web/src/app/lunnyy-kalendar/page.test.tsx`, `apps/web/src/app/lunnyy-kalendar/[month]/page.test.tsx`, `apps/web/src/components/moon/MoonLightCurve.test.tsx`
- Modify: `apps/web/src/app/globals.css` (каркас в конце файла под комментарием «Лунный календарь: каркас, оформление — Codex»)

**Interfaces:**
- Consumes: Task 3 (`buildMonthPage`, `isInWindow`, `monthWindow`, `parseMonthSlug`, `lunarMonthPath`, `moscowDate`, `lightCurve`, `ribbonSegments`), Task 4 (`monthIntro`), Task 5 (`MoonMonthExplorer`, `ExplorerDay`, `ExplorerEvent`), `publicMetadata`, `jsonLdScript`, `DISCLAIMER`, `SITE_URL`.
- Produces: страница месяца (`default export`, `metadata`/`generateMetadata`, `generateStaticParams` — окно месяцев на момент сборки); `MoonLightCurve(props: { curve: MonthPage["curve"]; width: number; height: number })` — серверный SVG; `MoonSignRibbon(props: { segments: RibbonSegment[] })`; `MoonMonthDays(props: { rows: DayRow[] })`; `MoonTodayMark` — клиентский компонент без разметки: после монтирования выставляет на ближайший корень `.moon-month` CSS-переменную `--today` (доля месяца 0…1 по сегодняшнему моменту по Москве; если сегодня вне этого месяца — не ставит) и атрибут `data-has-today="true"`.
- Разметка («крючки» для Codex; имена менять нельзя без правки ТЗ): `main.moon-month` → `nav.moon-breadcrumb`; `header.moon-month__head` (`h1`, `p.moon-hero__place`, `p.moon-month__intro` — только при принятых текстах); `nav.moon-month__nav[aria-label="Месяцы"]` (`a.moon-month__prev`, `a.moon-month__next`, `ul.moon-month__list` с `a[aria-current="page"]` у месяца страницы); `figure.moon-curve` → `svg.moon-curve__svg[data-width][data-height]` (размеры `viewBox`, чтобы оформление могло ставить отметку «сейчас» как `translateX(calc(var(--today) * <data-width>px))`; `line.moon-curve__now` рисуется в `x = 0`) (`path.moon-curve__area`, `path.moon-curve__line[pathLength="1"]`, `g.moon-curve__events` из `.moon-curve__event[data-kind]`, `line.moon-curve__now`) и `figcaption`; затем интерактивная часть Task 5; `section.moon-ribbon` → `ol.moon-ribbon__list` из `li.moon-ribbon__seg` (`style="--from: <доля>; --to: <доля>"`, внутри `.moon-ribbon__sign` и `.moon-ribbon__time`) и `span.moon-ribbon__now`; `section.moon-signs` с тем же списком текстом `ol > li.moon-sign-run` (для скринридеров и поиска); `section.moon-days` → `table.moon-days__table` (колонки: Дата, Фаза, Лунные сутки, Знак Луны, Восход и заход; строка `tr.moon-days__row[data-date]`); `section.moon-faq` (только при принятых текстах); `section.moon-links`; `p.moon-disclaimer`.
- `/lunnyy-kalendar` (`page.tsx`): вызывает `redirect(lunarMonthPath(текущий год и месяц по Москве))`.

- [ ] **Step 1: Write the failing tests**: страница `noyabr-2026` (время зафиксировано `vi.setSystemTime` на 17.11.2026): один `h1` «Лунный календарь на ноябрь 2026», подпись «По Москве», сетка из Task 5 (7 `th`, 30 ячеек с датой), `figure.moon-curve` с `path.moon-curve__line` и 4–5 `.moon-curve__event`, `ol.moon-ribbon__list` с сегментами, у которых `--from` и `--to` идут подряд, `table.moon-days__table` с 30 строками, переключатель с ссылками на октябрь и декабрь 2026, JSON-LD с BreadcrumbList (FAQPage — только при принятых текстах), канонический адрес `/lunnyy-kalendar/noyabr-2026`, title с суффиксом «— Твой оракул» не длиннее 60 знаков, description 90–175 знаков, нет слов из `FORBIDDEN_MOON_WORDS` в видимом тексте, есть дисклеймер; слаг вне окна, `Noyabr-2026`, `noyabr-26` — `notFound()` (тест ловит бросок `NEXT_NOT_FOUND`); `generateStaticParams` возвращает 15 слагов окна; `page.tsx` редиректа вызывает `redirect` на адрес текущего месяца (мок `next/navigation`); `MoonLightCurve` для 30 дней рисует линию без `NaN`; `MoonTodayMark` рендерится без разметки.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/app/lunnyy-kalendar apps/web/src/components/moon/MoonLightCurve.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement** страницы, компоненты и каркас стилей (сетка 7 колонок во всю ширину, мини-Луна 28–32 px; на телефоне ячейка с датой, Луной и номером суток; большая Луна над сеткой на телефоне и сбоку на широком экране; кривая и лента — простые тонкие линии; таблица подробностей на узком экране может прокручиваться внутри блока, страница — нет). Режим сборки: прочитать документацию Next и записать выбор комментарием; страница отдаётся с готовой разметкой.
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src/app/lunnyy-kalendar apps/web/src/components/moon apps/web/src/lib/lunar-calendar.test.ts` и `pnpm --filter @oracle/web typecheck` — PASS.
- [ ] **Step 5: Commit** `feat(web): lunar calendar month pages`.

### Task 7: Подключение к сайту

**Files:**
- Modify: `apps/web/src/lib/seo.ts` (месяцы окна в `PUBLIC_PATHS`), `apps/web/src/app/sitemap.ts`, `apps/web/src/components/Footer.tsx` (ссылка «Лунный календарь» на `/lunnyy-kalendar`), страница `/luna-segodnya` (ссылка «Лунный календарь на месяц» на текущий месяц, в блоке «Продолжить»), `AGENTS.md` (строка про календарь)
- Test: `apps/web/src/app/sitemap.test.ts`, `apps/web/src/components/Footer.test.tsx`, `apps/web/src/app/luna-segodnya/page.test.tsx`, `e2e/lunar-calendar.spec.ts`

**Interfaces:**
- Consumes: Task 3 (`monthWindow`, `lunarMonthPath`, `LUNAR_CALENDAR_PATH`).
- Produces: страницы месяцев в карте сайта (приоритет 0,6; хаб-редирект в карту не входит).

- [ ] **Step 1: Write the failing tests**: `sitemap.test.ts` — все 15 адресов окна есть, `/lunnyy-kalendar` (хаб) отсутствует, приоритет месяцев 0,6; тест подвала — ссылка «Лунный календарь» ведёт на `/lunnyy-kalendar`; `luna-segodnya/page.test.tsx` — ссылка на страницу текущего месяца с именем «Лунный календарь на месяц»; `e2e/lunar-calendar.spec.ts` — страница `/lunnyy-kalendar/noyabr-2026` открывается, один `h1`, в сетке 30 кнопок-дней, «Ключевые даты» не пусты; нажатие на день 24 ноября меняет подпись большой Луны (`#moon-month-selected` содержит «Полнолуние»), клавиша → переводит выбор на следующий день (подпись меняется), нажатие на событие переводит Луну на дату события; переключатель на следующий месяц переходит на `/lunnyy-kalendar/dekabr-2026`; `/lunnyy-kalendar` приводит на страницу текущего месяца; нет горизонтальной прокрутки на 375 px; при `reducedMotion: "reduce"` страница рабочая и подпись меняется сразу.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/app/sitemap.test.ts apps/web/src/components/Footer.test.tsx apps/web/src/app/luna-segodnya` — Expected: FAIL.
- [ ] **Step 3: Implement** правки; в `AGENTS.md` — строка: где расчёт, данные, страницы, тексты, эффекты и ТЗ; отметить окно месяцев и что тексты скрыты до приёмки.
- [ ] **Step 4: Run** те же юнит-тесты, полный `pnpm typecheck` и `pnpm test`; затем (с `dev:db` и `dev:web`) `pnpm test:e2e e2e/lunar-calendar.spec.ts e2e/moon.spec.ts e2e/first-screen.spec.ts` — PASS.
- [ ] **Step 5: Commit** `feat(web): link the lunar calendar from the sitemap, footer and Moon page`.

### Task 8: Оформление и эффекты — Codex и PR

**Files:** `apps/web/src/app/globals.css` (только раздел «Лунный календарь — оформление» в конце файла; каркас Claude заменить)

**Interfaces:**
- Consumes: ТЗ `docs/design/codex-brief-lunar-calendar.md` и крючки Tasks 5–6.
- Produces: готовый вид и эффекты; тесты Tasks 5–7 остаются зелёными.

- [ ] **Step 1: Передать** Codex ТЗ и ветку `feat/web-lunar-calendar` (после Task 7, запушенную).
- [ ] **Step 2: Codex делает** оформление и эффекты и пушит коммитом `style(web): finish the lunar calendar`.
- [ ] **Step 3: Run** `pnpm typecheck`, `pnpm test`, `pnpm test:e2e e2e/lunar-calendar.spec.ts e2e/moon.spec.ts e2e/first-screen.spec.ts` — PASS; просмотр в браузере: десктоп и 390 px, обычный режим и «меньше движения»; проверить, что наведение на день плавно меняет большую Луну.
- [ ] **Step 4: Open PR** в `master`: что показывает страница, как считается, какие эффекты, что тексты в черновиках и скрыты, что оформление Codex. Мерж только владелица.
