# «Нить», этап 2: платный «Разбор нити» — план

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Платный «Разбор нити» за 490 ₽ по дате рождения: оплата, сборка шести глав воркером из готовых текстов, страница разбора, блок продажи на странице нити, пример. Всё за флагом `PAID_THREAD` (по умолчанию `off`).

**Architecture:** Копия потока «Разбора натальной карты» с двумя упрощениями. (1) Дата рождения лежит в уже существующем поле `purchases.birth_date` (его стирает удаление данных), новой колонки и снимка нет. (2) Главы собираются без ИИ из принятых текстов: сборщик — чистая функция в `@oracle/content`, воркер только читает покупку, зовёт сборщика и сохраняет главы в `reports.chapters`. Продукт `thread_report` добавляется значением в `product` enum базы.

**Tech Stack:** Next.js 16, TypeScript, Drizzle + Postgres, pg-boss (воркер), vitest, pnpm-монорепозиторий.

**Spec:** `docs/superpowers/specs/2026-11-18-life-thread-design.md` (раздел «Этап 2»); образец — «Платный разбор натальной карты» в `AGENTS.md`. Этап 1 (бесплатная страница, расчёт, тексты партии 9) — PR 255.

## Отличия от спеки (решения плана)

- **Без ИИ-редактора в первом выпуске.** Спека называет его «по желанию»; тексты уже написаны вручную, сборка детерминированная, в модель ничего не уходит. ИИ можно добавить позже тем же `AI_PROVIDER`.
- **PDF «Нить на стену» не входит.** Конвейер PDF матрицы привязан к её главам; спека оставляла решение за исполнителем. Картинка для сторис (этап 1) остаётся бесплатной.
- **Глава «Форма вашей линии» заменена на «Ваш ритм».** Личный год растёт на 1 каждый год, поэтому форма у всех одна и та же «пила», сдвинутая по фазе; осмысленно говорить о ритме: где была и где будет вершина, сколько лет до неё.
- **Новой колонки нет.** Дата в `purchases.birth_date`, а не отдельным снимком: у нити нет времени и места, лишнего для хранения.
- **Срок возврата 14 дней, как у натального разбора** (решение владелицы 2026-10-20 относилось к натальному): владелица подтверждает для нити в описании PR.

## Global Constraints

- Ветка `feat/web-life-thread-paid` от `feat/web-life-thread` (этап 1 ещё не влит). После мержа PR 255 — перебазировать на `master`. Один pull request, мерж только владелицей. Коммиты — conventional commits на английском.
- Перед сдачей: `pnpm install`, `pnpm typecheck`, `pnpm test`; сквозные тесты `pnpm test:e2e` (нужны `dev:db`, `dev:web`, `dev:worker`, `PAYMENTS=fake`, `PAID_THREAD=on` в `apps/web/.env.development.local`).
- Цена `THREAD_REPORT_PRICE_KOPECKS = 49_000` (490 ₽) — единственное место с ценой; блок продажи, оферта, контакты и платёж читают её отсюда.
- Дословно: заголовок блока «Разбор нити — 490 ₽», кнопки «Купить разбор — 490 ₽», «Войти и купить разбор — 490 ₽», «Получить разбор бесплатно» (владелица), «Открыть разбор», поле «E-mail для чека», «Попробовать снова», «Скачать PDF» не показываем (PDF в этот выпуск не входит). Цели Метрики: `thread_offer_view`, `thread_offer_click`, `thread_paid`, `thread_report_opened`.
- Для владелицы платное бесплатно: покупка на 0 ₽ без шлюза и почты (`isOwner`), цели Метрики не считаются, в список чеков не попадает.
- Дата рождения, e-mail и тексты глав не попадают в логи; в лог только id покупки и причины. В модель ничего не уходит (ИИ в выпуске нет).
- Тексты разбора пишет Claude партией 10 (27 карточек); пока партия 10 не принята владелицей, блок продажи и покупка закрыты, даже при `PAID_THREAD=on` (`THREAD_REPORT_READY`, Task 12).
- Слова-оценки «благоприятный/неблагоприятный», «плохой», «спад», обещания предсказать и «карма» в текстах запрещены (проверяют существующие тесты текстов).
- Правки существующих файлов только добавлениями (новое значение enum, новые ветки по продукту, новые флаги, цели). Тексты оферты и контактов — юридические: добавляются абзацы про новый продукт, их согласует владелица (в описании PR отдельным пунктом).
- Мобильные в приоритете (375 px, текст не мельче 14 px, зоны нажатия не меньше 44 px), движение только в `prefers-reduced-motion: no-preference`, внешних CDN нет.

