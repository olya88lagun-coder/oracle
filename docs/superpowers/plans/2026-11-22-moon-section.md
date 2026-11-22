# Лунный раздел: лента, «Лунный альбом», плитка на главной — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Лунные страницы находятся с любой страницы сайта, а у человека есть причина вернуться завтра: привычка (заходы, гравюры, награды) живёт только в браузере.

**Architecture:** Один чистый модуль `lib/moon-visit.ts` (хранилище передаётся параметром, как в `lib/taro-day.ts`) ведёт заходы, открытые гравюры и награды; поверх него клиентский хук `useMoonVisit`. Три PR по порядку: (1) «Лунный альбом» на «Луне сегодня», (2) лента `MoonRibbon` с `GET /api/moon/today` и «Луна» в шапке, (3) плитка «Портал» на главной.

**Tech Stack:** Next.js 16 (App Router, свои правила: перед кодом прочесть `apps/web/node_modules/next/dist/docs/`), React 19, TypeScript, vitest (среда `node`: компоненты проверяются `renderToStaticMarkup`, логика — чистыми функциями), `@oracle/core/moon`, CSS в `apps/web/src/app/globals.css`.

**Spec:** `docs/superpowers/specs/2026-11-22-moon-section-design.md`. Макет: `docs/design/mockups/moon-section/moon-habit-v1.html` (картинки в нём — боевые адреса `/luna/...`).

## Global Constraints

- Слова-оценки дней запрещены: тест `FORBIDDEN_MOON_WORDS` из `@oracle/content/moon` должен проходить на всём видимом тексте новых блоков.
- Нет давления и страха пропуска: пропущенный день приглушён, слов «потеряли», «сгорит», «не упустите» нет.
- Данные привычки только в `localStorage`: `moon:seen:v1` (есть), `moon:visits:v1` (≤120 последних дат `YYYY-MM-DD` по Москве, без дублей), `moon:rewards:v1`, `moon:fresh:v1`. Ни на сервер, ни в Метрику. Новых целей Метрики нет.
- Чтение и запись хранилища в `try/catch`; при закрытом хранилище блоки работают без привычки и не падают.
- Награды за ряд: 3, 7, 14, 30 дней; выдаются навсегда.
- Цен и платных предложений в ленте, плитке и альбоме нет.
- Внешних шрифтов, CDN и скриптов нет; картинки только `/luna/...` с нашего домена; цвета только переменные `:root`.
- Движение (блик, «дыхание», бегущая точка, появление гравюры) только внутри `@media (prefers-reduced-motion: no-preference)`.
- Мобильные 375 px: без горизонтальной прокрутки страницы, текст не мельче 14 px, зоны нажатия не меньше 44 px, контраст AA, фокус с клавиатуры виден.
- Лента на телефоне не выше ~112 px; первый экран главной и «Луны сегодня» на 390×740 остаётся прежним (кнопка расчёта главной и диск выше cookie-панели).
- Шапка: восемь пунктов помещаются в 1024 px без переноса; «Блог» остаётся, подписи не меняются.
- Тексты документов (`privacy`, `oferta`, `consent`, `contacts`) не трогать.
- Коммиты: conventional commits на английском (`feat(web): …`). Мерж только владелица.
- Перед сдачей каждого PR: `pnpm typecheck` и `pnpm test`.

## Review Focus

1. Повреждённое или чужое содержимое в `moon:visits:v1`, `moon:rewards:v1`, `moon:fresh:v1` (не JSON, не массив, числа вместо дат, 10 000 записей): ждём пустое состояние, без падения. Тест на каждый `parse*`.
2. Смена суток по Москве: заход в 23:59 MSK и в 00:01 MSK — две разные даты и ряд из двух дней; UTC-границу не путать. Тест с моментами `2026-11-22T20:59:00Z` и `2026-11-22T21:01:00Z`.
3. Закрытое хранилище (Safari в приватном режиме: `getItem` и `setItem` бросают исключение): `recordVisit` возвращает состояние без заходов и без исключения. Тест с бросающим хранилищем.
4. Двойной вызов (React strict mode, две вкладки, обновление страницы): `recordVisit` за один день идемпотентна, гравюры в `fresh` не дублируются, ряд не растёт. Тест вызовом дважды подряд.
5. Даты «из будущего» в хранилище (часы сбились назад): ряд считается от сегодняшней даты, будущие даты его не продлевают и не ломают. Тест.

---

## Этап 1 (PR 1): «Лунный альбом» на «Луне сегодня»

