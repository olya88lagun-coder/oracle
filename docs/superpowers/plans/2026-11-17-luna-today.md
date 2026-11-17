# «Луна сегодня» Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** страница `/luna-segodnya` с фазой, освещённостью, знаком Луны, лунными сутками, восходом и заходом, ближайшей сменой фазы, лентой из 14 дней и описанием дня, посчитанные по Москве.

**Architecture:** расчёт — чистые функции в `packages/core/src/moon/` (на `astronomy-engine`, без сети и браузера); тексты — в `packages/content/src/moon.ts` с флагом принятия; сборка данных страницы — `apps/web/src/lib/moon-today.ts`; разметка — серверные компоненты `components/moon/` с фиксированными классами и `data-*` («крючками»). Весь внешний вид — Codex по ТЗ `docs/design/codex-brief-luna-today.md`; Claude оставляет рабочий каркас стилей, Codex его заменяет.

**Tech Stack:** Next.js 16 (App Router, серверные компоненты), `astronomy-engine` 2.1.19 (уже в `packages/core`), vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-17-luna-today-design.md`

## Global Constraints

- Новых зависимостей, внешних скриптов, шрифтов и картинок с чужих доменов нет.
- Расчёт по Москве: широта 55.7558, долгота 37.6173, постоянный сдвиг UTC+3; даты и время выводятся через `Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", … })`, а не через часовой пояс сервера.
- Один `<h1>`: «Луна сегодня, <день месяц год>». Подпись места: «По Москве».
- Нет оценок «хороший / плохой день» и советов по стрижке, деньгам, здоровью, свиданиям, поездкам, нет «Луны без курса». Запрещённые слова в текстах: «благоприятн», «неблагоприятн», «лучше не», «подходит для», «подходящ», «стрижк», «диет», «свидани».
- Любое движение — только в `@media (prefers-reduced-motion: no-preference)`; цвета только переменными из `globals.css`.
- 375 px без горизонтальной прокрутки, текст не мельче 14 px, контраст AA, зоны нажатия не меньше 44 px.
- Страница: `publicMetadata` с каноническим адресом `/luna-segodnya`, разметка FAQPage и BreadcrumbList, страница в `PUBLIC_PATHS` и в карте сайта; тексты на русском, «вы», без обещаний.
- Новых целей Метрики и нового хранилища в браузере нет. Коммиты — conventional commits на английском.
- Next 16: API и поведение могут отличаться; перед выбором `revalidate` или `dynamic` прочитать `node_modules/next/dist/docs/` (см. `apps/web/AGENTS.md`).

## Review Focus

- Календарные сутки без восхода Луны: номер лунных суток сохраняется до следующего восхода, не растёт и не падает (Task 2, тест на синтетических восходах).
- Конец московских суток на границе UTC: `new Date("2026-11-17T21:30:00Z")` — это уже 18 ноября по Москве, заголовок и лента должны показать 18-е (Task 5).
- Лунные сутки 30 и новолуние: номер никогда не больше 30 и после нового месяца начинается с 1 (Task 2).
- Новолуние и полнолуние: освещённость 0 и 1, пути диска без `NaN` и пустого `d` там, где нужен полный круг (Task 3).
- Тексты не приняты: страница не показывает блок описаний и пустых заглушек; приняты — показывает, и ни в одном нет запрещённых слов (Tasks 4 и 6).
- Страница, собранная до 59 минут назад: подписи «сегодня в 14:48» при `revalidate` раз в час могут слегка устареть; допустимо, но время события всегда с датой, если оно не сегодня (Task 5).

---

### Task 1: Расчёт Луны — фаза, знак, смены фаз

**Files:**
- Create: `packages/core/src/moon/phase.ts`, `packages/core/src/moon/index.ts`
- Test: `packages/core/src/moon/phase.test.ts`
- Modify: `packages/core/package.json` (в `exports` добавить `"./moon": "./src/moon/index.ts"` рядом с `"./natal"`)