## Review Focus

1. Покупатель оплатил дважды ту же дату (две вкладки, повтор после отмены): вторая покупка не продаётся (`already_paid`), воркер не строит второй разбор и пишет «refund manually» (Task 9, Task 10).
2. Дата рождения 29 февраля и 31-е число: личные месяцы начинаются в последний день короткого месяца, цепочка из 12 отрезков не рвётся и не пересекается (Task 2).
3. Родился в этом году или в 1900-м: «семь лет вперёд» и «прошлые годы» не выходят за границы жизни, глав без блоков нет (Task 8).
4. Удаление данных пользователем между оплатой и сборкой: у покупки `birth_date = null`, воркер молча пропускает, страница разбора не падает (Task 9, Task 11).
5. Флаг `PAID_THREAD=off` или партия 10 не принята: блок продажи не показан, `POST /api/purchases` с `thread_report` отвечает как для выключенного продукта, воркер ничего не строит (Task 10, Task 12).
6. Запрос с датой из будущего или мусором: отказ `invalid_birth`, ничего не создаётся и не логируется (Task 10).

---

### Task 1: Продукт и задача в `@oracle/core`

**Files:**
- Modify: `packages/core/src/report.ts`
- Test: `packages/core/src/report.test.ts`

**Interfaces:**
- Produces: `THREAD_REPORT_PRODUCT = "thread_report"`; `Product` включает `typeof THREAD_REPORT_PRODUCT`; `THREAD_REPORT_PRICE_KOPECKS = 49_000`; `QUEUES.generateThreadReport = "generate-thread-report"`; `type GenerateThreadReportJob = { purchaseId: string }`; `GENERATE_THREAD_JOB_OPTIONS` (те же, что `GENERATE_JOB_OPTIONS`, `expireInSeconds: 300`: сборка без ИИ); `generateThreadReportJobKey(job): string` (`generate-thread-report:<id>`).

- [ ] **Step 1: Failing test** в `report.test.ts`: цена 49000; `QUEUES.generateThreadReport` равен `"generate-thread-report"`; `generateThreadReportJobKey({ purchaseId: "abc" })` равен `"generate-thread-report:abc"`; `GENERATE_THREAD_JOB_OPTIONS.expireInSeconds` равен 300.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run packages/core/src/report.test.ts`
- [ ] **Step 3: Implement** константы и тип по образцу натальных.
- [ ] **Step 4: Run to verify PASS** и `pnpm --filter @oracle/core typecheck`.
- [ ] **Step 5: Commit** `feat(core): thread report product, price and job`

---

### Task 2: Личные месяцы

**Files:**
- Modify: `packages/core/src/life-thread.ts`
- Test: `packages/core/src/life-thread.test.ts`

**Interfaces:**
- Consumes: `LifeThread`, `ThreadYear`, `BirthDate`, `foldToNine` (Task 1 этапа 1).
- Produces: `type ThreadMonth = { readonly index: number; readonly value: number; readonly start: string; readonly end: string }` (`index` 1…12, `start`/`end` — ISO, `end` — день перед следующим началом; 12-й отрезок кончается днём перед началом следующего личного года); `personalMonthsOf(birth: BirthDate, year: ThreadYear): readonly ThreadMonth[]`.

- [ ] **Step 1: Failing test** (дата 15.07.1990, год 2026 со значением 5): 12 отрезков; первый `{ index: 1, start: "2026-07-15", end: "2026-08-14" }`; число первого месяца = `foldToNine(5 + 7)` = 3 (календарный месяц начала — июль); второй начинается 15 августа, число `foldToNine(5 + 8)` = 4; последний кончается `"2027-07-14"`. Дата 31.01.1991, год 2026: отрезок, начинающийся в феврале, стартует `"2026-02-28"`, следующий — `"2026-03-31"`, цепочка без дыр и пересечений (каждый `start` равен `end` предыдущего плюс день). Дата 29.02.1992, год 2027: первый отрезок начинается `"2027-03-01"`.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run packages/core/src/life-thread.test.ts`
- [ ] **Step 3: Implement.** Число месяца — `foldToNine(year.value + календарный месяц начала)`; день начала — день рождения, но не больше числа дней в месяце (последний день короткого месяца).
- [ ] **Step 4: Run to verify PASS.**
- [ ] **Step 5: Commit** `feat(core): personal months for the thread report`