Ветка `feat/web-moon-album` от свежего `master`.

### Task 1: модуль привычки `lib/moon-visit.ts`

**Files:**
- Create: `apps/web/src/lib/moon-visit.ts`
- Test: `apps/web/src/lib/moon-visit.test.ts`

**Interfaces:**
- Consumes: `moscowDate(now: Date): string` из `@/lib/lunar-calendar-paths`; `CollectionId`, `parseSeen`, `SEEN_KEY`, `unlock` из `@/lib/moon-collection`.
- Produces (используют задачи 2–5, 11, 15):

```ts
export const VISITS_KEY = "moon:visits:v1";
export const REWARDS_KEY = "moon:rewards:v1";
export const FRESH_KEY = "moon:fresh:v1";
export const MAX_VISITS = 120;
export const REWARD_STEPS = [3, 7, 14, 30] as const;
export type StorageLike = Pick<Storage, "getItem" | "setItem"> | null;

export const parseVisits = (raw: string | null): string[];            // валидные ISO-даты, без дублей, по возрастанию, последние MAX_VISITS
export const visitStreak = (visits: readonly string[], today: string): { current: number; best: number };
export const lastDays = (today: string, count: number): string[];     // от старой к сегодняшней, включая today
export const parseRewards = (raw: string | null): { steps: number[]; best: number };
export const parseFresh = (raw: string | null, today: string): CollectionId[]; // ids, только если date === today

export type VisitState = {
  today: string; visits: string[]; streak: { current: number; best: number };
  seen: CollectionId[]; fresh: CollectionId[]; rewards: number[]; newRewards: number[];
};
export function recordVisit(storage: StorageLike, now: Date, unlockIds: readonly CollectionId[]): VisitState; // читает, пишет, идемпотентно за сутки
export function readVisitState(storage: StorageLike, now: Date): VisitState;                                    // только чтение
```

Правила: `current` — подряд идущие дни, оканчивающиеся сегодня (если сегодня нет в списке — со вчерашнего); даты позже `today` игнорируются; `best` — самый длинный ряд среди дат ≤ `today`, сохраняется в `moon:rewards:v1` как максимум из прежнего и нового. `newRewards` — шаги из `REWARD_STEPS`, ставшие доступными при этом вызове (`best >= шаг` и шага ещё нет в `steps`). `fresh` в `moon:fresh:v1` хранится как `{ date, ids }`; новые `ids` дополняют сегодняшние без дублей, запись другого дня заменяется.

- [ ] **Step 1: Write the failing tests** в `moon-visit.test.ts` (хранилище — объект `Map`-обёртка `{ getItem, setItem }`; бросающее — методы кидают `Error`): `parseVisits drops junk, duplicates and keeps the last 120`, `visitStreak counts back from today, from yesterday when today is missing, and ignores future dates`, `lastDays returns 14 ISO dates ending today across a month boundary`, `recordVisit is idempotent within a day`, `recordVisit splits days at Moscow midnight` (моменты `2026-11-22T20:59:00Z` → `2026-11-22`, `2026-11-22T21:01:00Z` → `2026-11-23`, ряд 2), `recordVisit keeps fresh ids only for today and merges without duplicates`, `rewards are earned at 3, 7, 14, 30 and stay earned after the streak breaks`, `recordVisit survives storage that throws` (состояние пустое, исключения нет), `parse* return empty state for non-JSON, arrays of numbers and oversized input`.
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/lib/moon-visit.test.ts` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** модуль по интерфейсам выше; даты сравнивать как строки ISO (лексикографически), шаг «день назад» — по образцу `dayBefore` в `lib/moon-diary.ts`.
- [ ] **Step 4: Run** the same command — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): moon visit module — visits, streak, rewards, fresh gravures`.

### Task 2: хук `useMoonVisit`

**Files:**
- Create: `apps/web/src/components/moon/useMoonVisit.ts`

**Interfaces:**
- Consumes: `recordVisit`, `VisitState` (Task 1).
- Produces: `export function useMoonVisit(unlockIds: readonly CollectionId[]): VisitState | null` — `null` до первого эффекта и на сервере; после монтирования вызывает `recordVisit(window.localStorage, new Date(), unlockIds)` один раз и отдаёт результат. Обращение к `window.localStorage` обёрнуто в `try/catch` (при ошибке передаётся `null`).

