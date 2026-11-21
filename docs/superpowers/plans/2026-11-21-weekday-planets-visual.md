# «Дни недели»: планета дня и цвета планет. План (PR 2 из 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Страница `/dni-nedeli` получает героя «планета дня» в цвете планеты, ленту семи дней и цветные карточки дней.

**Architecture:** Данные (`lib/weekday-planets.ts`) не меняем. Цвет задаёт CSS-переменная `--planet`, которую выставляет атрибут `data-planet="<glyph>"` на элементах планеты. Новый компонент `WeekdayWeekBar` — лента семи знаков со ссылками на якоря карточек.

**Tech Stack:** Next.js 16 App Router, vitest (`renderToStaticMarkup`), `globals.css`.

**Spec:** `docs/superpowers/specs/2026-11-21-lunar-pages-visual-design.md` (раздел «PR 2. Дни недели»). Ветка `style/weekday-planets` от свежего `origin/master` (после мержа PR 1 — от обновлённого).

## Global Constraints

- Те же, что в плане PR 1: без внешних CDN и шрифтов, цвета переменными в `:root`, 375 px без горизонтальной прокрутки, текст ≥ 14 px, зоны нажатия ≥ 44 px, контраст не ниже WCAG AA, фокус виден, движение только внутри `prefers-reduced-motion: no-preference`, коммиты на английском с `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Остаются (проверяет `dni-nedeli/page.test.tsx`): один `<h1>` «Дни недели и планеты», семь карточек с `id` = слаг дня и якорями, ровно одна карточка с `aria-current="date"`, блок «Планета дня», колесо, FAQ и дисклеймер.
- Новых текстов нет: образ, вопрос, «Сегодня суббота — день Сатурна» и подписи берутся из `WEEKDAY_PLANETS`. Название «Все семь дней» и тексты в `WeekdayStrip` не меняются. Подпись у ленты семи дней — только аббревиатуры дней из `dayShort` («Пн»…«Вс»).
- Цвета планет (приглушённые, проверяются тестом контраста ≥ 4,5:1 на `--surface` `#121017`): Луна жемчужный `#C9CCD6`, Марс терракотовый `#C27B5E`, Меркурий пыльно-бирюзовый `#6FA6A3`, Юпитер синий `#5F7FC4` с золотым акцентом `--accent`, Венера розово-бежевая `#D7A99C`, Сатурн графитовый `#9A9AA6`, Солнце янтарный `#E0A84F` (значения с макета; тест вправе потребовать осветлить любой).

## Review Focus

- Любой цвет планеты читается на тёмной карточке и на фоне страницы (тест контраста в задаче 1).
- В воскресенье и понедельник (края недели) «сегодня» отмечается в ленте и карточках одинаково (тест в задаче 2 по индексам 0 и 6).
- Лента из семи знаков не вылезает за 375 px: прокрутка только внутри ленты или перенос (задача 4).
- Нажатие знака в ленте ведёт к карточке с этим якорем, фокус виден (задача 2, задача 4).

---

### Task 1: Токены цвета планет

**Files:**
- Modify: `apps/web/src/app/globals.css` (раздел «Дни недели и планеты», после `.weekday-mark`; токены в `:root`)
- Test: `apps/web/src/lib/weekday-colors.test.ts` (новый)

**Interfaces:**
- Produces: в `:root` — `--planet-moon`, `--planet-mars`, `--planet-mercury`, `--planet-jupiter`, `--planet-venus`, `--planet-saturn`, `--planet-sun`; правила `[data-planet="moon"] { --planet: var(--planet-moon); }` и так для остальных шести (ключ — `PlanetGlyph` из `lib/weekday-planets.ts`).

- [ ] **Step 1: Write the failing test** `weekday-colors.test.ts`: читает `globals.css` (`node:fs`, путь от файла теста), выбирает значения `--planet-*` и `--surface`, для каждой планеты считает контраст по WCAG и ожидает `>= 4.5`; проверяет, что есть ровно семь переменных `--planet-*` и семь правил `[data-planet="…"]`, имена совпадают с `PlanetGlyph`.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/lib/weekday-colors.test.ts`; FAIL (переменных нет).
- [ ] **Step 3: Implement** токены и семь правил `[data-planet]`.
- [ ] **Step 4: Run** тест; PASS (если какой-то цвет не проходит — осветлить его в `:root`, не менять порог).
- [ ] **Step 5: Commit** `style(web): planet colour tokens for the weekday page`.

---

### Task 2: Лента семи дней и атрибут планеты

**Files:**
- Create: `apps/web/src/components/weekday/WeekdayWeekBar.tsx`
- Modify: `apps/web/src/components/weekday/WeekdayCards.tsx`, `WeekdayStrip.tsx`, `WeekdayRibbon.tsx`, `apps/web/src/app/dni-nedeli/page.tsx`
- Test: `apps/web/src/app/dni-nedeli/page.test.tsx`

**Interfaces:**
- Produces: `WeekdayWeekBar({ today }: { today: number })` — `<nav aria-label="Дни недели">`, список из семи ссылок `a.weekday-bar__day` (`href="#<слаг>"`, `aria-current="date"` только у сегодняшней, `data-planet`, внутри `PlanetGlyph` и `dayShort`); `data-planet={planet.glyph}` на `li.weekday-card`, на `aside.weekday-strip` и на `li` в `WeekdayRibbon`.

- [ ] **Step 1: Write the failing tests** в `page.test.tsx`: `the week bar has seven links to the card anchors, one of them marked as today` — ссылки `#ponedelnik`, `#vtornik`, `#sreda`, `#chetverg`, `#pyatnica`, `#subbota`, `#voskresenye` (взять слаги из `WEEKDAY_PLANETS`, а не писать вручную), ровно один `aria-current="date"` внутри `weekday-bar`; `every day card and the planet strip carry data-planet`; `the week bar marks the first and the last day of the week correctly` — вызвать `WeekdayWeekBar` напрямую с `today = 0` и `today = 6`.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/app/dni-nedeli`; FAIL.
- [ ] **Step 3: Implement** компонент и атрибуты; в `page.tsx` поставить `<WeekdayWeekBar today={today} />` между героем и секцией карточек.
- [ ] **Step 4: Run** тесты и `pnpm --filter web typecheck`; PASS.
- [ ] **Step 5: Commit** `feat(web): week bar and planet attribute on the weekday page`.