**Interfaces:**
- Consumes: `Astronomy.MoonPhase`, `Astronomy.Illumination`, `Astronomy.SearchMoonQuarter`, `Astronomy.NextMoonQuarter`, `Astronomy.MakeTime` из `astronomy-engine`; `eclipticLongitude("moon", date)` из `../natal/bodies`; `signOf`, `SignId` из `../natal/zodiac`.
- Produces:
  - `export type PhaseId = "new" | "waxingCrescent" | "firstQuarter" | "waxingGibbous" | "full" | "waningGibbous" | "lastQuarter" | "waningCrescent"`
  - `export const PHASES: readonly PhaseId[]` (в этом порядке, с шагом 45° центрами 0°, 45°, …)
  - `export function phaseOf(angle: number): PhaseId` — сектор 45° с центром на каждой фазе (новолуние `[337.5, 360) ∪ [0, 22.5)`)
  - `export type MoonSnapshot = { at: Date; angle: number; illumination: number; waxing: boolean; phase: PhaseId; sign: SignId; signDegree: number }`
  - `export function moonSnapshot(at: Date): MoonSnapshot` (`angle` — `MoonPhase`, 0 = новолуние; `waxing` = `angle < 180`)
  - `export type MoonEvent = { kind: "new" | "firstQuarter" | "full" | "lastQuarter"; at: Date }`
  - `export function nextMoonEvent(from: Date): MoonEvent` — ближайшая четверть или новолуние/полнолуние строго после `from`
  - `export function previousNewMoon(at: Date): Date` — последнее новолуние не позже `at`

- [ ] **Step 1: Write the failing tests** в `phase.test.ts`: `phaseOf(0)`, `phaseOf(359)`, `phaseOf(22.4)` → `"new"`; `phaseOf(22.5)` → `"waxingCrescent"`; `phaseOf(90)` → `"firstQuarter"`; `phaseOf(180)` → `"full"`; `phaseOf(270)` → `"lastQuarter"`. `moonSnapshot` в момент новолуния (`Astronomy.SearchMoonPhase(0, new Date("2026-11-01T00:00:00Z"), 40)`) — `illumination < 0.01`; в момент полнолуния (`SearchMoonPhase(180, …)`) — `> 0.99`; `waxing` истинно в момент первой четверти минус 1 день и ложно в момент последней четверти минус 1 день; `sign` равен `signOf(eclipticLongitude("moon", at)).sign`; `nextMoonEvent(d).at > d`, и четыре подряд события идут в порядке `new → firstQuarter → full → lastQuarter` по `kind` (циклически); `previousNewMoon(at) <= at` и разница с `at` меньше 30 суток. **Эталон:** взять из открытого источника (NASA SKYCAL или timeanddate) время ближайшего к 17.11.2026 полнолуния и первой четверти и сверить с точностью ±2 минуты; источник записать комментарием в тесте (значения не выдумывать).
- [ ] **Step 2: Run** `pnpm vitest run packages/core/src/moon/phase.test.ts` — Expected: FAIL «Cannot find module».
- [ ] **Step 3: Implement** файлы по сигнатурам выше; `index.ts` реэкспортирует всё из `phase.ts` (и позже из остальных файлов).
- [ ] **Step 4: Run** тот же файл — Expected: PASS; затем `pnpm --filter @oracle/core typecheck`.
- [ ] **Step 5: Commit** `feat(core): moon phase, sign and phase events`.

### Task 2: Восход, заход Луны и лунные сутки по Москве

**Files:**
- Create: `packages/core/src/moon/day.ts`
- Test: `packages/core/src/moon/day.test.ts`
- Modify: `packages/core/src/moon/index.ts`

**Interfaces:**
- Consumes: Task 1 (`previousNewMoon`); `Astronomy.SearchRiseSet(Body.Moon, observer, ±1, start, limitDays)`, `Astronomy.Observer`.
- Produces:
  - `export const MOSCOW = { latitude: 55.7558, longitude: 37.6173, utcOffsetMinutes: 180 } as const`
  - `export function moonRises(from: Date, limitDays: number, place?: typeof MOSCOW): Date[]` — все восходы Луны с `from` на `limitDays` суток вперёд, по возрастанию
  - `export function moonSets(from: Date, limitDays: number, place?: typeof MOSCOW): Date[]`
  - `export type LunarDay = { number: number; startsAt: Date; endsAt: Date }`
  - `export function lunarDayFromRises(at: Date, newMoon: Date, rises: readonly Date[]): LunarDay` — чистая функция: первые сутки начинаются с первого восхода после `newMoon`, каждый следующий восход начинает следующие сутки, `number` не больше 30; `startsAt` — восход, начавший текущие сутки, `endsAt` — следующий восход; если `at` раньше первого восхода после новолуния, это 30-е сутки прежнего месяца
  - `export function lunarDay(at: Date, place?: typeof MOSCOW): LunarDay` — собирает `previousNewMoon`, восходы за ~32 суток и вызывает `lunarDayFromRises`
  - `export function moscowDayStart(at: Date): Date` — начало московских суток (UTC, 00:00 по Москве)

