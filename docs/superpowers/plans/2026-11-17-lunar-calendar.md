# Лунный календарь на месяц — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** страницы `/lunnyy-kalendar/<месяц>-<год>` с сеткой месяца, ключевыми датами, сменами знака Луны, таблицей «день за днём» и вопросами с настоящими датами; `/lunnyy-kalendar` ведёт на текущий месяц.

**Architecture:** расчёт месяца — чистые функции в `packages/core/src/moon/month.ts` поверх уже готовых `moonSnapshot`, `nextMoonEvent`, `moonRises`, `lunarDayFromRises`; данные страницы — `apps/web/src/lib/lunar-calendar.ts`; страница — серверные компоненты со статической сборкой (`generateStaticParams`) и суточным обновлением; отметка «сегодня» — крошечный клиентский компонент. Оформление — Codex по `docs/design/codex-brief-lunar-calendar.md`; Claude оставляет рабочий каркас стилей.

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

## Review Focus

- Событие в первые минуты 1-го числа по Москве (например 00:xx) не попадает в предыдущий месяц, а событие в конце 31-го — в следующий (Task 2).
- Месяцы 28, 29, 30 и 31 день: февраль 2027 — 28, февраль 2028 — 29; неделя начинается с понедельника, 1 ноября 2026 — воскресенье (Tasks 2, 3).
- Два полнолуния в одном месяце (май 2026: 1.05 и 31.05) и месяц, где одного из событий нет (Tasks 2, 3).
- Смена лунных суток внутри календарного дня (17.11.2026: 8-е → 9-е в 13:53) и день без восхода Луны: показывается «—», номер не прыгает (Task 2).
- Смена знака ровно у границы суток или месяца: каждая смена попадает в один месяц, промежутки знаков без разрывов и перекрытий (Tasks 1, 2).
- Слаг месяца вне окна, с неверным месяцем или годом, регистром и лишними символами: 404, а не падение (Task 3).

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
- Produces (`lunar-calendar.ts`): `export function monthWindow(now: Date): { year: number; month: number }[]` — предыдущий, текущий и 13 следующих месяцев по Москве; `export function isInWindow(year: number, month: number, now: Date): boolean`; `export const MONTH_NAMES: readonly string[]` («январь» … «декабрь»); `export type MonthPage = { title: string; place: string; weeks: ({ date: string; day: number; … } | null)[][]; events: { kind: MoonEvent["kind"]; name: string; label: string }[]; signRuns: { signName: string; label: string }[]; days: DayRow[]; prev: { label: string; href: string } | null; next: { label: string; href: string } | null; months: { label: string; href: string; current: boolean }[]; faq: { question: string; answer: string }[] }` и `export function buildMonthPage(year: number, month: number, now: Date): MonthPage` (в `weeks` по 7 ячеек, пустые — `null`; ячейка несёт `snapshot` для мини-Луны, номер суток на полдень и название знака; `DayRow` — строка таблицы «день за днём»; `faq` пока строится из `MONTH_FAQ_TEMPLATES` Task 4).

- [ ] **Step 1: Write the failing tests**: `lunarMonthPath(2026, 12) === "/lunnyy-kalendar/dekabr-2026"`; `parseMonthSlug("dekabr-2026")` → `{ year: 2026, month: 12 }`, обратимо для всех 12 месяцев; `parseMonthSlug("Dekabr-2026")`, `"dekabr-26"`, `"dekabr-2026x"`, `"13-2026"`, `""` → `null`; `monthWindow(new Date("2026-11-17T09:00:00Z"))` — 15 месяцев от октября 2026 до декабря 2027 подряд; `isInWindow(2026, 9, now)` ложно, `(2026, 10, now)` и `(2027, 12, now)` истинны, `(2028, 1, now)` ложно; на границе суток `monthWindow(new Date("2026-11-30T21:30:00Z"))` считает текущим уже декабрь 2026 (Москва); `buildMonthPage(2026, 11, now)`: заголовок «Лунный календарь на ноябрь 2026», 5 недель по 7 ячеек (1 ноября — воскресенье: первая неделя — шесть пустых и 1 ноября), ровно 30 непустых ячеек подряд; `events` — три или четыре пункта с метками вида «9 ноября, 10:02»; `signRuns` — непрерывные промежутки; `prev` — октябрь 2026 и `next` — декабрь 2026; для крайних месяцев окна `prev` или `next` равны `null`.
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

