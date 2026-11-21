# «Луна сегодня»: сцена Луны. План (PR 1 из 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Страница `/luna-segodnya` получает «Сцену Луны» (диск в центре в кольцах, факты по бокам), вопрос дня с кнопкой «Записать мысль на сегодня» под Луной и три карточки с гравюрами вместо плоских блоков «Что описывает этот день».

**Architecture:** Разметку страницы и классы, на которые опираются тесты, сохраняем; сцену собираем CSS-сеткой над теми же элементами. Новое: клиентский блок `MoonDayAsk` (вопрос + дневник, запись общая с календарём через `lib/moon-diary.ts`), слот `ask` в `MoonExplorer`, картинки в трёх карточках, помощник `lunarDayImage` с флагом готовности гравюр суток.

**Tech Stack:** Next.js 16 App Router, React, vitest (серверная разметка через `renderToStaticMarkup`; jsdom и testing-library в проекте нет), Playwright (`e2e/`), общий `apps/web/src/app/globals.css`.

**Spec:** `docs/superpowers/specs/2026-11-21-lunar-pages-visual-design.md` (раздел «PR 1. Луна сегодня»). Работа ведётся в `C:\Users\olya8\projects\oracle-luna`, ветка `style/luna-today-scene`.

## Global Constraints

- Нет внешних CDN, шрифтов и скриптов; цвета только переменными из `:root`, новые добавлять туда же (`globals.css`, раздел «Луна сегодня — оформление»).
- Мобильные: на 375 px без горизонтальной прокрутки, текст не мельче 14 px, зоны нажатия не меньше 44 px; контраст не ниже WCAG AA; фокус с клавиатуры виден.
- Любое движение только внутри `@media (prefers-reduced-motion: no-preference)`.
- Остаются без изменений (проверяют `page.test.tsx` и `e2e/moon.spec.ts`): один `<h1>` «Луна сегодня, <дата>», «По Москве», `figure.moon-disc` с 8 `.moon-disc__tick`, 4 `.moon-tile`, `.moon-next`, 14 `.moon-strip__day`, 3 `.moon-text__block` с `.moon-text__question`, ссылки «Вытянуть карту дня» (`/taro/karta-dnya`) и «Какая Луна в вашей натальной карте» (`/natalnaya-karta`).
- Новых текстов нет, кроме подписи кнопки «Записать мысль на сегодня» (утверждена владелицей) и подписей карточек «Фаза», «Лунные сутки», «Знак Луны» (совпадают с подписями плиток). Слова-оценки из `FORBIDDEN_MOON_WORDS` запрещены.
- Дневник пишет только в `localStorage` ключа `moon:diary:v1`, на сервер ничего не уходит.
- Коммиты: conventional commits на английском (`style(web): …`, `feat(web): …`), в конце `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Коммитит исполнитель только после согласия владелицы.

## Review Focus

- Вопрос дня берётся из `today.texts.day`, а если текстов суток нет (не приняты) — из `today.texts.phase`; если нет обоих, блока `MoonDayAsk` нет вовсе, страница не падает (тест в задаче 2).
- До загрузки в браузере (на сервере и при первом рендере) кнопки «Записать мысль на сегодня» нет, видна только строка вопроса (тест в задаче 2).
- В `localStorage` лежит испорченный JSON или он недоступен: страница открывается, запись просто не показывается (поведение `readDiary` уже такое; не ломать, e2e в задаче 2).
- Гравюры суток ещё не готовы: карточка суток показывает цифру, а не битую картинку (тест в задаче 1 и 3).
- На 375 px и 1280 px нет горизонтальной прокрутки при открытой cookie-панели (задача 6).

---

### Task 1: Помощник путей гравюр лунных суток

**Files:**
- Modify: `apps/web/src/lib/moon-images.ts`
- Test: `apps/web/src/lib/moon-images.test.ts`

**Interfaces:**
- Produces: `LUNAR_DAY_SLUGS: readonly string[]` (30 слагов из таблицы `docs/design/brief-lunar-day-engravings.md`, порядок по номеру суток, `"svetilnik"` … `"lebed"`), `LUNAR_DAY_IMAGES_READY: boolean` (сейчас `false`), `lunarDayImage(day: number, size?: MoonImageSize): string | null` — путь вида `/luna/days/12-chasha.webp` (960 — без суффикса, 480 → `-480`, 160 → `-160`; номер двузначный); `null`, если `LUNAR_DAY_IMAGES_READY` ложен или `day` вне 1…30.

- [ ] **Step 1: Write the failing tests** в `moon-images.test.ts`: `lunar day pictures` — `LUNAR_DAY_SLUGS` содержит 30 уникальных слагов, `LUNAR_DAY_SLUGS[11] === "chasha"`; пока флаг выключен `lunarDayImage(12)` равен `null`; путь строится правильно (через переданный параметр `ready`, см. шаг 3): `lunarDayImage(12, 480, true) === "/luna/days/12-chasha-480.webp"`, `lunarDayImage(1, 960, true) === "/luna/days/01-svetilnik.webp"`, `lunarDayImage(0, 960, true)` и `lunarDayImage(31, 960, true)` равны `null`.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/moon-images.test.ts`; ожидается FAIL (`lunarDayImage` не определён).
- [ ] **Step 3: Implement** в `moon-images.ts`: константы и `lunarDayImage(day, size = 960, ready = LUNAR_DAY_IMAGES_READY)`; третий параметр нужен только тесту. Комментарий: флаг `true` ставят, когда все 30 × 3 файла лежат в `apps/web/public/luna/days/` (пока гравюры делает владелица, ТЗ — `docs/design/brief-lunar-day-engravings.md`).
- [ ] **Step 4: Run** тот же тест, ожидается PASS; затем `pnpm --filter web typecheck`.
- [ ] **Step 5: Commit** `feat(web): path helper for the lunar day engravings behind a readiness flag`.