- [ ] **Step 1:** Create `useMoonVisit.ts` (`"use client"`) as above; зависимость эффекта — строка `unlockIds.join(",")`, чтобы не срабатывать на каждый рендер.
- [ ] **Step 2:** `pnpm typecheck` — Expected: no errors. Тестов нет: логика покрыта Task 1, хук — тонкая обёртка (среда тестов `node`).
- [ ] **Step 3: Commit** `feat(web): useMoonVisit hook`.

### Task 3: «Коллекция Луны» переходит на общий модуль; «следующая гравюра»

**Files:**
- Modify: `apps/web/src/components/moon/MoonCollection.tsx:17-35` (эффект), `apps/web/src/lib/moon-collection.ts` (добавить функцию)
- Test: `apps/web/src/lib/moon-collection.test.ts`, существующий `MoonCollection`-тест страницы месяца

**Interfaces:**
- Consumes: `useMoonVisit` (Task 2), `openedBy` из `moon-collection.ts`.
- Produces: `export function nextGravure(seen: readonly CollectionId[], days: readonly { date: string; sign: SignId; phase: PhaseId }[], today: string): { id: CollectionId; date: string } | null` в `moon-collection.ts` — первый день строго после `today`, который откроет ещё не открытую гравюру (`openedBy`), иначе `null`.

- [ ] **Step 1: Write the failing test** `nextGravure returns the first later day that opens an unseen engraving, skips seen ones and returns null when nothing is left` и `nextGravure ignores today and earlier days`.
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/lib/moon-collection.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `nextGravure`; в `MoonCollection.tsx` заменить ручные `readSeen`/`unlock`/`writeSeen` на `useMoonVisit(openedBy(todayDay.sign, todayDay.phase))`, где `todayDay` — день из `days` с датой `moscowDate(new Date())` (если такого дня нет — пустой массив); `seen` и `fresh` брать из состояния хука. Вид, тексты и разметка блока не меняются.
- [ ] **Step 4: Run** `pnpm --filter @oracle/web exec vitest run src/lib/moon-collection.test.ts src/app/lunnyy-kalendar` — Expected: PASS.
- [ ] **Step 5: Commit** `refactor(web): moon collection uses the shared visit module`.

### Task 4: данные нити и бусины

**Files:**
- Create: `apps/web/src/lib/moon-thread.ts`
- Test: `apps/web/src/lib/moon-thread.test.ts`

**Interfaces:**
- Consumes: `lastDays` (Task 1); `moonSnapshot` из `@oracle/core/moon`; `PhaseId`.
- Produces:

```ts
export type ThreadDay = { date: string; phase: PhaseId };                 // собирает сервер
export type ThreadBead = ThreadDay & { lit: boolean; isToday: boolean; label: string }; // label: «9», …, «сег»
export function buildThreadDays(now: Date, count = 14): ThreadDay[];     // moonSnapshot на полдень по Москве каждого из count суток, включая сегодня
export function threadBeads(days: readonly ThreadDay[], visits: readonly string[], today: string): ThreadBead[];
```