---

### Task 3: Герой «планета дня»

**Files:**
- Modify: `apps/web/src/components/weekday/WeekdayWheel.tsx` (только атрибут `data-planet` на `<svg>` и подпись цвета центра/ореола через CSS; геометрию и `viewBox` не менять), `apps/web/src/app/dni-nedeli/page.tsx`, `globals.css`

- [ ] **Step 1:** В `page.tsx` передать колесу планету дня (`data-planet` на обёртке героя или на `svg`): центр колеса (`weekday-wheel__centre`), ореол (`__halo`) и узел сегодняшней планеты красятся в `--planet`, остальные узлы остаются бронзовыми и тихими.
- [ ] **Step 2:** CSS героя ≥ 900 px: слева текст (eyebrow «Ритм недели», `h1`, `.weekday-hero__lead`, блок `WeekdayStrip` как главная цитата: вопрос `.weekday-strip__question` курсивом `--font-display`, цвет `--accent-hover`), справа колесо крупнее (до 460 px) с мягким свечением `--planet` (`drop-shadow`). На телефоне колесо сверху до 300 px, текст под ним.
- [ ] **Step 3:** Движение: при загрузке сегодняшний узел мягко проявляет ореол (~900 мс), только внутри `prefers-reduced-motion: no-preference`.
- [ ] **Step 4: Проверка.** `pnpm test`, `pnpm --filter web typecheck`; скриншоты `/dni-nedeli` на 1280 и 390 для сегодняшнего дня. Страница считает день на сервере, поэтому цвета остальных шести планет смотрим по карточкам и ленте из задачи 4.
- [ ] **Step 5: Commit** `style(web): weekday hero with the planet of the day in its colour`.

---

### Task 4: Лента и карточки дней в цвете

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Лента.** `.weekday-bar` — одна строка, семь кружков знаков в цвете `--planet` (кружок: тонкая рамка `--planet`, фон `color-mix(in srgb, var(--planet) 14%, transparent)`), сегодняшний крупнее и со свечением; на телефоне 7 колонок помещаются на 375 px, зона нажатия ≥ 44 px (если не помещаются — прокрутка внутри ленты).
- [ ] **Step 2: Карточки.** Цветная полоса 3 px сверху (`--planet`), знак планеты и подпись планеты цветом `--planet`, фон — градиент `--surface-3`→`--surface` с лёгкой примесью `--planet`; «Образ» — спокойный абзац; «Вопрос для себя» крупнее и в рамке как цитата (`--font-display`, курсив, `--accent-hover`); сегодняшняя карточка с рамкой и плашкой «Сегодня» (уже есть). Наведение: карточка слегка приподнимается и рамка теплеет, только внутри `no-preference`.
- [ ] **Step 3: `WeekdayRibbon`** на странице календаря получает те же цвета знаков (`[data-planet]` на `li`).
- [ ] **Step 4: Проверка.** Скриншоты 1280 / 390, `prefers-reduced-motion: reduce`, контраст, фокус на ссылках ленты и карточек, 375 px без горизонтальной прокрутки; `pnpm test`, `pnpm typecheck`.
- [ ] **Step 5: Commit** `style(web): coloured week bar and day cards on the weekday page`.

---

### Task 5: Сдача

- [ ] **Step 1:** Скриншоты до и после в `docs/design/shots/3.2-weekday/{before,after}/`.
- [ ] **Step 2:** `pnpm typecheck`, `pnpm test`, `pnpm test:e2e e2e/first-screen.spec.ts` (страницы дней недели в нём нет; убедиться, что остальное не сломано); PASS.
- [ ] **Step 3:** PR из `style/weekday-planets` в `master`, `get_status`/`bind_pr`. Merge делает владелица.