---

### Task 2: Вопрос дня и «Записать мысль» под Луной

**Files:**
- Create: `apps/web/src/components/moon/MoonDayAsk.tsx`
- Modify: `apps/web/src/components/moon/MoonDiary.tsx` (необязательный `promptHidden`), `apps/web/src/components/moon/MoonExplorer.tsx` (слот `ask`), `apps/web/src/app/luna-segodnya/page.tsx`
- Test: `apps/web/src/app/luna-segodnya/page.test.tsx`, `e2e/moon.spec.ts`

**Interfaces:**
- Consumes: `MoonDiary({ prompt, note, canWrite, onSave, stats })`, `readDiary`, `writeDiary`, `withNote`, `diaryStats` из `@/lib/moon-diary`; `today.texts.day?.question`, `today.texts.phase?.question`.
- Produces: `MoonDayAsk({ date, question }: { date: string; question: string })` (client); у `MoonDiary` необязательный `promptHidden?: boolean` (метка получает класс `visually-hidden`, видимый текст вопроса остаётся снаружи); у `MoonExplorer` необязательный `ask?: ReactNode`, рисуется сразу после `<figure class="moon-disc">` и до ленты.

- [ ] **Step 1: Write the failing tests** в `page.test.tsx`:
  - `shows the question of the day under the Moon, with no write button before the browser takes over` — разметка содержит `moon-ask__question` с текстом `today.texts.day.question` («Что вы сейчас готовы принять, а что отдать?» подставлять нельзя: брать вопрос текущих суток через `buildMoonToday(new Date()).texts.day?.question`), а строки «Записать мысль на сегодня» в серверной разметке нет;
  - `the question comes after the disc and before the 14-day strip` — индекс `moon-ask` больше индекса `moon-disc__caption` и меньше индекса `moon-strip__list`.
  - E2E в `e2e/moon.spec.ts`: `the Moon today page lets the visitor write a thought and keeps it only in the browser` — очистить `localStorage`, открыть страницу, нажать кнопку «Записать мысль на сегодня», вписать «тест», нажать «Записать», проверить статус «Записано.» и что в `localStorage["moon:diary:v1"]` есть сегодняшняя дата (по Москве) с этим текстом; затем `waitForRequest`-проверка: за время теста не было POST-запросов.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/app/luna-segodnya/page.test.tsx`; ожидается FAIL.
- [ ] **Step 3: Implement.** `MoonDayAsk`: всегда рисует `<section class="moon-ask" aria-label="Вопрос дня"><p class="moon-ask__question">{question}</p>`; после монтирования (`useEffect`) читает `readDiary()` и показывает кнопку «Записать мысль на сегодня» (`aria-expanded`, `aria-controls`); по нажатию раскрывает `MoonDiary` с `promptHidden`, `canWrite`, `note` за `date`, `stats` из `diaryStats(notes, date, date.slice(0, 7))`, сохранение через `withNote` + `writeDiary`. `date` — московская дата `today.strip[0].date`. В `page.tsx` вопрос = `today.texts.day?.question ?? today.texts.phase?.question`; при `null` слот `ask` не передаётся.
- [ ] **Step 4: Run** unit-тесты и `pnpm --filter web typecheck`; PASS. E2E (нужны `pnpm dev:db`, `pnpm dev:web`): `pnpm test:e2e e2e/moon.spec.ts`; PASS.
- [ ] **Step 5: Commit** `feat(web): question of the day and a diary entry under the Moon on the Moon today page`.

---

### Task 3: Картинки в трёх карточках дня

**Files:**
- Modify: `apps/web/src/app/luna-segodnya/page.tsx` (секция `moon-text`)
- Test: `apps/web/src/app/luna-segodnya/page.test.tsx`

**Interfaces:**
- Consumes: `phaseImage(phase, 480)`, `signImage(sign, 480)`, `lunarDayImage(day, 480)` из `@/lib/moon-images`; `snapshot.phase`, `snapshot.sign`, `today.lunarDay.number`.
- Produces: внутри каждого `article.moon-text__block` блок `div.moon-text__art` (декоративный, `aria-hidden="true"`) и подпись `p.moon-text__eyebrow` («Фаза» / «Лунные сутки» / «Знак Луны»); у карточки суток при отсутствии картинки внутри `.moon-text__art` стоит `span.moon-text__numeral` с номером суток. Классы `.moon-text`, `.moon-text__block[data-kind]`, `.moon-text__question`, заголовки `h3` не меняются.

- [ ] **Step 1: Write the failing tests:** `each of the three cards has a picture area; the phase card uses a phase engraving, the sign card a sign engraving, the day card shows the day number while the day engravings are not ready` — три `moon-text__art`; в карточке `data-kind="phase"` `src` содержит `/luna/phases/`; в `data-kind="sign"` — `/luna/signs/`; в `data-kind="day"` нет `<img` и есть `moon-text__numeral` с `today.lunarDay.number`.
- [ ] **Step 2: Run** тест; FAIL.
- [ ] **Step 3: Implement** разметку (`next/image`, `unoptimized`, `alt=""`, `width={480} height={480}`, `loading="lazy"`; карточка знака показывается только при `today.signSummary`, как сейчас).
- [ ] **Step 4: Run** `pnpm vitest run apps/web/src/app/luna-segodnya` и `pnpm --filter web typecheck`; PASS.
- [ ] **Step 5: Commit** `feat(web): engravings in the three day cards on the Moon today page`.

---

### Task 4: Сцена Луны (CSS первого экрана)

**Files:**
- Modify: `apps/web/src/app/globals.css` (новый раздел в конце файла «Луна сегодня — сцена»; старые правила `.moon-hero`, `.moon-tiles` не удалять, а переопределять ниже по каскаду)

**Interfaces:**
- Consumes: классы `.moon-hero`, `h1`, `.moon-hero__place`, `.moon-disc`, `.moon-ask`, `.moon-strip`, `.moon-hero__today`, `.moon-tiles`, `.moon-tile[data-kind]`, `.moon-next`, `.moon-poster`.
- Produces: токены в `:root` — `--moon-ring` (`rgba(203,166,118,0.28)` или тоньше), `--moon-glow` (мягкое бронзовое свечение), общие для задач 5 и PR 2–3.

- [ ] **Step 1: Layout ≥ 900 px.** Сетка `.moon-hero` из трёх колонок (факты слева · диск 320–410 px · факты справа); заголовок и «По Москве» сверху на всю ширину; плитки `phase` и `day` слева, `sign` и `rise` справа (через `display: contents` на `.moon-hero__today` и `.moon-tiles` и `grid-area` на каждой плитке); под диском строка `.moon-ask`; ниже `.moon-next` и `.moon-poster`; лента `.moon-strip` на всю ширину. Тонкая рамка и фон плиток убираются, значение крупное (`--font-display`), подпись 14 px.
- [ ] **Step 2: Кольца и свечение.** Два тонких золотых кольца вокруг диска (псевдоэлементы `.moon-disc::before/::after` или `radial-gradient`; не ломать существующий `.moon-disc::before`, если он уже рисует ореол — расширить его) и свечение `--moon-glow`; ничего декоративного не перехватывает клики.
- [ ] **Step 3: Mobile < 900 px и < 600 px.** Заголовок, диск (до 310 px), `.moon-ask`, плитки 2×2 под диском, лента. Первый экран на 390×740 с открытой cookie-панелью: виден заголовок и верхняя часть диска.
- [ ] **Step 4: Движение.** В `@media (prefers-reduced-motion: no-preference)`: кольца проявляются при загрузке (~900 мс, `opacity`) и медленно «дышат» (±0,6 %, ~10 с; существующий диск уже дышит — не дублировать); у текущей отметки фазы на кольце мягкое свечение (уже есть `moon-phase-settle`, расширить). Вне этого запроса всё статично.
- [ ] **Step 5: Проверка.** `pnpm dev:web`, открыть `/luna-segodnya` на 1280 и 390 px; снять скриншоты, `document.documentElement.scrollWidth <= window.innerWidth` на 375; цвета без новых хардкодов вне `:root`. `pnpm test` без падений.
- [ ] **Step 6: Commit** `style(web): Moon today — moon stage with rings and facts on both sides`.

---

### Task 5: Карточки дня, вопрос и остальное оформление

**Files:**
- Modify: `apps/web/src/app/globals.css` (тот же новый раздел)

- [ ] **Step 1: `.moon-ask`.** Вопрос `.moon-ask__question` курсивом `--font-display`, цвет `--accent-hover`, по центру под диском; кнопка «Записать мысль на сегодня» — основная (одна на экран), зона нажатия ≥ 44 px; раскрытый дневник — карточка в рамке `--line-strong` на ширину сцены.
- [ ] **Step 2: Карточки.** `.moon-text` — три колонки ≥ 900 px, одна колонка на телефоне; карточка с рамкой и градиентом `--surface`→`--surface-3`, `.moon-text__art` — квадратная картинка сверху (скругление 16 px, `object-fit: cover`); `.moon-text__numeral` — крупная цифра на тёмном фоне с золотым свечением (`font: 300 clamp(...) var(--font-display)`), `aria-hidden`; `.moon-text__eyebrow` — надзаголовок 12 px, капс, `--accent-soft`; `.moon-text__question` — курсив, как в `.moon-ask__question`.
- [ ] **Step 3: Лента, планета дня, «Продолжить», FAQ.** Карточки ленты чище, «Сегодня» с мягким кольцом; `.weekday-strip` на этой странице в бронзовой рамке; остальные блоки без изменения структуры.
- [ ] **Step 4: Проверка.** Скриншоты 1280 / 390, обычный режим и `prefers-reduced-motion: reduce` (resize_window `colorScheme` не нужен); контраст текста не ниже 4,5:1 (подписи поверх картинки — на `--scrim`); фокус виден на кнопке «Записать мысль на сегодня», карточках, ленте. `pnpm test`, `pnpm --filter web typecheck`.
- [ ] **Step 5: Commit** `style(web): Moon today — day cards with engravings, question line and polish`.

---

### Task 6: Сдача

**Files:**
- Create: `docs/design/shots/3.1-luna-today/before/`, `…/after/` (скриншоты 1280 и 390)

- [ ] **Step 1:** Скриншоты «до» с `https://tvoy-orakul.ru/luna-segodnya` (если не сняты раньше) и «после» с локальной страницы, по образцу `docs/design/shots/2.7-lila-try/`.
- [ ] **Step 2:** `pnpm install` не требуется повторно; прогнать `pnpm typecheck`, `pnpm test`, `pnpm test:e2e e2e/moon.spec.ts e2e/first-screen.spec.ts`; все PASS.
- [ ] **Step 3:** Открыть PR из `style/luna-today-scene` в `master`, описание на русском с кратким списком и ссылкой на спецификацию; после открытия — `get_status`/`bind_pr` из ccd_pr.
- [ ] **Step 4:** Merge делает владелица после проверки (мерж сразу выкладывает сайт).
