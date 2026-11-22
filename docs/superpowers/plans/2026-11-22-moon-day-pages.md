# Страницы отдельных дней лунного календаря: план

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** страница на каждую дату окна месяцев (`/lunnyy-kalendar/24-noyabrya-2026`, около 450 адресов): ответ на запрос в первой строке, события дня, соседние дни, тексты суток и фазы, ссылки по разделу.

**Architecture:** тот же маршрут `app/lunnyy-kalendar/[month]/page.tsx` разбирает слаг месяца или слаг дня. Данные дня берутся из `moonMonth` (результат месяца запоминается в памяти процесса), шаблонные тексты — чистые функции над данными дня, страница — серверный компонент. Страницы дней строятся по запросу и обновляются раз в сутки, как месяцы.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, vitest (`renderToStaticMarkup`, чистые функции), `@oracle/core/moon`, `@oracle/content/moon`.

**Spec:** `docs/superpowers/specs/2026-11-22-moon-day-pages-design.md`; макет `docs/design/mockups/moon-section/moon-day-page-v1.html` (вариант A; в макете у 24 ноября ошибочно «15-е с 15:12»: по данным 15-е сутки идут до 15:12, потом начинаются 16-е).

## Global Constraints

- Все время и даты по Москве; выбор города (`moon:place:v1`) на страницах дней не действует и не читается.
- Нет оценок дней и советов: тексты не содержат ни одного слова из `FORBIDDEN_MOON_WORDS` (`@oracle/content/moon`).
- Новых целей Метрики нет; блок `MoonNatalBridge` считает прежнюю цель `moon_to_natal` с новым значением параметра `from: "day"`.
- Страница дня серверная: движок расчёта не попадает в браузер (импорты `@oracle/core/moon` только из серверных модулей и тестов).
- Адрес дня: `<день без нуля>-<слаг в родительном падеже>-<год>`; слаги месяцев и дней не пересекаются; вне окна (`isInWindow`) и невозможная дата — настоящий 404.
- Что видит человек на странице месяца, не меняется, кроме двух новых ссылок на страницу дня; существующие тесты месяца остаются зелёными без правок ожиданий.
- Вёрстка: 375 px без горизонтальной прокрутки, зоны нажатия не меньше 44 px, шрифт не мельче 14 px, цвета переменными, движение только в `prefers-reduced-motion: no-preference`.
- Коммиты — conventional на английском; мерж делает владелица. Тесты запускаются из корня: `pnpm vitest run <путь>`.

## Review Focus

- День без восхода Луны (в месяце бывает один такой): строка и плитка показывают «—» или слова «не восходит», страница не падает (Task 2, Task 3).
- Границы окна: у первого дня самого раннего месяца нет ссылки «вчера», у последнего дня самого позднего нет «завтра»; соседние дни через границу месяца и года (31 декабря → 1 января) ссылаются на нужный адрес (Task 2).
- День, где совпадают главная фаза и переход в знак (24 ноября 2026: полнолуние 17:54 и вход Луны в Близнецы): заголовок ведёт фаза, события идут по времени (Task 2, Task 3).
- Смешение слагов: `24-noyabr-2026`, `noyabrya-2026`, `31-noyabrya-2026`, `0-noyabrya-2026`, `024-noyabrya-2026` дают 404, а `noyabr-2026` по-прежнему месяц (Task 1, Task 4).
- Заголовки и описания разных дат различаются (не дубли): три месяца подряд дают уникальные title и description (Task 3).

---

### Task 1: Адреса дней

**Files:**
- Modify: `apps/web/src/lib/lunar-calendar-paths.ts`
- Create: `apps/web/src/lib/lunar-calendar-paths.test.ts`

**Interfaces:**
- Produces (все безопасны для браузера, без расчётов Луны):
  - `MONTH_GENITIVE_SLUGS: readonly string[]` — `yanvarya, fevralya, marta, aprelya, maya, iyunya, iyulya, avgusta, sentyabrya, oktyabrya, noyabrya, dekabrya`.
  - `type YearMonthDay = { year: number; month: number; day: number }`.
  - `lunarDayPath(year: number, month: number, day: number): string` → `/lunnyy-kalendar/24-noyabrya-2026`.
  - `parseDaySlug(slug: string): YearMonthDay | null` — только `^([1-9]|[12]\d|3[01])-([a-z]+)-(\d{4})$` с известным слагом месяца и днём не больше длины месяца (длина — через `new Date(Date.UTC(year, month, 0)).getUTCDate()`).
  - `lunarDayPathOfDate(isoDate: string): string` — из `"2026-11-24"` в адрес дня.
  - `lunarDayPaths(now: Date): string[]` — адреса всех дней всех месяцев `monthWindow(now)` по порядку.
  - `parseMonthSlug` и остальное не меняются.