---

### Task 3: База: значение `thread_report`

**Files:**
- Modify: `packages/db/src/schema.ts` (`productEnum` + `"thread_report"`)
- Create: `packages/db/drizzle/0009_*.sql` и снимок в `packages/db/drizzle/meta/` (генерирует `pnpm --filter @oracle/db db:generate`; имя и номер выдаст drizzle, проверить, что номер следующий после `0008`)
- Test: `packages/db/src/purchases.test.ts`

**Interfaces:**
- Consumes: `THREAD_REPORT_PRODUCT` (Task 1).
- Produces: `createPurchase(db, { product: "thread_report", birthDate: "1990-07-15", … })` сохраняет дату в `birth_date`, `natal_input` и `input_key` пусты; `findPaidPurchase(db, { userId, product, birthDate, inputKey: null })` находит оплаченную.

- [ ] **Step 1: Failing test** в `purchases.test.ts` по образцу натальных проверок: покупка `thread_report` создаётся с датой; после `markPurchaseSucceeded` `findPaidPurchase` с тем же ключом находит её, с другой датой — нет.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run packages/db/src/purchases.test.ts` (как поднимаются тестовая база и миграции — как у соседних тестов этого файла).
- [ ] **Step 3: Implement** enum и миграцию `ALTER TYPE "public"."product" ADD VALUE 'thread_report';`.
- [ ] **Step 4: Run to verify PASS;** убедиться, что существующий тест удаления данных (`delete-user.test.ts`) зелёный: у покупки нити `birth_date` обнуляется.
- [ ] **Step 5: Commit** `feat(db): thread_report product`

---

### Task 4: Виды текстов `month`, `past`, `rules` (партия 10)

**Files:**
- Modify: `packages/content/src/numerology-manifest.ts`, `packages/content/src/numerology.ts`, `packages/content/src/numerology.test.ts`

**Interfaces:**
- Produces: `NumerologyKind` включает `"month" | "past" | "rules"`; ключи 1–9; партия 10 (27 страниц), в `NUMEROLOGY_ACCEPTED_BATCHES` **не** добавлять. Разделы: `month` — «Тема месяца», «Как его провести»; `past` — «Если вспомнить этот год», «Вопросы себе»; `rules` — «Три правила» (ровно три пункта `- `), «Вопрос на год». Минимум знаков: `month` 900, `past` 900, `rules` 600. Существующий счётчик `NUMEROLOGY_PAGES` увеличивается на 27 (87 → 114), в тесте обновить.

- [ ] **Step 1: Failing test** (по образцу блока «thread and period pages (batch 9)»): партия 10 — 27 страниц, по девять каждого вида; образцы парсятся со своими разделами и отклоняются с чужими; `rules` с двумя пунктами отклоняется; короткий текст отклоняется (`/900/`, `/600/`); пока партия 10 не принята, `acceptedNumerologyPages` каждого вида пуст.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run packages/content/src/numerology.test.ts`
- [ ] **Step 3: Implement** по образцу Task 3 этапа 1 (`KINDS`, `NUMEROLOGY_SECTION_TITLES`, `NUMEROLOGY_MIN_BODY`, манифест, сообщение об ошибке `kind`).
- [ ] **Step 4: Run to verify PASS** (весь файл).
- [ ] **Step 5: Commit** `feat(content): month, past and rules text kinds, batch 10`

---

### Task 5: Девять карточек «Личный месяц с числом N»

**Files:**
- Create: `packages/content/numerology/month-1.md` … `month-9.md`

**Interfaces:**
- Consumes: формат Task 4 (`kind: month`, `batch: 10`, шапка и описание 90–175 знаков).

- [ ] **Step 1:** написать девять карточек: тема месяца для числа N (внутри личного года, любого), как провести месяц: два-три практических шага. Без прогнозов, на «вы».
- [ ] **Step 2:** `pnpm content:build`, затем `pnpm exec vitest run packages/content`. Expected: PASS.
- [ ] **Step 3: Commit** `feat(content): nine personal month cards (batch 10)`

---

### Task 6: Девять карточек «Если вспомнить год N»