- [ ] **Step 1: Write the failing test** `buildThreadDays returns 14 consecutive days ending today with a phase each` (даты совпадают с `lastDays`), `threadBeads lights exactly the visited days and marks today`, `threadBeads with no visits lights nothing`.
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/lib/moon-thread.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** по интерфейсам; полдень суток считать так же, как `strip` в `lib/moon-today.ts` (начало суток `moscowDayStart` + 12 часов).
- [ ] **Step 4: Run** the same command — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): moon thread data`.

### Task 5: блок `MoonAlbum` и стили

**Files:**
- Create: `apps/web/src/components/moon/MoonAlbum.tsx`, `apps/web/src/lib/moon-album-copy.ts`
- Modify: `apps/web/src/app/globals.css` (в конец: стили альбома по макету, секции `.reveal`, `.thread`, `.bead`, `.slot`, `.milestones`; префикс `.moon-album`)
- Test: `apps/web/src/components/moon/MoonAlbum.test.tsx`

**Interfaces:**
- Consumes: `useMoonVisit`, `REWARD_STEPS`, `VisitState` (Tasks 1–2); `threadBeads`, `ThreadDay` (Task 4); `nextGravure`, `CollectionId`, `openedBy` (Task 3); `CollectionItem` из `@/lib/moon-collection-items`.
- Produces: `export function MoonAlbum(props: { thread: readonly ThreadDay[]; days: readonly { date: string; sign: SignId; phase: PhaseId }[]; items: readonly CollectionItem[]; todayUnlock: readonly CollectionId[] }): JSX.Element` (клиентский); `lib/moon-album-copy.ts` — все тексты блока константами (заголовок «Лунный альбом», «Нить Луны», «Альбом», подписи наград «3 дня · золотая рамка», «7 дней · «Неделя с Луной»», «14 дней · «Лунный цикл»», «30 дней · «Полный круг»», «Это ваш первый день», «Сегодня открылась гравюра: …», «Следующая откроется …: …»).

Поведение: до эффекта (и на сервере) — `<h2>Лунный альбом</h2>`, нить из 14 приглушённых дисков по `thread`, 20 приглушённых плиток, награды пунктиром, без карточки награды. После эффекта: нить подсвечена по `visits`, плитки по `seen`, карточка `role="status"` «Сегодня открылась гравюра: <названия>» — пока `fresh` не пуст и человек её не закрыл (кнопка «Скрыть»), строка «Следующая откроется <дата>: <название>» — по `nextGravure(seen, days, today)`, `<span class="visually-hidden">` под нитью «Заходов за 14 дней: K. Подряд: N», чип «N дней подряд · лучший ряд M» (N ≥ 1). Награды из `rewards` подсвечены. Первый заход (`visits.length === 1`) — подпись «Это ваш первый день». Рамка: у плитки и диска класс `moon-album__frame--<шаг>` по максимальной полученной награде. Блик и появление гравюры — внутри `prefers-reduced-motion: no-preference`.

- [ ] **Step 1: Write the failing test** `MoonAlbum.test.tsx` (`renderToStaticMarkup`): `renders the heading, 14 thread beads and 20 album tiles before hydration`, `shows all four reward steps with their captions`, `contains none of FORBIDDEN_MOON_WORDS` (на видимом тексте), `does not render the fresh-engraving card on the server`.
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/components/moon/MoonAlbum.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement** `MoonAlbum.tsx` и `moon-album-copy.ts`, стили по макету `docs/design/mockups/moon-section/moon-habit-v1.html` (раздел «Альбом и нить»); переменные только из `:root`; на 375 px нить в два ряда по 7, альбом по 5 в ряд.
- [ ] **Step 4: Run** the same command — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): Moon album block — thread, engravings, rewards`.

### Task 6: подключить альбом на «Луне сегодня» и обновить доки

**Files:**
- Modify: `apps/web/src/app/luna-segodnya/page.tsx` (вставить блок после секции `moon-text` и до `<MoonNatalBridge from="today" …>`), `apps/web/src/app/luna-segodnya/page.test.tsx`, `AGENTS.md` (строка «Луна сегодня»: альбом, ключи хранилища)

**Interfaces:**
- Consumes: `MoonAlbum` (Task 5), `buildThreadDays` (Task 4), `collectionItems()` из `@/lib/moon-collection-items`, `openedBy` из `@/lib/moon-collection`; в странице уже есть `today.strip`, `snapshot`.