- [ ] **Step 1: Write the failing tests** in `lunar-calendar-paths.test.ts`: адрес `lunarDayPath(2026, 11, 24)` равен `/lunnyy-kalendar/24-noyabrya-2026`, `lunarDayPath(2027, 3, 1)` равен `/lunnyy-kalendar/1-marta-2027`; круговой тест: для всех 12 месяцев и первого/последнего дня `parseDaySlug(slug)` возвращает исходное; `parseDaySlug` даёт `null` для `31-noyabrya-2026`, `0-noyabrya-2026`, `024-noyabrya-2026`, `24-noyabr-2026`, `noyabr-2026`, `24-Noyabrya-2026`, `24-noyabrya-26`, `29-fevralya-2027`, а `29-fevralya-2028` разбирает; `parseMonthSlug("24-noyabrya-2026")` равен `null`; `lunarDayPathOfDate("2026-11-24")` равен адресу дня; `lunarDayPaths(new Date("2026-11-17T09:00:00Z"))` содержит 457 адресов без повторов, первый `/lunnyy-kalendar/1-oktyabrya-2026`, последний `/lunnyy-kalendar/31-dekabrya-2027`, и содержит `.../31-dekabrya-2026` и `.../1-yanvarya-2027`.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/lunar-calendar-paths.test.ts`. Expected: FAIL (функций нет).
- [ ] **Step 3: Implement** интерфейсы выше в `lunar-calendar-paths.ts`.
- [ ] **Step 4: Run** тот же файл. Expected: PASS.
- [ ] **Step 5: Commit** `feat(web): addresses for per-date lunar calendar pages`.

---

### Task 2: Данные дня

**Files:**
- Modify: `apps/web/src/lib/lunar-calendar.ts` (только экспорт `labelsFor` и типа `Labels`; ничего больше не меняется)
- Create: `apps/web/src/lib/lunar-day-page.ts`
- Create: `apps/web/src/lib/lunar-day-page.test.ts`

**Interfaces:**
- Consumes: `moonMonth(year, month)` из `@oracle/core/moon` (`MoonMonth.days[]` с `date, day, weekday, snapshot, lunarDay {number, changeAt, changeTo}, rise, set`; `events`; `signRuns`), `labelsFor("Europe/Moscow")` (`clock`, `dayMonth`, `moment`), `PHASE_NAMES`, `SIGN_NAMES`, `EVENT_NAMES`, `SIGN_NAMES_LOCATIVE`, `lunarDayText`, `phaseText`, `phaseImage`, `dayOrdinal`, `isInWindow`, `lunarDayPath`, `lunarMonthPath`, `monthFromIndex`/`monthIndex`.
- Produces:
  - `type DayEvent = { at: number; time: string; kind: "phase" | "sign" | "lunar"; text: string; note: string | null }` (для фазы `note` — `KEY_POINT_ASTRONOMY[kind]` из `@oracle/content/moon-year`; `text` — «Полнолуние», «Луна входит в знак Близнецы», «Начинаются 16-е лунные сутки»).
  - `type DayNeighbour = { href: string; label: string; phase: PhaseId; phaseName: string; image: string | null; current: boolean }` (`label` — «24.11»; `image` — `phaseImage(phase, 160)`).
  - `type DatePage = { year; month; day: number; date: string; dateLabel: string; weekday: string; phase: PhaseId; phaseName: string; illumination: number; waxing: boolean; sign: SignId; signName: string; signLine: string; signDegree: number; lunarNumber: number; lunarLine: string; lunarSymbol: string | null; lunarChange: { time: string; to: number } | null; rise: string | null; set: string | null; events: DayEvent[]; mainEvent: { kind: MoonEvent["kind"]; name: string; time: string } | null; signChange: { time: string; signName: string; signLine: string } | null; neighbours: DayNeighbour[]; prev: { href: string; label: string } | null; next: { href: string; label: string } | null; monthHref: string; monthLabel: string; texts: { phase: PhaseText | undefined; day: LunarDayText | undefined } }`. `dateLabel` — «24 ноября 2026», `weekday` — «вторник», `signLine` — «Луна в Тельце», `lunarLine` — «15-е лунные сутки», `rise`/`set` — «15:12» или `null`.
  - `buildDatePage(year: number, month: number, day: number, now: Date): DatePage` — знак, фаза и номер суток берутся по данным дня месяца (на полдень), события — главные фазы месяца, попавшие в этот день по Москве, вход Луны в новый знак (`signRuns` со второго элемента) и смена лунных суток дня; всё по порядку времени. Соседние дни — до трёх до и трёх после из объединения дней месяцев `prev`, текущего и `next` (месяц вне окна `now` пропускается); `prev`/`next` — ближайшие дни в этом объединении, `null` на границе окна. Расчёт месяца запоминается модульной картой по `год-месяц`, при `size > 20` карта очищается перед записью.

- [ ] **Step 1: Write the failing tests** (`lunar-day-page.test.ts`; `now = new Date("2026-11-17T09:00:00Z")`, тайм-аут 120 с на файл): 24 ноября 2026: `dateLabel` «24 ноября 2026», `weekday` «вторник», `mainEvent` {kind `full`, time `17:54`}, `rise` `15:12`, `set` `08:32`, `lunarNumber` 15, `lunarChange` {time `15:12`, to 16}, `signChange.signName` «Близнецы», в `events` ровно три записи (`phase`, `sign`, `lunar`) по возрастанию `at`; `neighbours` — 7 записей, одна `current`, `href` второй записи `/lunnyy-kalendar/22-noyabrya-2026`; `prev.href` `/lunnyy-kalendar/23-noyabrya-2026`, `next.href` `/lunnyy-kalendar/25-noyabrya-2026`; `texts.day?.symbol` непустой. Первый день окна (1 октября 2026): `prev` равен `null`, `neighbours` не содержит дней за границей; последний (31 декабря 2027): `next` равен `null`. 31 декабря 2026: `next.href` `/lunnyy-kalendar/1-yanvarya-2027`. Найти по данным месяца ноября и декабря 2026 день без восхода (`rise === null` в `moonMonth`; если такого дня нет в этих месяцах, взять первый подходящий день любого месяца окна) и проверить, что `buildDatePage` возвращает `rise: null` и не падает; день без событий даёт пустой или состоящий только из смены суток `events`. Два вызова `buildDatePage` для одного месяца вызывают `moonMonth` один раз (шпион на `@oracle/core/moon` через `vi.mock` с передачей реальной реализации).
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/lunar-day-page.test.ts`. Expected: FAIL (модуля нет).
- [ ] **Step 3: Implement** `lunar-day-page.ts` по интерфейсу; в `lunar-calendar.ts` добавить `export` к `labelsFor` и `Labels`.
- [ ] **Step 4: Run** тот же файл и `pnpm vitest run apps/web/src/lib/lunar-calendar.test.ts`. Expected: PASS оба.
- [ ] **Step 5: Commit** `feat(web): data for a single lunar calendar date`.