**Files:**
- Create: `packages/content/numerology/past-1.md` … `past-9.md`

- [ ] **Step 1:** написать: что обычно просит год N цикла, и три-четыре вопроса себе (не «совпало ли», а «что вы тогда начинали/заканчивали/откладывали»); без утверждения, что прошлое подтверждает прогноз.
- [ ] **Step 2:** `pnpm content:build` и `pnpm exec vitest run packages/content`. Expected: PASS.
- [ ] **Step 3: Commit** `feat(content): nine past-year cards (batch 10)`

---

### Task 7: Девять карточек «Три правила года N»

**Files:**
- Create: `packages/content/numerology/rules-1.md` … `rules-9.md`

- [ ] **Step 1:** написать: три коротких правила года N (пункты `- `) и вопрос на год; правила — приёмы, а не запреты и не приговоры.
- [ ] **Step 2:** `pnpm content:build` и `pnpm exec vitest run packages/content`. Expected: PASS.
- [ ] **Step 3: Commit** `feat(content): nine rules cards (batch 10)`

---

### Task 8: Сборщик глав

**Files:**
- Create: `packages/content/src/thread-report.ts`
- Create: `packages/content/src/thread-report-texts.ts` (вступления глав и подписи, константы)
- Create: `packages/content/src/thread-report.test.ts`
- Modify: `packages/content/package.json` (`exports`: `"./thread-report": "./src/thread-report.ts"`)

**Interfaces:**
- Consumes: `LifeThread`, `ThreadMonth`, `personalMonthsOf` (Task 2); `NumerologyText`, `NumerologyKind` (Task 4); `YEAR_NAMES` не используем (в пакете `content` его нет) — названия лет берёт `THREAD_YEAR_NAMES` из `thread-report-texts.ts` (те же девять слов).
- Produces: `THREAD_CHAPTER_IDS = ["now", "years", "past", "periods", "rhythm", "rules"] as const`; `type ThreadChapterId`; `THREAD_CHAPTER_TITLES: Record<ThreadChapterId, string>` («Где вы сейчас», «Семь лет вперёд», «Прошлые годы», «Четыре периода жизни», «Ваш ритм», «Три правила и вопрос на год»); `type ThreadBlock = { heading?: string; paragraphs: string[] }`; `type ThreadChapter = { id: ThreadChapterId; source: "fallback"; blocks: ThreadBlock[] }`; `type ThreadTextReader = (kind: NumerologyKind, key: string) => NumerologyText | undefined`; `buildThreadReport(thread: LifeThread, read: ThreadTextReader): ThreadChapter[]`.