- [ ] **Step 1: Write the failing test** в `page.test.tsx`: `has the Moon album with the thread and the engraving album` (разметка содержит `<h2` «Лунный альбом», 14 элементов `moon-album__bead`, 20 `moon-album__slot`); существующий тест запрещённых слов должен продолжать проходить.
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/app/luna-segodnya` — Expected: FAIL.
- [ ] **Step 3: Implement** вставку: `<MoonAlbum thread={buildThreadDays(now)} days={today.strip.map(({ date, snapshot: s }) => ({ date, sign: s.sign, phase: s.phase }))} items={collectionItems()} todayUnlock={openedBy(snapshot.sign, snapshot.phase)} />`; `now` — тот же момент, что в `buildMoonToday`.
- [ ] **Step 4: Run** `pnpm --filter @oracle/web exec vitest run src/app/luna-segodnya src/components/moon` и `pnpm typecheck` — Expected: PASS.
- [ ] **Step 5: Verify in browser** (`.claude/launch.json` + `preview_start`, как для других страниц): диск и четыре факта остаются выше cookie-панели на 390×740; на 375 px нет горизонтальной прокрутки; после перезагрузки страницы карточка награды не дублируется, ряд не растёт.
- [ ] **Step 6: Run** `pnpm test` — Expected: all pass. **Commit** `feat(web): Moon album on the Moon today page`; открыть PR 1.

---

## Этап 2 (PR 2): лента и «Луна» в шапке

Ветка `feat/web-moon-ribbon` от `master` после мержа PR 1.

### Task 7: адреса и вкладки `lib/moon-nav.ts`

**Files:**
- Create: `apps/web/src/lib/moon-nav.ts`
- Test: `apps/web/src/lib/moon-nav.test.ts`

**Interfaces:**
- Consumes: `MOON_PATH`, `PHASES_PATH`, `DAYS_PATH` из `moon-paths.ts` / `moon-year-paths.ts`; `WEEKDAY_PATH` из `weekday-planets.ts`; `currentMonthPath(now: Date)` из `lunar-calendar-paths.ts`.
- Produces:

```ts
export type MoonTabKey = "today" | "calendar" | "phases" | "days" | "weekday";
export const MOON_TAB_LABELS: Record<MoonTabKey, string>; // «Сегодня», «Календарь», «Фазы», «Сутки», «Дни недели»
export const moonTabs = (now: Date): { key: MoonTabKey; label: string; href: string }[];
export function moonTabFor(pathname: string): MoonTabKey | null; // /luna/<вид>-<год> → "phases"; /luna/sutki и /luna/sutki/<n> → "days"; /lunnyy-kalendar[/…] → "calendar"
export function isMoonPath(pathname: string): boolean;          // префиксы /luna-segodnya, /lunnyy-kalendar, /luna, /dni-nedeli (но не /lunnyy… чужие)
```

- [ ] **Step 1: Write the failing test** `moonTabFor maps every moon route family`, `moonTabFor gives null for non-moon paths`, `isMoonPath is true for all moon routes and false for /luna-something-else and /lila`, `moonTabs gives five tabs with the current month for the calendar`.
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/lib/moon-nav.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** `/luna` совпадает только как `/luna` или `/luna/…`, не как префикс строки.
- [ ] **Step 4: Run** the same — Expected: PASS. **Step 5: Commit** `feat(web): moon section navigation helpers`.

### Task 8: данные ленты и `GET /api/moon/today`

**Files:**
- Create: `apps/web/src/lib/moon-ribbon.ts`, `apps/web/src/app/api/moon/today/route.ts`
- Test: `apps/web/src/lib/moon-ribbon.test.ts`, `apps/web/src/app/api/moon/today/route.test.ts`

**Interfaces:**
- Consumes: `buildMoonToday` (`lib/moon-today.ts`), `lunarDay` из `@oracle/core/moon`, `lunarDayText` из `@oracle/content/moon`, `phaseImage` из `@/lib/moon-images`, `SIGN_NAMES_LOCATIVE` как в `moon-today.ts`.
- Produces:

```ts
export type MoonRibbonData = {
  date: string; phase: PhaseId; phaseName: string; illumination: number; waxing: boolean;
  sign: SignId; signName: string;                       // «в Овне»
  lunarDay: { number: number; symbol: string | null; progress: number }; // progress 0..1
  discImage: string | null;                             // phaseImage(phase, 160)
};
export function moonRibbonData(now: Date): MoonRibbonData;
// GET /api/moon/today → Response.json(moonRibbonData(new Date())), заголовок Cache-Control: "public, s-maxage=300, stale-while-revalidate=300"
```

Примечание: `app/api/` в `AGENTS.md` помечен «не трогать» для визуальной задачи Codex; эта задача — функциональная и согласована в проекте, в `AGENTS.md` (Task 12) добавить строку про маршрут.

- [ ] **Step 1: Write the failing test** `moonRibbonData returns phase, sign, lunar day progress in [0,1] and an image path`, `moonRibbonData progress is 0 at the start of a lunar day and 1 at its end` (через подачу `now` равного `startsAt`/`endsAt` из `lunarDay`), `GET returns JSON with the cache header and the same shape`.
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/lib/moon-ribbon.test.ts src/app/api/moon` — Expected: FAIL.
- [ ] **Step 3: Implement** функцию и маршрут (`export const dynamic = "force-dynamic"` не нужен: ответ кешируется заголовком).
- [ ] **Step 4: Run** the same — Expected: PASS. **Step 5: Commit** `feat(web): GET /api/moon/today for the Moon ribbon`.

### Task 9: компонент `MoonRibbon` и стили

**Files:**
- Create: `apps/web/src/components/moon/MoonRibbon.tsx`, `apps/web/src/lib/moon-ribbon-copy.ts`
- Modify: `apps/web/src/app/globals.css` (конец: `.moon-ribbon*` по макету, включая два ряда на телефоне)
- Test: `apps/web/src/components/moon/MoonRibbon.test.tsx`