---

### Task 3: Тексты страницы дня

**Files:**
- Create: `apps/web/src/lib/lunar-day-copy.ts`
- Create: `apps/web/src/lib/lunar-day-copy.test.ts`

**Interfaces:**
- Consumes: `DatePage` из Task 2, `FaqItem` из `@/components/moon/MoonPageParts` (только тип).
- Produces (чистые функции без расчётов Луны):
  - `dateTitle(page: DatePage): string` — «Луна 24 ноября 2026: полнолуние, 15-е лунные сутки»; в день с главной фазой ведёт фаза (название события строчными), иначе в день входа в знак — «переход в знак Рак» без слов «главная фаза», иначе «<фаза строчными>, <N>-е лунные сутки».
  - `dateDescription(page: DatePage): string` — одно предложение с фазой или событием, освещённостью в процентах, номером суток, знаком Луны, временем восхода по Москве (при `rise === null` слова «Луна в этот день не восходит»), заканчивается «Бесплатно.».
  - `dateAnswer(page: DatePage): string` — абзац-ответ в три-четыре предложения: что за день (главная фаза в HH:MM, или вход в знак в HH:MM, или фаза), освещённость, сутки и знак, восход и заход по Москве; для `rise`/`set` равных `null` — «Луна в этот день не восходит» / «не заходит».
  - `dateFaq(page: DatePage): FaqItem[]` — три вопроса: «Какая Луна <dateLabel>?» (ответ — `dateAnswer`), «Какие лунные сутки <dateLabel>?» (номер суток, символ «…» если есть, время смены, если есть), «Во сколько восход и заход Луны <dateLabel>?» (по Москве).