- [ ] **Step 1: Failing test** (дата 15.07.1990, `today` 2026-11-18, читатель — фикстура с короткими текстами, где каждый абзац содержит название раздела): шесть глав в порядке `THREAD_CHAPTER_IDS`; «now»: вступление + блок текущего года (5) + ровно 12 блоков месяцев с заголовками вида `"15 июля — 14 августа"`; «years»: блоки 2027…2033, заголовок `"2027 · год 6 · забота"`; «past»: блоки 2022…2025 (четыре года назад до прошлого), у каждого вопросы из `past`; «periods»: четыре блока с заголовком `"I период · формирование · 1990–2021"` (последний `"IV период · мудрость · с 2039"`); «rhythm»: абзацы с фактами — прошлая вершина 2020, ближайшая 2029, до неё три года, длина цикла девять лет; «rules»: три пункта правил текущего года и вопрос. Краевые случаи: родился в 2026 — «past» без блоков по годам до рождения, но с абзацем-вступлением («пока прошлого мало»); родился в 1900 — не падает; читатель без какого-то текста (`undefined`) — бросает ошибку `thread report: missing <kind>-<key>` (воркер её залогирует).
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run packages/content/src/thread-report.test.ts`
- [ ] **Step 3: Implement.** Из карточки берутся: для текущего года — «Тема года» и «На что опереться» целиком; для будущих лет — первый абзац «Тема года» и первый абзац «Где осторожнее» из `thread`; для периодов — первый абзац «Силы» и «Трудности» из `period` плюс «Как пройти границу» у текущего и следующего периода; для месяцев — «Тема месяца» из `month`; для прошлого — «Вопросы себе» из `past`; для правил — пункты «Три правила» и «Вопрос на год» из `rules` текущего года. «rhythm» — шаблонные предложения из `thread-report-texts.ts` с подставленными годами (прошлая и следующая вершина — годы со значением 8).
- [ ] **Step 4: Run to verify PASS;** `pnpm exec vitest run packages/content`.
- [ ] **Step 5: Commit** `feat(content): thread report chapter builder`

---

### Task 9: Воркер

**Files:**
- Create: `apps/worker/src/generate-thread.ts`
- Create: `apps/worker/src/generate-thread.test.ts`
- Modify: `apps/worker/src/main.ts` (создать очередь `QUEUES.generateThreadReport`, `boss.work`, как для натальной)
- Modify: `packages/db/src/reports.ts` (`StoredThreadChapter`, `getThreadReport`)

**Interfaces:**
- Consumes: `GenerateThreadReportJob` (Task 1); `buildThreadReport` (Task 8); `calculateLifeThread` (этап 1); `numerologyText` из `@oracle/content/numerology`.
- Produces: `runGenerateThread(job, deps: { db: Database; log: Logger; now?: () => Date }): Promise<void>`; `StoredThreadChapter = { id: ThreadChapterId; source: "fallback"; blocks: { heading?: string; paragraphs: string[] }[] }`; `getThreadReport(db, purchaseId): Promise<{ chapters: StoredThreadChapter[]; createdAt: Date } | null>`.

- [ ] **Step 1: Failing test** (по образцу `generate-natal.test.ts`): оплаченная покупка `thread_report` с датой → сохраняется отчёт из шести глав; повторный запуск ничего не меняет; неоплаченная покупка и покупка с `birth_date = null` (данные удалены) пропускаются без ошибки; вторая оплата той же даты логирует `"duplicate paid purchase — refund manually"` и не строит отчёт; в лог не попадают дата и текст глав.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run apps/worker/src/generate-thread.test.ts`
- [ ] **Step 3: Implement** по образцу `runGenerateNatal` без ИИ: `calculateLifeThread(birthDate, now())`, `buildThreadReport(thread, numerologyText)`, `saveReport`.
- [ ] **Step 4: Run to verify PASS;** `pnpm --filter @oracle/worker typecheck`.
- [ ] **Step 5: Commit** `feat(worker): thread report generation`

---

### Task 10: Покупка: сервис, API, флаг, аналитика

**Files:**
- Modify: `apps/web/src/server/payments-service.ts` (`PRODUCT_DESCRIPTIONS.thread_report` = «Разбор нити — «Твой оракул»», `reportPrice`, `enqueueReport`, `PaymentsDeps.enqueueGenerateThread`, новая `startThreadPurchase`)
- Modify: `apps/web/src/server/payments-deps.ts` (подключить очередь по образцу `enqueueGenerateNatal`)
- Modify: `apps/web/src/app/api/purchases/route.ts` (ветка `product: "thread_report"`, `birth: "ГГГГ-ММ-ДД"`)
- Modify: `apps/web/src/server/env.ts` (`PAID_THREAD`, `paidThread`), `deploy/env.example` (`PAID_THREAD=off`), `apps/web/.env.development.example` (`PAID_THREAD=on`)
- Modify: `apps/web/src/lib/purchase-analytics.ts` (`thread_report: { name: "Разбор нити", goal: "thread_paid" }`), `apps/web/src/lib/analytics.ts` (`GOALS` + `"thread_offer_view"`, `"thread_offer_click"`, `"thread_paid"`, `"thread_report_opened"`; `CheckoutProduct` + `"thread"`)
- Test: `payments-service.test.ts`, `route` тест рядом, `env.test.ts`, `analytics.test.ts` (список целей), `purchase-analytics.test.ts`

**Interfaces:**
- Consumes: `THREAD_REPORT_PRODUCT`, `THREAD_REPORT_PRICE_KOPECKS`, `GenerateThreadReportJob` (Task 1); `calculateLifeThread` (этап 1); `isOwner` (как у соседних).
- Produces: `startThreadPurchase(deps, p: { userId: string; email: unknown; birth: unknown }): Promise<StartPurchaseOutcome>` — проверка `birth` строго: строка `ГГГГ-ММ-ДД`, `calculateLifeThread(birth, deps.now())` не `null`, иначе `invalid_birth`; почта обязательна, кроме владелицы; покупка `purchaseFor(... product: THREAD_REPORT_PRODUCT, birthDate, email)`; `retryPurchase` для `thread_report` повторяет по сохранённой `birthDate` (после удаления данных — `not_found`).