**Interfaces:**
- Consumes: `moonTabs`, `MoonTabKey` (Task 7); `MoonRibbonData` (Task 8); `useMoonVisit` (Task 2); `openedBy`; `AnimatedDisc` не нужен — диск это картинка `discImage`.
- Produces: `export function MoonRibbon(props: { current: MoonTabKey | null; now: Date; initial?: MoonRibbonData; albumHref?: string }): JSX.Element` (клиентский). `albumHref` по умолчанию `${MOON_PATH}#moon-album`.

Поведение: `<nav aria-label="Лунный раздел" class="moon-ribbon">`; вкладки — ссылки из `moonTabs(now)`, текущая с `aria-current="page"`; без `initial` после монтирования `fetch("/api/moon/today")` (ошибка и неуспешный ответ молча игнорируются: остаются только вкладки); с данными — диск (`discImage`, `aria-hidden`), кольцо прогресса суток, подписи «Растущая Луна · 89 %» и «Луна в Овне · 13-е сутки «Колесо»» (символ, если есть); как только данные есть, `useMoonVisit(openedBy(sign, phase))`, чип нити «N дней подряд» (виден при N ≥ 1) со ссылкой на `albumHref`; класс `moon-ribbon__disc--<шаг>` по максимальной награде. Телефон: две строки (диск и подпись, затем вкладки в одну строку с горизонтальной прокруткой без полосы, текущая вкладка прокручивается в видимую область), высота ≤ ~112 px.
Для `id="moon-album"` в `MoonAlbum` (Task 5) добавить якорь: поправить `MoonAlbum.tsx` (атрибут `id` у `<section>`).

- [ ] **Step 1: Write the failing test** `renders five tab links with aria-current on the current one`, `renders no current tab when current is null`, `renders the live part when initial data is given and only tabs when it is not`, `contains none of FORBIDDEN_MOON_WORDS`.
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/components/moon/MoonRibbon.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement.** Размеры и цвета — по макету (часть 1, вариант А); зоны нажатия вкладок ≥ 44 px.
- [ ] **Step 4: Run** the same — Expected: PASS. **Step 5: Commit** `feat(web): Moon ribbon component`.

### Task 10: подключить ленту на все лунные страницы

**Files:**
- Modify: `apps/web/src/app/luna-segodnya/page.tsx`, `apps/web/src/app/dni-nedeli/page.tsx`, `apps/web/src/app/lunnyy-kalendar/[month]/page.tsx`, `apps/web/src/app/luna/[slug]/page.tsx`, `apps/web/src/app/luna/sutki/page.tsx`, `apps/web/src/app/luna/sutki/[day]/page.tsx`
- Test: тесты соответствующих страниц

**Interfaces:**
- Consumes: `MoonRibbon` (Task 9), `moonTabFor` (Task 7), `moonRibbonData` (Task 8).

Лента — первый элемент внутри `<main>` каждой страницы. `current`: «Сегодня» на `/luna-segodnya`, «Календарь» на месяцах, «Фазы» на `/luna/fazy-luny` и страницах событий года, «Сутки» на `/luna/sutki`, `/luna/sutki/<n>`, «Дни недели» на `/dni-nedeli`. Динамические страницы (`luna-segodnya`, `dni-nedeli`) передают `initial={moonRibbonData(now)}`; страницы с кешем (месяц, `luna/*`) — без `initial`. Если на странице есть собственный `<nav aria-label="Хлебные крошки">`, лента стоит выше него.