- [ ] **Step 1: Write the failing tests** в `day.test.ts`: (a) `lunarDayFromRises` на синтетических данных: новолуние `T0`, восходы каждые 24 ч 50 мин → в момент через 12 ч после третьего восхода `number === 3`; на `at` до первого восхода — 30; два восхода подряд с интервалом 49 ч (пропущенные календарные сутки) номер растёт ровно на 1, а не на 2; 35 восходов подряд — `number` никогда не больше 30. (b) Интеграция по Москве на 17 ноября 2026: восход Луны (`moonRises(moscowDayStart(…), 1)`) в 13:53 по Москве ±3 минуты (сверка по независимому источнику: страница arcanika.com/ru/luna-segodnya на 17.11.2026 показывает «восход 13:53, с 13:53 9-е сутки»); `lunarDay` в 12:00 по Москве — 8, в 15:00 — 9. (c) `moscowDayStart(new Date("2026-11-17T21:30:00Z"))` равен `2026-11-17T21:00:00Z` (это уже 18 ноября по Москве). (d) `moonSets` возвращает заход позже ближайшего восхода хотя бы для одного дня.
- [ ] **Step 2: Run** `pnpm vitest run packages/core/src/moon/day.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** по сигнатурам; `moonRises`/`moonSets` — цикл `SearchRiseSet` с продвижением старта на секунду после найденного события, остановка при `null` или выходе за предел.
- [ ] **Step 4: Run** файл — Expected: PASS; затем `pnpm --filter @oracle/core typecheck`.
- [ ] **Step 5: Commit** `feat(core): moonrise, moonset and lunar day for Moscow`.

### Task 3: Геометрия диска Луны

**Files:**
- Create: `packages/core/src/moon/disc.ts`
- Test: `packages/core/src/moon/disc.test.ts`
- Modify: `packages/core/src/moon/index.ts`

**Interfaces:**
- Produces:
  - `export function discEquatorSpan(illumination: number, waxing: boolean, radius: number): { from: number; to: number }` — освещённая часть вдоль экватора диска в координатах с центром (0, 0): растущая Луна освещена справа
  - `export function discLitPath(illumination: number, waxing: boolean, radius: number): string` — значение атрибута `d` для освещённой части в координатах с центром (0, 0); пустая строка при освещённости 0

- [ ] **Step 1: Write the failing tests**: `discEquatorSpan(0.5, true, 100)` → `{ from: 0, to: 100 }`; `(0.5, false, 100)` → `{ from: -100, to: 0 }`; `(1, true, 100)` → `{ from: -100, to: 100 }`; `(0, true, 100)` → `from === to`; `discLitPath(0, true, 100) === ""`; `discLitPath(1, true, 100)` непустой и без `NaN`; для освещённостей 0.01, 0.25, 0.5, 0.75, 0.99 в обоих направлениях путь начинается с «M», содержит дугу «A» и не содержит «NaN».
- [ ] **Step 2: Run** `pnpm vitest run packages/core/src/moon/disc.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement**: терминатор — полуэллипс с горизонтальной полуосью `|1 − 2f|·r` (выпуклый в сторону неосвещённой части при f < 0,5 и в сторону освещённой при f > 0,5); освещённая часть — дуга лимба плюс дуга терминатора.
- [ ] **Step 4: Run** файл — PASS; `pnpm --filter @oracle/core typecheck`.
- [ ] **Step 5: Commit** `feat(core): Moon disc geometry`.

### Task 4: Тексты и проверки

**Files:**
- Create: `packages/content/src/moon.ts`
- Test: `packages/content/src/moon.test.ts`
- Modify: `packages/content/package.json` (экспорт `./moon` по образцу `./numerology`), при необходимости `packages/content/src/index.ts`