### Task 5: Страницы месяца и каркас стилей

**Files:**
- Create: `apps/web/src/app/lunnyy-kalendar/page.tsx` (редирект), `apps/web/src/app/lunnyy-kalendar/[month]/page.tsx`, `apps/web/src/components/moon/MoonMonthGrid.tsx`, `apps/web/src/components/moon/MoonMonthDays.tsx`, `apps/web/src/components/moon/MoonTodayMark.tsx`
- Test: `apps/web/src/app/lunnyy-kalendar/page.test.tsx`, `apps/web/src/app/lunnyy-kalendar/[month]/page.test.tsx`
- Modify: `apps/web/src/app/globals.css` (каркас в конце файла под комментарием «Лунный календарь: каркас, оформление — Codex»)

**Interfaces:**
- Consumes: Task 3 (`buildMonthPage`, `isInWindow`, `monthWindow`, `parseMonthSlug`, `lunarMonthPath`), Task 4 (`monthIntro`), `MoonDisc` (`size="mini"`, `animateIntro={false}`), `publicMetadata`, `jsonLdScript`, `DISCLAIMER`, `SITE_URL`.
- Produces: страница месяца (`default export` и `metadata`/`generateMetadata`, `generateStaticParams` — окно месяцев на момент сборки); `MoonTodayMark` — клиентский компонент без разметки: в `useEffect` находит в таблице ячейку с `data-date` равной сегодняшней дате по Москве и ставит ей класс `is-today` и `aria-current="date"`.
- Разметка («крючки» для Codex, имена менять нельзя без правки ТЗ): `main.moon-month` → `nav.moon-breadcrumb`; `header.moon-month__head` (`h1`, `p.moon-hero__place`, `p.moon-month__intro` — только при принятых текстах); `nav.moon-month__nav[aria-label="Месяцы"]` (`a.moon-month__prev`, `a.moon-month__next`, `ul.moon-month__list` с `a[aria-current="page"]` у текущего месяца окна страницы); `section.moon-month__events` → `ul` из `li.moon-event[data-kind]` (`.moon-event__name`, `.moon-event__time`); `section.moon-month__calendar` → `table.moon-month__grid` с `caption`, `thead` (Пн…Вс), `tbody > tr > td.moon-month__cell[data-date][data-phase][data-weekday]` (пустые — `td.moon-month__cell.is-empty`), внутри `.moon-month__date`, `svg.moon-mini` (через `MoonDisc`), `.moon-month__lunar` («9 л. с.»), `.moon-month__sign`; `section.moon-signs` → `ol` из `li.moon-sign-run`; `section.moon-days` → `table.moon-days__table` (колонки: Дата, Фаза, Лунные сутки, Знак Луны, Восход и заход; строка `tr.moon-days__row[data-date]`); `section.moon-faq` (только при принятых текстах); ссылки `section.moon-links`; `p.moon-disclaimer`.
- `/lunnyy-kalendar` (`page.tsx`): вызывает `redirect(lunarMonthPath(текущий год и месяц по Москве))`.

- [ ] **Step 1: Write the failing tests**: страница `[month]` для `noyabr-2026` (с зафиксированным временем через `vi.useFakeTimers`/`setSystemTime` на 17.11.2026): один `h1` «Лунный календарь на ноябрь 2026», подпись «По Москве», в `table.moon-month__grid` ровно 7 заголовков столбцов и 30 ячеек с `data-date`, 35 ячеек в сумме (пустые — `is-empty`), события и их метки, `ol` смен знака, `table.moon-days__table` с 30 строками, переключатель с ссылками на октябрь и декабрь 2026, JSON-LD с BreadcrumbList (FAQPage — только при принятых текстах), канонический адрес `/lunnyy-kalendar/noyabr-2026`, title с суффиксом «— Твой оракул» не длиннее 60 знаков, description 90–175 знаков, нет слов из `FORBIDDEN_MOON_WORDS` в видимом тексте, есть дисклеймер; слаг вне окна, `Noyabr-2026`, `noyabr-26` — `notFound()` (тест ловит бросок `NEXT_NOT_FOUND`); `generateStaticParams` возвращает 15 слагов окна; `page.tsx` редиректа вызывает `redirect` на адрес текущего месяца (проверить через мок `next/navigation`); `MoonTodayMark` рендерится без разметки.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/app/lunnyy-kalendar` — Expected: FAIL.
- [ ] **Step 3: Implement** страницы, компоненты и каркас стилей (сетка 7 колонок во всю ширину контента, мини-Луна 28–32 px, на телефоне ячейка с датой, Луной и номером суток; знак и подробности — в таблице «день за днём»; таблица подробностей на узком экране может прокручиваться внутри блока, страница — нет). Режим сборки: прочитать документацию Next и записать выбор комментарием; страница должна отдаваться с готовой разметкой.
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src/app/lunnyy-kalendar apps/web/src/lib/lunar-calendar.test.ts` и `pnpm --filter @oracle/web typecheck` — PASS.
- [ ] **Step 5: Commit** `feat(web): lunar calendar month pages`.