- [ ] **Step 1: Write the failing tests**: для страницы 24 ноября 2026 title начинается с «Луна 24 ноября 2026: полнолуние», `dateAnswer` содержит «17:54», «100 %» и «15:12»; для дня с переходом в знак без главной фазы title содержит «переход в знак», а не название фазы события; для даты без события title заканчивается «<N>-е лунные сутки»; `dateFaq` возвращает три записи, все вопросы содержат `dateLabel`; в страницах с `rise: null` ни один текст не содержит «null» и «undefined» и есть «не восходит»; ни один из title, description, answer и ответов FAQ ни для одной из дат трёх месяцев (ноябрь 2026, декабрь 2026, январь 2027) не содержит слов из `FORBIDDEN_MOON_WORDS` (регистр не важен); title и description всех дат этих трёх месяцев попарно различаются; длина title не больше 80 символов, description не больше 200.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/lunar-day-copy.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `lunar-day-copy.ts` по интерфейсу. Достаточно трёх вариантов начала по виду дня (главная фаза, вход в знак, обычный день); слова — из принятых словарей (`EVENT_NAMES`, `PHASE_NAMES`, `SIGN_NAMES`, `SIGN_NAMES_LOCATIVE`).
- [ ] **Step 4: Run** тот же файл. Expected: PASS (тайм-аут файла 120 с).
- [ ] **Step 5: Commit** `feat(web): texts for the per-date lunar pages`.

---

### Task 4: Страница дня

**Files:**
- Modify: `apps/web/src/app/lunnyy-kalendar/[month]/page.tsx`
- Create: `apps/web/src/components/moon/MoonDatePage.tsx`
- Create: `apps/web/src/app/lunnyy-kalendar/[month]/day-page.test.tsx`
- Modify: `apps/web/src/lib/moon-natal-bridge.ts` (+ `moon-natal-bridge` тест, если он есть рядом; иначе тест в `components/moon/MoonNatalBridge.test.tsx`)
- Modify: `apps/web/src/app/globals.css` (конец файла: классы `moon-date-*`)
- Modify: `docs/analytics-goals.md` (строка `moon_to_natal`: добавить `day` — страница дня)

**Interfaces:**
- Consumes: `buildDatePage`, `dateTitle`, `dateDescription`, `dateAnswer`, `dateFaq`, `parseDaySlug`, `parseMonthSlug`, `isInWindow`, `lunarDayPath`, `MoonRibbon`, `MoonNatalBridge`, `MoonHub`, `moonJsonLd`, `MoonFaq` (из `MoonPageParts`), `phaseImage`, `lunarDayImage`, `publicMetadata`, `DISCLAIMER`.
- Produces:
  - `BridgeFrom` получает значение `"day"`: `bridgeCopy("day", signName)` — eyebrow «Ваша Луна», заголовок «Луна этого дня одна для всех. Ваша — в карте рождения», текст начинается «В этот день Луна <signName>.» и дальше как у `today`, кнопка «Узнать свою Луну», ведёт на `MOON_SIGN_PATH`.
  - `MoonDatePage({ page, now }: { page: DatePage; now: Date })` — серверный компонент по макету A, порядок: `MoonRibbon current="calendar"`, хлебные крошки (Главная · Луна сегодня · месяц · день), шапка (`moon-date-head`: картинка фазы `phaseImage(phase, 480)` с alt «Луна <dateLabel>: <фаза>, освещено N %», `<h1>` = `dateTitle`, подпись «По Москве · <weekday>»), абзац `dateAnswer`, блок «Событие дня» (список `events` с временем; для дня без событий фраза «Главных фаз и смены знака в этот день нет» плюс смена суток, если есть), четыре плитки (Фаза, Знак Луны, Лунные сутки, Восход и заход; те же классы `moon-tiles` / `moon-tile`; у плитки суток подпись «в <HH:MM> начнутся <N>-е» при `lunarChange`, иначе «весь день»; у плитки знака «<N>° знака» и при `signChange` строка «в <HH:MM> — <знак>»), «Соседние дни» (7 ссылок, текущий с `aria-current="date"`), «Что описывает этот день» (текст суток с гравюрой `lunarDayImage(day, 480)`, затем текст фазы; блок скрыт, если принятых текстов нет), `MoonNatalBridge from="day" signName={page.signLine.replace(/^Луна /, "")}`, ссылки (вчера, завтра, месяц, «Лунные сутки: <N>-е» на `dayPath(N)`, «Вытянуть карту дня», через `MoonHub`), `MoonFaq` с `dateFaq`, дисклеймер.
  - Маршрут `[month]/page.tsx`: `resolve(slug)` возвращает `{ kind: "month", ... } | { kind: "day", ... }`; `generateMetadata` для дня даёт `publicMetadata({ title: dateTitle, description: dateDescription, path: lunarDayPath(...), image: { url: phaseImage(phase, 960), alt } })`; `generateStaticParams` остаётся только для месяцев; JSON-LD дня — `moonJsonLd(title, path, faq)`.