**Interfaces:**
- Consumes: `PhaseId` из `@oracle/core/moon` (тип).
- Produces:
  - `export const MOON_TEXTS_ACCEPTED = false` — пока владелица не приняла тексты
  - `export type LunarDayText = { day: number; symbol: string; text: string; question: string }` и `export const LUNAR_DAY_TEXTS: readonly LunarDayText[]` — ровно 30, `day` от 1 до 30
  - `export type PhaseText = { phase: PhaseId; title: string; text: string; question: string }` и `export const PHASE_TEXTS: readonly PhaseText[]` — ровно 8
  - `export const FORBIDDEN_MOON_WORDS: readonly string[]` — из Global Constraints
  - `export function checkMoonTexts(): string[]` — список нарушений (пустой — всё в порядке)
  - `export function lunarDayText(day: number): LunarDayText | undefined`, `export function phaseText(phase: PhaseId): PhaseText | undefined` — возвращают `undefined`, пока `MOON_TEXTS_ACCEPTED` ложно

- [ ] **Step 1: Write the failing tests** в `moon.test.ts`: `LUNAR_DAY_TEXTS` — 30 записей с `day` 1…30 без повторов; `PHASE_TEXTS` — 8 записей, по одной на каждую из `PHASES`; у каждой записи непустые поля, `text` от 25 до 90 слов, `question` оканчивается на «?»; `checkMoonTexts()` возвращает `[]`; ни одно поле не содержит слов из `FORBIDDEN_MOON_WORDS` (регистр не важен); `checkMoonTexts` ловит нарушение на искусственной записи (передать через внутреннюю функцию `findViolations(texts)`, экспортируемую для теста); при `MOON_TEXTS_ACCEPTED === false` `lunarDayText(8)` и `phaseText("full")` — `undefined`.
- [ ] **Step 2: Run** `pnpm vitest run packages/content/src/moon.test.ts` — Expected: FAIL.
- [ ] **Step 3: Write** 30 описаний лунных суток (символ, тема, вопрос для себя) и 8 описаний фаз: нейтральный язык описания, без предсказаний и советов по телу, деньгам, свиданиям. Это черновики для вычитки владелицей; в комментарии файла так и сказано. Реализовать функции по сигнатурам.
- [ ] **Step 4: Run** файл — PASS; `pnpm --filter @oracle/content typecheck`; `pnpm content:build` не нужен (тексты в TypeScript).
- [ ] **Step 5: Commit** `feat(content): draft texts for lunar days and phases`.

### Task 5: Данные страницы

**Files:**
- Create: `apps/web/src/lib/moon-today.ts`
- Test: `apps/web/src/lib/moon-today.test.ts`

**Interfaces:**
- Consumes: Tasks 1–4 (`moonSnapshot`, `nextMoonEvent`, `lunarDay`, `moonRises`, `moonSets`, `moscowDayStart`, `MOSCOW`, `PHASES`, `lunarDayText`, `phaseText`); `NATAL_KEY_SUMMARIES`, `natalPagePath` (уже есть: `NATAL_KEY_SUMMARIES["moon-<sign>"]` даёт `{ slug, summary }`); `TARO_DAY_PATH`, `NATAL_PATH`.
- Produces:
  - `export const MOON_PATH = "/luna-segodnya"`
  - `export type MoonDayCell = { date: string; label: string; isToday: boolean; snapshot: MoonSnapshot }` (`date` — `YYYY-MM-DD` по Москве; снимок на 12:00 по Москве)
  - `export type MoonToday = { dateLabel: string; snapshot: MoonSnapshot; phaseName: string; signName: string; signSummary: { text: string; href: string } | null; lunarDay: { number: number; startsLabel: string; endsLabel: string }; rise: string | null; set: string | null; next: { kind: MoonEvent["kind"]; label: string }; strip: MoonDayCell[]; texts: { phase: PhaseText | null; day: LunarDayText | null }; links: { cardOfDay: string; natal: string } }`
  - `export function buildMoonToday(now: Date): MoonToday`
  - `export const PHASE_NAMES: Record<PhaseId, string>` («Новолуние», «Растущий серп», «Первая четверть», «Растущая Луна», «Полнолуние», «Убывающая Луна», «Последняя четверть», «Убывающий серп») и `SIGN_NAMES_LOCATIVE: Record<SignId, string>` («в Овне», «в Тельце», …)
  - `export const MOON_FAQ: readonly { question: string; answer: string }[]` — минимум 4 вопроса: что такое лунные сутки, чем они отличаются от фазы, почему по Москве, как считается

