# «Лунный календарь»: месяц гравюр. План (PR 3 из 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** В ячейках сетки месяца вместо SVG-кружка стоит гравюра фазы, «Коллекция Луны» оформлена как альбом, а сегодняшний день и главные фазы светятся.

**Architecture:** Новый маленький компонент `MoonPhaseArt` (картинка фазы с запасным SVG-кружком) подставляется в `MoonMonthStage` на место `MoonDisc size="mini"` в ячейках. Разметка ячейки, `aria-label`, `data-*` и клавиатурное управление не меняются. Остальное — CSS.

**Tech Stack:** Next.js 16 App Router, `next/image` (`unoptimized`), vitest (`renderToStaticMarkup`), Playwright, `globals.css`.

**Spec:** `docs/superpowers/specs/2026-11-21-lunar-pages-visual-design.md` (раздел «PR 3. Лунный календарь»). Ветка `style/lunar-calendar-engravings` от свежего `origin/master`.

## Global Constraints

- Те же, что в плане PR 1: без внешних CDN и шрифтов, цвета переменными в `:root`, 375 px без горизонтальной прокрутки, текст ≥ 14 px, зоны нажатия ≥ 44 px, контраст не ниже WCAG AA, фокус виден, движение только внутри `prefers-reduced-motion: no-preference`, коммиты на английском с `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Сетка остаётся `<table class="moon-month__grid">` с кнопками `button.moon-month__pick` в ячейках; `aria-label` ячейки («<дата>: <фаза>, освещено N %, …»), `aria-pressed`, `data-index`, `data-phase`, `data-event`, `data-sign-change`, `data-note`, `--lit`, `--i`, стрелки/Home/End — как сейчас (проверяет `e2e/lunar-calendar.spec.ts`).
- Данные `MoonCollection`, его логика и тексты не меняются; подсказка «откроется 23 ноября» остаётся.
- Подпись «откроется …» в плитке коллекции сейчас 12 px; по правилу проекта текст ≥ 14 px, поэтому поднять до 14 px.
- Фазы в ячейке — только восемь гравюр `/luna/phases/<фаза>-160.webp` (есть все); точный процент остаётся в `aria-label` и в подписи сцены, большая Луна сцены по-прежнему SVG-диск точной фазы.
- Новых текстов нет.

## Review Focus

- Гравюра фазы в ячейке ~40–44 px на 375 px читается; если нет — маска по внутренней Луне, а если и так нет — на телефоне прежний SVG-кружок (решение по скриншоту, задача 3).
- Фаза без картинки (`phaseImage` вернул `null`) не даёт битой ячейки: рисуется прежний `MoonDisc` mini (тест в задаче 1).
- Тридцать ячеек не тянут за собой тридцать запросов: уникальных картинок 8, `loading="lazy"` (проверка в сети, задача 3).
- Ячейка по-прежнему доступна с клавиатуры, имя кнопки не изменилось (e2e `lunar-calendar.spec.ts`, задача 2).

---

### Task 1: Компонент `MoonPhaseArt`

**Files:**
- Create: `apps/web/src/components/moon/MoonPhaseArt.tsx`
- Test: `apps/web/src/components/moon/MoonPhaseArt.test.tsx`

**Interfaces:**
- Consumes: `phaseImage(phase: PhaseId, size?: MoonImageSize): string | null` из `@/lib/moon-images`; `MoonDisc` из `./MoonDisc` (запасной вариант).
- Produces: `MoonPhaseArt({ phase, illumination, waxing }: { phase: PhaseId; illumination: number; waxing: boolean })` — `<span class="moon-month__art" aria-hidden="true"><img …></span>`; для фазы без картинки — прежний `MoonDisc size="mini" animateIntro={false}`.

- [ ] **Step 1: Write the failing tests** в `MoonPhaseArt.test.tsx`: `a known phase renders its 160 px engraving` — для `waxingGibbous` в разметке есть `src="/luna/phases/waxingGibbous-160.webp"`, `alt=""`, `loading="lazy"`; `an unknown phase falls back to the mini disc` — для `"x" as PhaseId` в разметке есть `moon-mini` и нет `<img`.
- [ ] **Step 2: Run** `pnpm vitest run apps/web/src/components/moon/MoonPhaseArt.test.tsx`; FAIL.
- [ ] **Step 3: Implement** компонент (`next/image`, `unoptimized`, `width={160} height={160}`, `sizes="44px"`).
- [ ] **Step 4: Run** тест и `pnpm --filter web typecheck`; PASS.
- [ ] **Step 5: Commit** `feat(web): phase engraving component with a mini disc fallback`.

---

### Task 2: Подмена кружка гравюрой в сетке

**Files:**
- Modify: `apps/web/src/components/moon/MoonMonthStage.tsx` (внутри ячейки: `<MoonDisc size="mini" … />` → `<MoonPhaseArt … />`)
- Test: `e2e/lunar-calendar.spec.ts`

- [ ] **Step 1: Write the failing e2e test** `every day cell shows a phase engraving and keeps its accessible name` — на странице любого месяца окна у каждой `button.moon-month__pick` внутри есть `img[src^="/luna/phases/"]`, а имя кнопки по-прежнему содержит «освещено» и «%».
- [ ] **Step 2: Run** `pnpm test:e2e e2e/lunar-calendar.spec.ts` (нужны `dev:db`, `dev:web`); FAIL.
- [ ] **Step 3: Implement** замену; импорт `MoonDisc` оставить, он нужен в шапке `moon-stage__bar`.
- [ ] **Step 4: Run** e2e, `pnpm test`, `pnpm --filter web typecheck`; PASS.
- [ ] **Step 5: Commit** `feat(web): phase engravings in the calendar grid cells`.

---

### Task 3: Оформление ячеек и читаемость

**Files:**
- Modify: `apps/web/src/app/globals.css` (раздел лунного календаря, рядом с `.moon-month__grid .moon-mini`)

- [ ] **Step 1:** Стили `.moon-month__art` и `img` в ячейке: круглая маска (`border-radius: 50%` и `object-fit: cover` с увеличением ~1,25 так, чтобы видна была внутренняя Луна без рамки и звёзд), размер как у прежнего `.moon-mini`; на широком экране ячейка крупнее.
- [ ] **Step 2:** Сегодня (`.is-today`, `[aria-current="date"]`): золотая рамка и мягкое свечение; главные фазы (`data-event`): бронзовая рамка; выбранный день (`aria-pressed`) — как сейчас; наведение — приподнимается только внутри `no-preference`.
- [ ] **Step 3: Читаемость.** Скриншот 375 px: фаза в ячейке различима (серп от четверти). Если нет — на `max-width: 599px` скрыть `img` и показать прежний кружок через `.moon-month__art` + запасной `MoonDisc` (оба в разметке, CSS переключает; разметку в задаче 1 расширить при необходимости).
- [ ] **Step 4:** Сеть: во вкладке на странице месяца не больше 8 разных запросов к `/luna/phases/*-160.webp`; страница не растёт по весу заметно (проверить `read_network_requests`).
- [ ] **Step 5: Проверка.** 375 / 1280 px, `prefers-reduced-motion: reduce`, фокус виден, `pnpm test`, `pnpm typecheck`.
- [ ] **Step 6: Commit** `style(web): calendar cells with engraved phases, today glow and key phase frames`.

---

### Task 4: «Коллекция Луны» как альбом

**Files:**
- Modify: `apps/web/src/app/globals.css` (блок `.moon-collection*`, около строк 6899–6940)

- [ ] **Step 1:** Плитки крупнее (минимум 120 px, картинка до 112 px), закрытые — полупрозрачные силуэты (как сейчас `brightness` + `saturate`), открытые — в тонкой золотой рамке с лёгким свечением, плитка с `data-fresh="true"` светится заметнее; сетка делится на две подгруппы (знаки / фазы) через `data-kind` без изменения разметки (`grid` + порядок элементов уже по видам).
- [ ] **Step 2:** `.moon-collection__hint` поднять до 14 px, `.moon-collection__name` оставить 14 px; текст не наползает на соседние плитки на 375 px.
- [ ] **Step 3:** Анимация открытия (`moon-tile-open`) остаётся; новая — только внутри `no-preference`.
- [ ] **Step 4: Проверка.** Скриншоты 375 / 1280, контраст подписей на силуэтах не ниже 4,5:1, `pnpm test`, `pnpm typecheck`.
- [ ] **Step 5: Commit** `style(web): moon collection laid out as an album`.

---

### Task 5: Сдача

- [ ] **Step 1:** Скриншоты до и после в `docs/design/shots/3.3-lunar-calendar/{before,after}/`.
- [ ] **Step 2:** `pnpm typecheck`, `pnpm test`, `pnpm test:e2e e2e/lunar-calendar.spec.ts e2e/moon.spec.ts`; PASS.
- [ ] **Step 3:** PR из `style/lunar-calendar-engravings` в `master`, `get_status`/`bind_pr`. Merge делает владелица.