- [ ] **Step 1: Failing tests:** выключенный продукт и мусор в теле → отказы `invalid_birth` / как у выключенного натального (повторить формулировку соседних тестов); обычный покупатель без почты — `invalid_email`; с почтой — создаётся платёж на 49000 с описанием «Разбор нити — «Твой оракул», чек: …»; владелица — покупка на 0 ₽, воркерская задача ставится сразу (`enqueueGenerateThread` вызван один раз); повторная покупка той же даты после оплаты — `already_paid`; `retryPurchase` по отменённой покупке нити; `PAID_THREAD` по умолчанию `off`; `GOALS` содержит четыре новые цели; платёж с продуктом нити даёт цель `thread_paid` в аналитике покупок.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run apps/web/src/server apps/web/src/app/api/purchases apps/web/src/lib/analytics.test.ts apps/web/src/lib/purchase-analytics.test.ts`
- [ ] **Step 3: Implement** по образцу `startNatalPurchase`; существующие тесты не менять, кроме точного списка целей в `analytics.test.ts` (дописать новые).
- [ ] **Step 4: Run to verify PASS** тех же тестов и `pnpm --filter @oracle/web typecheck`.
- [ ] **Step 5: Commit** `feat(web): thread report purchase, flag and goals`

---

### Task 11: Страница разбора и ожидание

**Files:**
- Create: `apps/web/src/components/report/ThreadReportView.tsx`, `ThreadReportView.test.tsx`
- Modify: `apps/web/src/app/portret/razbor/[id]/page.tsx` (ветка `view.product === "thread_report"`), `ReportWaiting.tsx` (`product` принимает `"thread_report"`, подписи и ссылка «Вернуться к нити»), `ReportGoals.tsx` (цель `thread_report_opened` для нити)
- Modify: `apps/web/src/lib/natal-copy.ts` не трогаем; тексты разбора нити — новый `apps/web/src/lib/thread-copy.ts`

**Interfaces:**
- Consumes: `getThreadReport`, `StoredThreadChapter` (Task 9); `THREAD_CHAPTER_TITLES` (Task 8); `ThreadChart` (этап 1) для картинки на странице разбора (нить на всю жизнь, `initialMode="all"`).
- Produces: `ThreadReportView({ chapters, birthDate }: { chapters: readonly StoredThreadChapter[]; birthDate: string })` — заголовок «Разбор нити», оглавление шести глав, главы с блоками (`h3` у блока), картинка нити; `thread-copy.ts` — `THREAD_REPORT_TITLE`, `THREAD_WAITING_BODY` (ожидание без процентов), `THREAD_BACK_LABEL`.

- [ ] **Step 1: Failing test** (`renderToStaticMarkup`): все шесть глав с заголовками из `THREAD_CHAPTER_TITLES`, блок с заголовком «2027 · год 6 · забота», один `<h1>`, оглавление со ссылками-якорями; данные из пустого списка глав не падают; в разметке нет слов-оценок.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run apps/web/src/components/report/ThreadReportView.test.tsx`
- [ ] **Step 3: Implement.** Оформление — как у `NatalReportView` (оглавление, карточки глав), стили в `grafik-sudby/thread.css`.
- [ ] **Step 4: Run to verify PASS;** вручную: `pnpm dev:*`, купить как владелица на `PAID_THREAD=on` и открыть `/portret/razbor/<id>` (ожидание → готовый разбор).
- [ ] **Step 5: Commit** `feat(web): thread report page`

---

### Task 12: Блок продажи на странице нити

**Files:**
- Create: `apps/web/src/components/numerology/ThreadReportOffer.tsx`, `ThreadReportOffer.test.tsx`
- Modify: `apps/web/src/components/numerology/ThreadResult.tsx` (блок под периодами, только если передано `offer`), `ThreadCalculator.tsx`, `apps/web/src/app/numerologiya/grafik-sudby/page.tsx` (передаёт `offer` из флагов), `apps/web/src/lib/thread-copy.ts`, `apps/web/src/lib/numerology-pages.ts` (`THREAD_REPORT_READY`: функция `threadReportReady(): boolean` — партия 10 принята), `thread-fixtures.ts` для тестов
- Образец: `NatalReportOffer.tsx` и то, как `natalnaya-karta/page.tsx` передаёт флаги (`PAID_NATAL`, `PAYMENTS`, вошёл ли пользователь).