- [ ] **Step 1: Write the failing tests**: на `buildMoonToday(new Date("2026-11-17T09:00:00Z"))` (12:00 по Москве) — `dateLabel === "17 ноября 2026"`, лента из 14 ячеек, первая — сегодняшняя (`isToday`), подряд идущие даты; `signSummary.href` начинается с `/natalnaya-karta/luna-v-` и `signSummary.text` непустой; `links.cardOfDay === "/taro/karta-dnya"`; `next.label` содержит название следующего события и дату; при `MOON_TEXTS_ACCEPTED === false` оба поля `texts` — `null`; `buildMoonToday(new Date("2026-11-17T21:30:00Z")).dateLabel === "18 ноября 2026"` (граница по Москве); `MOON_FAQ` не содержит запрещённых слов и в каждом ответе не меньше 20 слов.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/moon-today.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** по сигнатурам; форматирование дат — `Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", … })`; ближайшее событие: «сегодня в 14:48» или «24 ноября, 15:53», если не сегодня.
- [ ] **Step 4: Run** файл — PASS; `pnpm --filter @oracle/web typecheck`.
- [ ] **Step 5: Commit** `feat(web): data for the Moon today page`.

### Task 6: Страница, компоненты и каркас стилей

**Files:**
- Create: `apps/web/src/app/luna-segodnya/page.tsx`, `apps/web/src/components/moon/MoonDisc.tsx`, `apps/web/src/components/moon/MoonStrip.tsx`
- Test: `apps/web/src/app/luna-segodnya/page.test.tsx`, `apps/web/src/components/moon/MoonDisc.test.tsx`
- Modify: `apps/web/src/app/globals.css` (каркас в конце файла под комментарием «Луна сегодня: каркас, оформление — Codex»)

**Interfaces:**
- Consumes: Task 5 (`buildMoonToday`, `MoonToday`, `MOON_FAQ`, `MOON_PATH`); Task 3 (`discLitPath`); Task 1 (`PHASES`, `PhaseId`); `publicMetadata`, `jsonLdScript` из `@/lib/seo`; `SITE_URL`.
- Produces: `export function MoonDisc(props: { illumination: number; waxing: boolean; phase: PhaseId; size?: "large" | "mini"; showTicks?: boolean })` — SVG; `export function MoonStrip(props: { days: readonly MoonDayCell[] })`; `export default async function Page()` (или синхронная, по результату чтения документации Next); `export const metadata`.
- Разметка и классы (крючки для Codex, имена менять нельзя без правки ТЗ): корень `main.moon-page`; `nav.moon-breadcrumb`; `header.moon-hero` с `h1`, `p.moon-hero__place`, `figure.moon-disc[data-phase][data-waxing]` (внутри `svg.moon-disc__svg` с `circle.moon-disc__base`, `path.moon-disc__lit`, `circle.moon-disc__rim`, `g.moon-disc__ticks` из восьми `.moon-disc__tick[data-phase]`, у текущей `.is-current`, и `figcaption.moon-disc__caption`); `ul.moon-tiles` из `li.moon-tile[data-kind="phase|sign|day|rise"]` с `.moon-tile__label`, `.moon-tile__value`, `.moon-tile__note`; `p.moon-next`; `section.moon-strip` с `ol.moon-strip__list > li.moon-strip__day[.is-today]`, внутри `svg.moon-mini`, `time`, `.moon-strip__phase`; `section.moon-text` (только при принятых текстах) с тремя `article.moon-text__block[data-kind="phase|day|sign"]`; `section.moon-links`; `section.moon-faq` из `details`; `p.moon-disclaimer`.