- [ ] **Step 1: Write the failing tests** (`day-page.test.tsx`, часы `vi.setSystemTime("2026-11-17T09:00:00Z")`, как в `page.test.tsx` рядом): для `24-noyabrya-2026` ровно один `<h1>` с текстом `dateTitle`; в разметке «По Москве» и «вторник»; «17:54», «15:12», «08:32», «Близнецы»; четыре плитки (`class="moon-tile"`); 7 ссылок соседних дней и ровно один `aria-current="date"`; ссылка на `/lunnyy-kalendar/noyabr-2026`, на `/luna/sutki/15`; «Узнать свою Луну» (мост `data-from="day"`); три `<details>` в FAQ; `FAQPage` в JSON-LD; нет слов из `FORBIDDEN_MOON_WORDS` в видимом тексте; в разметке нет текста «Для города»; `generateMetadata` даёт canonical `/lunnyy-kalendar/24-noyabrya-2026`, title с «24 ноября 2026», og-картинку фазы. Негативные: слаги `31-noyabrya-2026`, `24-noyabr-2026`, `24-noyabrya-2020` (вне окна), `24-noyabrya-2028` вызывают 404 (отклонённый `notFound`). `noyabr-2026` по-прежнему рендерит месяц (`Лунный календарь на ноябрь 2026`). Тест моста: `bridgeCopy("day", "в Тельце").text` начинается «В этот день Луна в Тельце.».
- [ ] **Step 2: Run** `pnpm vitest run "apps/web/src/app/lunnyy-kalendar/[month]/day-page.test.tsx"`. Expected: FAIL.
- [ ] **Step 3: Implement** по интерфейсам: компонент, ветвление в `page.tsx`, `BridgeFrom "day"`, стили `moon-date-*` в конце `globals.css` по макету A (шапка: на ≥700 px картинка 150 px слева, заголовок справа, на телефоне колонкой; плитки 2 колонки, на ≥860 px 4; ряд соседних дней — 7 колонок, на 375 px без прокрутки, ссылка не меньше 44 px по высоте).
- [ ] **Step 4: Run** `pnpm vitest run "apps/web/src/app/lunnyy-kalendar"` и `pnpm vitest run apps/web/src/components/moon`. Expected: PASS (месяц и дни).
- [ ] **Step 5: Commit** `feat(web): per-date lunar calendar page`.

---

### Task 5: Ссылки со страницы месяца

**Files:**
- Modify: `apps/web/src/components/moon/MoonMonthDays.tsx`, `apps/web/src/components/moon/MoonMonthDays.test.tsx`
- Modify: `apps/web/src/components/moon/MoonDayScene.tsx`
- Modify: `apps/web/src/app/lunnyy-kalendar/[month]/page.test.tsx` (добавить тесты, прежние не менять)
- Modify: `apps/web/src/app/globals.css` (если ссылке в `<th>` нужен стиль)

**Interfaces:**
- Consumes: `lunarDayPathOfDate` из Task 1.
- Produces: в `MoonMonthDays` заголовок строки `<th scope="row">` содержит `<Link href={lunarDayPathOfDate(row.date)}>{row.label}</Link>`; в `MoonDayScene` рядом со ссылкой «О лунных сутках →» стоит `<Link href={lunarDayPathOfDate(day.date)}>Страница дня →</Link>`. Данные (`CalendarDay`, `DayRow`) не меняются, снимки `moon-month-moscow.json` остаются как есть.