### Task 6: Подключение к сайту

**Files:**
- Modify: `apps/web/src/lib/seo.ts` (месяцы окна в `PUBLIC_PATHS`), `apps/web/src/app/sitemap.ts`, `apps/web/src/components/Footer.tsx` (ссылка «Лунный календарь» на `/lunnyy-kalendar`), страница `/luna-segodnya` (ссылка «Лунный календарь на месяц» на текущий месяц, в блоке «Продолжить»), `AGENTS.md` (строка про календарь)
- Test: `apps/web/src/app/sitemap.test.ts`, `apps/web/src/components/Footer.test.tsx`, `apps/web/src/app/luna-segodnya/page.test.tsx`, `e2e/lunar-calendar.spec.ts`

**Interfaces:**
- Consumes: Task 3 (`monthWindow`, `lunarMonthPath`, `LUNAR_CALENDAR_PATH`).
- Produces: страницы месяцев в карте сайта (приоритет 0,6, как у справочных входов; хаб-редирект в карту не входит).

- [ ] **Step 1: Write the failing tests**: `sitemap.test.ts` — все 15 адресов окна есть, `/lunnyy-kalendar` (хаб) отсутствует, приоритет месяцев 0,6; тест подвала — ссылка «Лунный календарь» ведёт на `/lunnyy-kalendar`; `luna-segodnya/page.test.tsx` — ссылка на страницу текущего месяца с именем «Лунный календарь на месяц»; `e2e/lunar-calendar.spec.ts` — страница `/lunnyy-kalendar/noyabr-2026` открывается, один `h1`, в сетке 30 ячеек с датой, «Ключевые даты» не пусты, переключатель на следующий месяц переходит на `/lunnyy-kalendar/dekabr-2026`, `/lunnyy-kalendar` приводит на страницу текущего месяца, нет горизонтальной прокрутки на 375 px, «меньше движения» не ломает страницу.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/app/sitemap.test.ts apps/web/src/components/Footer.test.tsx apps/web/src/app/luna-segodnya` — Expected: FAIL.
- [ ] **Step 3: Implement** правки; в `AGENTS.md` — строка: где расчёт, данные, страницы, тексты и ТЗ; отметить окно месяцев и что тексты скрыты до приёмки.
- [ ] **Step 4: Run** те же юнит-тесты, полный `pnpm typecheck` и `pnpm test`; затем (с `dev:db` и `dev:web`) `pnpm test:e2e e2e/lunar-calendar.spec.ts e2e/moon.spec.ts e2e/first-screen.spec.ts` — PASS.
- [ ] **Step 5: Commit** `feat(web): link the lunar calendar from the sitemap, footer and Moon page`.

### Task 7: Оформление — Codex и PR

**Files:** `apps/web/src/app/globals.css` (только раздел «Лунный календарь — оформление» в конце файла; каркас Claude заменить)

**Interfaces:**
- Consumes: ТЗ `docs/design/codex-brief-lunar-calendar.md` и крючки Task 5.
- Produces: готовый вид; тесты Tasks 5–6 остаются зелёными.

- [ ] **Step 1: Передать** Codex ТЗ и ветку `feat/web-lunar-calendar` (после Task 6, запушенную).
- [ ] **Step 2: Codex делает** оформление и пушит коммитом `style(web): finish the lunar calendar`.
- [ ] **Step 3: Run** `pnpm typecheck`, `pnpm test`, `pnpm test:e2e e2e/lunar-calendar.spec.ts e2e/moon.spec.ts e2e/first-screen.spec.ts` — PASS; просмотр в браузере: десктоп и 390 px.
- [ ] **Step 4: Open PR** в `master`: что показывает страница, как считается, что тексты в черновиках и скрыты, что оформление Codex. Мерж только владелица.