- [ ] **Step 1: Write the failing tests** — в тесте каждой страницы: `has the Moon ribbon with the right current tab` (находит `aria-label="Лунный раздел"` и `aria-current="page"` на нужной вкладке).
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/app/luna-segodnya src/app/dni-nedeli src/app/lunnyy-kalendar src/app/luna` — Expected: FAIL.
- [ ] **Step 3: Implement** подключение. **Step 4: Run** the same + `pnpm typecheck` — Expected: PASS.
- [ ] **Step 5: Verify in browser:** на 375 px лента ≤ ~112 px, первый экран «Луны сегодня» (диск и четыре факта) выше cookie-панели на 390×740; без горизонтальной прокрутки; ленту видно на всех шести типах страниц. **Step 6: Commit** `feat(web): Moon ribbon on all Moon pages`.

### Task 11: «Луна» в шапке и подвале

**Files:**
- Modify: `apps/web/src/lib/sections.ts`, `apps/web/src/lib/sections.test.ts`, `apps/web/src/components/HeaderNav.tsx`, `apps/web/src/components/Footer.tsx`, `apps/web/src/components/Footer.test.tsx`, `apps/web/src/app/globals.css` (`.site-nav`, порог бургера)

**Interfaces:**
- Consumes: `isMoonPath` (Task 7), `MOON_PATH`.
- Produces: в `SECTIONS` пункт `{ href: MOON_PATH, short: "Луна", title: "Луна" }` между «Натальной картой» и «Нумерологией»; в `HeaderNav` подсветка пункта «Луна» по `isMoonPath(pathname)` (остальные — как сейчас); мини-иконка полумесяца (статичный декоративный SVG, `aria-hidden`) перед текстом «Луна» на компьютере.

- [ ] **Step 1: Write the failing tests:** `sections.test.ts` — порядок `["Матрица", "Совместимость", "Лила", "Таро", "Натальная карта", "Луна", "Нумерология", "Блог"]`, все `href` в `PUBLIC_PATHS`; `Footer.test.tsx` — «Луна сегодня» в подвале ровно один раз (список «Практики» строится из `SECTIONS`, ручная строка «Луна сегодня» остаётся, поэтому из списка из `SECTIONS` пункт «Луна» исключить фильтром рядом с фильтром «Блог»).
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/lib/sections.test.ts src/components/Footer.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement.** Затем проверить в браузере шапку на 1024 px и на 1280 px: восемь пунктов в одну строку; если не помещаются, сначала уменьшить `gap: 26px` в `.site-nav` (`globals.css:858`), затем поднять порог, с которого `.site-nav` показывается, а бургер скрыт. Подписи не менять, «Блог» не убирать.
- [ ] **Step 4: Run** `pnpm --filter @oracle/web exec vitest run src/lib/sections.test.ts src/components/Footer.test.tsx` и `pnpm typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): "Moon" in the header and footer`.

### Task 12: доки этапа 2 и проверка

**Files:**
- Modify: `AGENTS.md` (строки «Луна сегодня», «Лунный календарь на месяц», «Расписание/шапка»: лента, ключи, маршрут `GET /api/moon/today`, «Луна» в `SECTIONS`)

- [ ] **Step 1:** Обновить `AGENTS.md`. **Step 2:** `pnpm typecheck` и `pnpm test` — Expected: all pass.
- [ ] **Step 3: Verify in browser:** клик по вкладкам ленты ведёт между страницами; чип нити после второго дня показывает ряд; при остановленном API лента остаётся с вкладками.
- [ ] **Step 4: Commit** `docs: Moon ribbon and header link`; открыть PR 2.

---

## Этап 3 (PR 3): плитка «Портал» на главной

Ветка `feat/web-moon-tile` от `master` после мержа PR 2.

### Task 13: данные плитки `lib/moon-tile.ts`

**Files:**
- Create: `apps/web/src/lib/moon-tile.ts`
- Test: `apps/web/src/lib/moon-tile.test.ts`

**Interfaces:**
- Consumes: `buildMoonToday`, `PHASE_NAMES` (`lib/moon-today.ts`), `nextMoonEvent` из `@oracle/core/moon`, `phaseImage`.
- Produces:

```ts
export type MoonTileData = {
  dateLabel: string;                 // «22 ноября»
  phase: PhaseId; phaseName: string; illumination: number; // 0..1
  signName: string;                  // «в Овне»
  lunarDay: { number: number; symbol: string | null };
  until: { kind: "new" | "firstQuarter" | "full" | "lastQuarter"; days: number; label: string }; // «До полнолуния 2 дня»
  rise: string | null;
  week: { date: string; label: string; phase: PhaseId; isToday: boolean }[]; // вчера, сегодня и 4 следующих дня
  discImage: string | null;
};
export function buildMoonTile(now: Date): MoonTileData;
```

`days` — целые сутки до события по Москве (по календарным датам, не по часам); склонение «1 день», «2 дня», «5 дней» отдельной функцией `daysLabel(n)`.

- [ ] **Step 1: Write the failing test** `buildMoonTile returns six week days with today second and bigger flag`, `daysLabel declines 1, 2, 5, 11, 21`, `until counts calendar days to the next event in Moscow`.
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/lib/moon-tile.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** **Step 4: Run** the same — Expected: PASS. **Step 5: Commit** `feat(web): Moon tile data`.

### Task 14: компонент `MoonTile`, стили и главная

**Files:**
- Create: `apps/web/src/components/moon/MoonTile.tsx`, `apps/web/src/components/moon/MoonTileStreak.tsx`
- Modify: `apps/web/src/app/page.tsx` (вставить плитку сразу после секции `.hero`, до секции практик, `aria-labelledby`), `apps/web/src/app/page.test.tsx`, `apps/web/src/app/globals.css` (конец: `.moon-tile*` по макету, часть 2, вариант А, «Портал»), `AGENTS.md` (строка про главную и плитку)
- Test: `apps/web/src/components/moon/MoonTile.test.tsx`

**Interfaces:**
- Consumes: `buildMoonTile`, `MoonTileData` (Task 13); `readVisitState` (Task 1); `collectionItems().length` не нужен — всего гравюр 20 константой `COLLECTION_IDS.length`.
- Produces: `MoonTile({ data }: { data: MoonTileData })` — серверный компонент: `<section aria-labelledby>` с заголовком `<h2>`, диск с дыханием и бегущей точкой (только при `no-preference`), подпись «Луна сегодня · 22 ноября», заголовок «Растущая Луна, 13-е сутки «Колесо»», строка «Луна в Овне. <До полнолуния 2 дня>.», плашки «89 % света · Овен · Восход 14:22», неделя из шести дисков (сегодня крупнее), кнопка «Открыть Луну сегодня» → `/luna-segodnya`. `MoonTileStreak()` — клиентский: после монтирования читает `readVisitState(window.localStorage, new Date())` и, если заходов ≥ 1, показывает «Ваша серия: N дней, открыто M гравюр из 20»; до этого не занимает места. Не записывает заход.

- [ ] **Step 1: Write the failing tests:** `MoonTile.test.tsx` — `renders the heading, the link to /luna-segodnya and six week discs`, `contains none of FORBIDDEN_MOON_WORDS`, `renders no streak line on the server`; `page.test.tsx` — `home has the Moon tile after the hero and before the practices` (порядок по позициям в разметке).
- [ ] **Step 2: Run** `pnpm --filter @oracle/web exec vitest run src/components/moon/MoonTile.test.tsx src/app/page.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement** по макету. На 375 px карточка в одну колонку, диск сверху по центру, высота ≤ ~620 px.
- [ ] **Step 4: Run** the same + `pnpm typecheck` — Expected: PASS.
- [ ] **Step 5: Verify in browser:** первый экран главной на 390×740 не изменился (кнопка расчёта выше cookie-панели); плитка под ним; на 1280 px и 375 px нет горизонтальной прокрутки; при двух заходах строка серии появляется. Запустить e2e первого экрана, если доступно: `pnpm test:e2e -- first-screen`.
- [ ] **Step 6: Run** `pnpm test` — Expected: all pass. **Step 7: Commit** `feat(web): Moon tile on the home page`; открыть PR 3.