**Interfaces:**
- Produces: `ThreadReportOffer({ iso, signedIn, owner })`; кнопки по дословным текстам; покупка — `POST /api/purchases` `{ product: "thread_report", email, birth: iso }`; перед входом дата передаётся через `sessionStorage` вкладки, как у натальной; цели `thread_offer_view` (один раз при показе) и `thread_offer_click`. Блок показан, если `paidThread && payments && threadReportReady()`.

- [ ] **Step 1: Failing test:** при выключенном флаге или непринятой партии 10 блока нет; при включённом — заголовок «Разбор нити — 490 ₽», кнопка «Войти и купить разбор — 490 ₽» для гостя и «Купить разбор — 490 ₽» для вошедшего, поле «E-mail для чека»; для владелицы — «Получить разбор бесплатно» без поля почты; цена берётся из `THREAD_REPORT_PRICE_KOPECKS`.
- [ ] **Step 2: Run to verify FAIL:** `pnpm exec vitest run apps/web/src/components/numerology/ThreadReportOffer.test.tsx apps/web/src/app/numerologiya/grafik-sudby`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run to verify PASS.**
- [ ] **Step 5: Commit** `feat(web): thread report offer`

---

### Task 13: Пример `/numerologiya/grafik-sudby/primer`

**Files:**
- Create: `apps/web/src/app/numerologiya/grafik-sudby/primer/page.tsx`, `page.test.tsx`
- Modify: `apps/web/src/lib/numerology-pages.ts`, `apps/web/src/lib/seo.ts` (адрес в карте сайта при готовности)

**Interfaces:**
- Produces: страница-пример: тот же `ThreadReportView` на вымышленной дате 15.07.1990 с замороженным «сегодня» 2026-11-18 (`DEMO_TODAY`), подпись «Пример на вымышленной дате», ссылка на нить; открыта только при принятой партии 10, иначе 404; `noindex` не нужен.

- [ ] **Step 1: Failing test:** без принятой партии 10 — 404 (мок закрытого состояния, как в этапе 1); с принятой — шесть глав, надпись «Пример на вымышленной дате», нет полей ввода даты.
- [ ] **Step 2: Run to verify FAIL.**
- [ ] **Step 3: Implement** (сборка на сервере из `buildThreadReport`).
- [ ] **Step 4: Run to verify PASS.**
- [ ] **Step 5: Commit** `feat(web): thread report example page`

---

### Task 14: Оферта, документация, сквозной тест, сдача

**Files:**
- Modify: `apps/web/src/app/oferta/page.tsx`, `apps/web/src/app/contacts/page.tsx`, `apps/web/src/lib/legal.ts` (описание продукта, цена из константы, перечень данных: дата рождения передаётся при покупке и стирается при удалении данных). **Юридические тексты: только добавления, согласует владелица.**
- Modify: `docs/analytics-goals.md`, `AGENTS.md` (строка «Платный разбор нити» по образцу натальной)
- Create: `e2e/thread-paid.spec.ts` (по образцу `e2e/natal-paid.spec.ts`: владелица покупает бесплатно, разбор открывается; гость идёт на вход)
- Modify: `apps/web/src/app/numerologiya/grafik-sudby/thread.css` (стили блока продажи и разбора)

- [ ] **Step 1:** тесты оферты и контактов, если они сверяют цены и перечень продуктов (`oferta/page.test.tsx`, `contacts/page.test.tsx`), дополнить проверкой нового продукта и цены 490 ₽.
- [ ] **Step 2:** `pnpm install && pnpm typecheck && pnpm test` — зелёные; `pnpm test:e2e` с `PAID_THREAD=on` — новый сценарий зелёный.
- [ ] **Step 3:** проверка в браузере на 1440 и 375 px: блок продажи, ожидание, готовый разбор, пример; без горизонтальной прокрутки.
- [ ] **Step 4: Commit** `docs(web): thread report in terms, contacts and project notes`; открыть pull request. В описании: что включается флагом `PAID_THREAD` и партией 10; миграция базы (одно значение enum) — применить при выкладке; что должна принять владелица (27 текстов партии 10, абзацы оферты и контактов, срок возврата 14 дней как у натального разбора).