- [ ] **Step 1: Write the failing tests**: в `MoonMonthDays.test.tsx` — каждая из строк содержит ссылку на `/lunnyy-kalendar/<d>-<слаг>-<год>` (30 ссылок для ноября 2026, первая на `/lunnyy-kalendar/1-noyabrya-2026`); в тесте месяца — разметка «Лунной сцены» содержит `Страница дня` со ссылкой на день выбранной по умолчанию даты (первое полнолуние, `/lunnyy-kalendar/24-noyabrya-2026`).
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/components/moon/MoonMonthDays.test.tsx "apps/web/src/app/lunnyy-kalendar/[month]/page.test.tsx"`. Expected: новые тесты FAIL, прежние PASS.
- [ ] **Step 3: Implement** две ссылки по интерфейсу; проверить визуально на 390 px, что ссылка в таблице и в сцене не ломает вёрстку и зона нажатия не меньше 44 px (при необходимости поправить стиль).
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src` и `pnpm vitest run packages/core/src/moon`. Expected: всё PASS, снимки месяца не менялись.
- [ ] **Step 5: Commit** `feat(web): link month dates to their own pages`.

---

### Task 6: Карта сайта, документация, проверка

**Files:**
- Modify: `apps/web/src/lib/seo.ts` (в `PUBLIC_PATHS` после путей месяцев добавить `...lunarDayPaths(new Date())`)
- Modify: `apps/web/src/app/sitemap.ts` (приоритет дней 0,4)
- Modify: `apps/web/src/app/sitemaps/[section]/route.ts` (раздел `luna`: `/luna-segodnya`, `/luna`, `/lunnyy-kalendar`, `/dni-nedeli`) и его тест
- Modify: `apps/web/src/app/sitemap.test.ts`
- Modify: `AGENTS.md` (строка «Лунный календарь на месяц»: страницы дней, их адреса, данные, тексты, карта сайта)

**Interfaces:**
- Consumes: `lunarDayPaths`, `parseDaySlug`.
- Produces: `priorityOf` возвращает 0,4 для адреса, где `parseDaySlug` разбирает последний сегмент после `/lunnyy-kalendar/`, и прежние 0,6 для месяцев.

- [ ] **Step 1: Write the failing tests**: `sitemap.test.ts` — каждый адрес из `lunarDayPaths(now)` есть в карте с приоритетом 0,4, число адресов дней равно 457, адреса месяцев остаются с 0,6, нет адресов дней вне окна (`/lunnyy-kalendar/24-noyabrya-2020`); тест маршрута разделов — `luna.xml` содержит месяцы и дни, а `obshchee.xml` их уже не содержит (поправить ожидания существующего теста раздела под новый раздел, не ослабляя их).
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/app/sitemap.test.ts apps/web/src/app/sitemaps`. Expected: FAIL.
- [ ] **Step 3: Implement** по интерфейсам; обновить `AGENTS.md`.
- [ ] **Step 4: Run** `pnpm typecheck` и `pnpm test`. Expected: typecheck чистый, все тесты PASS.
- [ ] **Step 5: Verify in browser** (`preview_start`, dev-сервер из `.claude/launch.json`, если его нет — как в предыдущих PR): открыть `/lunnyy-kalendar/24-noyabrya-2026` на 1280 px и на 390 px — нет горизонтальной прокрутки, плитки, ряд соседних дней и мост видны, ссылка «вчера» и «завтра» работают, консоль без ошибок; `/lunnyy-kalendar/noyabr-2026` открывается как раньше, в «Данные по дням таблицей» даты стали ссылками, в панели дня есть «Страница дня →»; `/lunnyy-kalendar/31-noyabrya-2026` даёт 404.
- [ ] **Step 6: Commit** `feat(web): per-date lunar pages in the sitemap and docs`, затем push и PR `feat(web): per-date lunar calendar pages`.

---

## Self-review

- Покрытие проекта: адреса (Task 1), данные, события, соседи, граница окна, запоминание месяца (Task 2), заголовки, описания, ответ, FAQ, запрещённые слова, уникальность (Task 3), страница по макету A, мост `from: "day"`, мета и JSON-LD, 404 (Task 4), ссылки с месяца (Task 5), карта сайта, приоритет, раздел, AGENTS.md, проверка в браузере (Task 6). Привычка: страница несёт `MoonRibbon`, он записывает заход, как на месяце; `useMoonVisit` отдельно не подключается.
- Имена согласованы: `DatePage`, `DayEvent`, `DayNeighbour`, `buildDatePage`, `dateTitle`/`dateDescription`/`dateAnswer`/`dateFaq`, `lunarDayPath`, `parseDaySlug`, `lunarDayPathOfDate`, `lunarDayPaths`, `BridgeFrom "day"`.
- Пропорция: проект около 100 строк, план — расчёт, тексты, страница и ссылки без кода тел функций.