---

## Self-review

- **Покрытие проекта.** Ряд, награды, `fresh`, гравюры: Tasks 1, 3. Нить и «следующая гравюра»: Tasks 3, 4. Блок альбома, награда за заход, пустое состояние, рамки: Task 5. Подключение: Task 6. Адреса и вкладки, подсветка «Фаз» на страницах года: Task 7. API ленты: Task 8. Лента, чип нити, рамки на диске, два ряда на телефоне: Task 9. Все лунные страницы: Task 10. Шапка и подвал, правило для 1024 px: Task 11. Плитка и главная, неделя из шести дисков: Tasks 13–14. Доки: Tasks 6, 12, 14.
- **Отличия от проекта (приняты при составлении плана).** (а) Запись захода не «переезжает» в ленту: `recordVisit` идемпотентна, поэтому альбом и лента вызывают её оба, итог тот же. (б) Мини-диск в шапке — статичный декоративный полумесяц, живая фаза в шапке потребовала бы запрос на каждой странице сайта.
- **Согласованность имён.** `recordVisit`/`readVisitState`/`VisitState` (Task 1) используются в Tasks 2, 3, 5, 9, 14; `ThreadDay`/`buildThreadDays` (Task 4) — в Tasks 5, 6; `MoonTabKey`/`moonTabs`/`moonTabFor`/`isMoonPath` (Task 7) — в Tasks 9–11; `MoonRibbonData`/`moonRibbonData` (Task 8) — в Tasks 9, 10; `MoonTileData`/`buildMoonTile` (Task 13) — в Task 14.
- **Пропорции.** Реальная работа в стилях и вёрстке по макету; тесты и сигнатуры зафиксированы, тела функций и CSS не расписаны.