- [ ] **Step 1: Write the failing tests**: `MoonDisc.test.tsx` — при освещённости 0 путь `.moon-disc__lit` отсутствует или пуст, при 1 непуст; восемь `.moon-disc__tick`; `showTicks={false}` убирает их; `size="mini"` добавляет класс `moon-mini`. `page.test.tsx` — ровно один `<h1>`, он начинается с «Луна сегодня,»; JSON-LD с `FAQPage` и `BreadcrumbList`; канонический адрес `/luna-segodnya`; в разметке есть ссылки `/taro/karta-dnya` и `/natalnaya-karta`; при `MOON_TEXTS_ACCEPTED === false` нет `section.moon-text` и нет пустых заголовков-заглушек; в видимом тексте страницы нет слов из `FORBIDDEN_MOON_WORDS`; title с суффиксом «— Твой оракул» не длиннее 60 знаков, description 90–175 знаков.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/app/luna-segodnya apps/web/src/components/moon` — Expected: FAIL.
- [ ] **Step 3: Implement** страницу, компоненты и каркас стилей. Перед выбором `revalidate = 3600` или `dynamic = "force-dynamic"` прочитать документацию Next в `node_modules/next/dist/docs/` и записать выбор комментарием; страница должна отдаваться с готовой разметкой (видна поисковику). Дисклеймер как на других страницах (`DISCLAIMER`).
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src/app/luna-segodnya apps/web/src/components/moon` и `pnpm --filter @oracle/web typecheck` — PASS.
- [ ] **Step 5: Commit** `feat(web): Moon today page`.

### Task 7: Подключение к сайту

**Files:**
- Modify: `apps/web/src/lib/seo.ts` (добавить `MOON_PATH` в `PUBLIC_PATHS`), `apps/web/src/app/sitemap.ts` (в `PRACTICE_PATHS`), `apps/web/src/components/Footer.tsx` (отдельная ссылка «Луна сегодня», не через `SECTIONS`), страницы Таро (`/taro` и «Карта дня»: одна ссылка внизу «Луна сегодня»), `AGENTS.md` (строка о странице в таблице)
- Test: `apps/web/src/app/sitemap.test.ts`, существующий тест подвала (если есть), `e2e/moon.spec.ts`

**Interfaces:**
- Consumes: `MOON_PATH` из Task 5.
- Produces: страница в карте сайта и ссылки на неё; e2e-тест страницы.

- [ ] **Step 1: Write the failing tests**: в `sitemap.test.ts` — `/luna-segodnya` присутствует с приоритетом 0.8; тест подвала (или рендер `Footer`) — ссылка «Луна сегодня» ведёт на `/luna-segodnya`; `e2e/moon.spec.ts`: страница открывается, один `h1`, диск `figure.moon-disc` виден, в ленте 14 `li.moon-strip__day`, есть ссылка с именем «Вытянуть карту дня» на `/taro/karta-dnya`, нет горизонтальной прокрутки на 375 px, при `reducedMotion: "reduce"` страница остаётся рабочей.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/app/sitemap.test.ts` — FAIL.
- [ ] **Step 3: Implement** правки; ссылку на страницах Таро добавить так, чтобы не сдвинуть первый экран на телефоне (тест «три карты выше cookie-панели» в `e2e/first-screen.spec.ts` остаётся зелёным); строка в `AGENTS.md`: где лежат расчёт, тексты, данные, компоненты и ТЗ.
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src/app/sitemap.test.ts`, полный `pnpm typecheck` и `pnpm test`; затем (с `dev:db` и `dev:web`) `pnpm test:e2e e2e/moon.spec.ts e2e/first-screen.spec.ts` — PASS.
- [ ] **Step 5: Commit** `feat(web): link the Moon page from the sitemap, footer and Taro`.

### Task 8: Оформление — Codex и PR

**Files:** `apps/web/src/app/globals.css` (только раздел «Луна сегодня — оформление» в конце файла; каркас Claude заменить)

**Interfaces:**
- Consumes: ТЗ `docs/design/codex-brief-luna-today.md` и крючки из Task 6.
- Produces: готовый вид; тесты Tasks 6–7 остаются зелёными.

- [ ] **Step 1: Передать** Codex ТЗ и ветку `feat/web-luna-today` (после Task 7, запушенную).
- [ ] **Step 2: Codex делает** оформление и пушит коммитом `style(web): finish the Moon today page`.
- [ ] **Step 3: Run** `pnpm typecheck`, `pnpm test`, `pnpm test:e2e e2e/moon.spec.ts e2e/first-screen.spec.ts` — PASS; просмотр в браузере: десктоп и 390 px, обычный режим и «меньше движения».
- [ ] **Step 4: Open PR** в `master`: описание — что показывает страница, как считается, что тексты в черновиках и скрыты до приёмки, что оформление Codex. Мерж только владелица.
