# План 2б — платный разбор «Матрицы судьбы». План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (владелица просила экономить лимит: мелкие задачи выполняет контролёр сам, без отдельных исполнителей и ревьюеров; полное ревью — только задачи 3 и 6). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** На tvoy-orakul.ru под бесплатной матрицей продаётся «Разбор всей матрицы — 290 ₽»: вход через VK → оплата через ЮKassa → воркер собирает семь глав с GigaChat (или из блоков без ИИ) → разбор хранится в «Моём портрете».

**Architecture:** Как в Гранях. Покупки и разборы — таблицы в `packages/db`. Сервис покупок в `apps/web/src/server` меняет статус только после сверки с API ЮKassa и ставит задачу в очередь `pg-boss` (та же Postgres). `apps/worker` — отдельный контейнер: собирает вход из номеров арканов и готовых блоков `packages/content`, вызывает `packages/ai` (GigaChat, проверка ответа, запасной текст) и сохраняет разбор. Страница `/portret/razbor/[id]` опрашивает статус. Продажи включаются переменной `PAID_REPORTS`.

**Tech Stack:** как в 2а (Node 24, pnpm 12, TypeScript 6, Next.js 16.3, React 19.3, Drizzle 0.45 + PGlite в тестах, Vitest 5, Playwright 1.63, zod 4.6.5). Новые зависимости — только те, что уже проверены в Гранях: `pg-boss@12.31.1` (web и worker), `esbuild@0.28.2` (сборка воркера).

**Spec:** `docs/superpowers/specs/2026-09-28-matrix-paid-design.md`. **Каркас:** `docs/design/wireframes/matrix-paid.html`. **Макеты Codex (придут позже):** `docs/design/mockups/matrix-paid-*.webp`. **Источник переноса:** `C:\dev\grani-test` (пути ниже — от его корня).

**Как читать план.** Задачи, которые переносят проверенный код Граней, указывают исходный файл и список отличий — копировать его, а не писать заново. Новую логику план описывает интерфейсами и конкретными тест-кейсами; код пишется по TDD в момент выполнения. Полный код в плане не повторяется: исполнитель — контролёр с контекстом этой сессии, а владелица просила экономить лимит.

## Global Constraints

- Репозиторий `C:\dev\oracle`, ветка `feat/matrix-paid` (от `master` d575967). PR в `master` — после зелёного CI и «да» владелицы; мерж сразу выкладывает сайт.
- Команды pnpm в Git Bash: перед `pnpm ...` выполнить `export PATH="/c/Users/olya8/AppData/Roaming/npm:$PATH"`.
- Пространство имён `@oracle/*`. Слова `grani`/`Грани` в коде не встречаются (проверка из плана 1: `grep -rni grani --exclude-dir=node_modules --exclude-dir=docs --exclude-dir=.next --exclude=server-setup.md .` — пусто).
- Цена — `MATRIX_REPORT_PRICE_KOPECKS = 29_000` в `packages/core`, больше нигде числом не пишется.
- Тексты дословно: «Разбор всей матрицы — 290 ₽», «Войти и купить разбор», «Купить разбор — 290 ₽», «Открыть разбор», «Попробовать снова», поле «E-mail для чека», ссылка «Оферта». Обращение на «вы», нейтральный род, без предсказаний.
- Во входе ИИ нет имени, даты, e-mail, id пользователя и покупки — только номера/названия арканов и тексты блоков.
- Статус покупки меняет только `syncPayment` по ответу API шлюза. Тело уведомления ЮKassa не используется, кроме id платежа.
- Секреты (`YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `GIGACHAT_AUTH_KEY`, `SESSION_SECRET`) — только в `.env` на сервере и в локальном `.env.development.local` владелицы; в чат, репозиторий и логи не попадают. Ошибки env называют только имена переменных.
- Логи: без текста глав, ответов модели, e-mail и дат рождения.
- `/portret/*` и `/api/*` — `noindex`/`Disallow` (уже так). `/oferta` — публичная, в `sitemap.xml`.
- Доступность: текст ≥ 14 px (текст разбора ≥ 16 px), зоны нажатия ≥ 44 px, контраст AA, видимый фокус, `prefers-reduced-motion`, без горизонтальной прокрутки на 375 px. Статусы — `role="status"`, ошибки — `role="alert"`, один `<h1>`.
- Метрика — только после согласия: новые цели `report_offer_click`, `report_paid`, `report_opened`.
- Тесты: Vitest (AAA), репозитории на PGlite, e2e — Playwright на локальном приложении. Покрытие `packages/*/src`, `apps/web/src/server`, `apps/web/src/lib`, `apps/worker/src` ≥ 80 %.
- Коммиты — conventional commits на английском, без Co-Authored-By. Ответы владелице — по-русски.

## Задачи

| # | Что | Тип | Ревью |
|---|---|---|---|
| 1 | Контент: секции «В отношениях», «В деньгах и деле» × 22, `positions.md`, вывод на страницах арканов | контент + код | вычитка владелицы |
| 2 | `packages/core`: продукт, цена, главы разбора, очередь | код | самопроверка |
| 3 | `packages/db`: покупки, разборы, удаление данных | код, данные | **полное** |
| 4 | `packages/ai`: GigaChat, промпт ORACLE, проверка, запасной текст | код | самопроверка + тест «нет ПДн во входе» |
| 5 | `apps/worker` + Docker + выкладка | код, инфраструктура | самопроверка |
| 6 | Оплата на сайте: шлюз, сервис покупок, API, уведомления, тестовая оплата | код, оплата | **полное** |
| 7 | Документы: оферта, контакты, политика, подвал, AGENTS.md | тексты + код | вычитка владелицы |
| 8 | Экраны: блок продажи, страница разбора, «Разборы» в портрете, цели Метрики | UI | по макетам Codex |
| 9 | e2e, сборка, PR | проверка | финальная самопроверка |

Порядок: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9. Задачу 8 начинать, когда в `docs/design/mockups/` появятся макеты `matrix-paid-*`; до этого — по каркасу. Вычитка задачи 1 идёт параллельно с задачами 2–7 и блокирует только PR.

---

### Task 1: Контент — две новые секции арканов и описания глав

**Files:**
- Modify: `packages/content/src/arcana.ts` (SECTION_TITLES, тип `Arcanum`)
- Modify: `packages/content/arcana/*.md` × 22
- Create: `packages/content/positions.md`, `packages/content/src/positions.ts`, `packages/content/src/positions.test.ts`
- Modify: `packages/content/scripts/build-arcana.mjs` (собирать и `positions.md` → `src/generated/positions.json`)
- Modify: `packages/content/src/index.ts`, `packages/content/src/arcana.test.ts`, `packages/content/src/testing.ts` (образец аркана для тестов)
- Modify: `apps/web/src/app/matrica-sudby/[arkan]/page.tsx` (вывод двух секций)

**Interfaces:**
- Produces: `Arcanum.love: readonly string[]` (секция «В отношениях», абзацы), `Arcanum.money: readonly string[]` («В деньгах и деле»); `SECTION_TITLES.love = "В отношениях"`, `SECTION_TITLES.money = "В деньгах и деле"`.
- Produces: `type ChapterId = "core" | "task" | "love" | "money" | "family" | "purpose" | "scenario"` — **объявляется в `packages/core` (Task 2)**, здесь импортируется; `POSITIONS: Readonly<Record<ChapterId, string>>` — описание главы (2–3 предложения), `loadPositions(raw): Record<ChapterId, string>` с проверкой «все семь, непустые, без стоп-фраз».

Так как `ChapterId` нужен уже здесь, шаг 1 этой задачи — создать `packages/core/src/report.ts` только с `CHAPTER_IDS` и `ChapterId` (остальное — Task 2).

- [ ] **Step 1:** `packages/core/src/report.ts`: `export const CHAPTER_IDS = ["core", "task", "love", "money", "family", "purpose", "scenario"] as const; export type ChapterId = (typeof CHAPTER_IDS)[number];`, экспорт из `index.ts`.
- [ ] **Step 2 (RED):** в `arcana.test.ts` — файл без «В отношениях» → `ArcanumFormatError` «нет секции «В отношениях»»; файл с обеими секциями → `arcanum.love`/`arcanum.money` — массивы абзацев. `positions.test.ts`: полный файл → 7 ключей; нет `family` → ошибка с именем; стоп-фраза «вам суждено» → ошибка. Запустить `pnpm vitest run packages/content` — падает.
- [ ] **Step 3 (GREEN):** добавить ключи в `SECTION_TITLES` и `Arcanum`; `positions.ts` — формат `## core` … `## scenario` с текстом под заголовком; сборка пишет `generated/positions.json`; `index.ts` экспортирует `POSITIONS`.
- [ ] **Step 4:** черновики 44 блоков: в каждый `NN-slug.md` после «Как задача» — `## В отношениях` и `## В деньгах и деле`, по 2 абзаца. Правила 2а: собственные формулировки по общепринятым значениям, язык гипотез («может», «часто»), «вы», нейтральный род, без предсказаний, диагнозов и «кармы»; деньги — про отношение к делу и ресурсу, без обещаний дохода. `positions.md` — 7 описаний: что показывает точка/линия в матрице.
- [ ] **Step 5:** `pnpm content:build`, `pnpm vitest run packages/content` — зелёные (`arcana-data.test.ts` прогоняет стоп-список по всем 22).
- [ ] **Step 6:** страница аркана выводит новые секции теми же `ArcanumSection` (на телефоне — `<details>`, как остальные), порядок: Суть → В личности → В центре → Как задача → В отношениях → В деньгах и деле → ресурс/перекос → действие → вопрос. `pnpm typecheck`, `pnpm test`.
- [ ] **Step 7:** commit `feat(content): love and money sections for 22 arcana, chapter descriptions`.
- [ ] **Step 8:** выгрузить на вычитку `C:\Users\olya8\Documents\Твой-оракул-разбор-на-вычитку.md`: по каждому аркану две новые секции (`###`), затем `positions.md`. Правки владелицы вносить обратно в файлы; PR (Task 9) — только после её «да».

---

### Task 2: `packages/core` — продукт, главы, очередь

**Files:**
- Modify: `packages/core/src/report.ts`, `packages/core/src/index.ts`
- Create: `packages/core/src/report.test.ts`

**Interfaces:**
- Consumes: `Matrix`, `calculateMatrix` (`matrix.ts`), `CHAPTER_IDS`/`ChapterId` (Task 1).
- Produces:
  - `MATRIX_REPORT_PRODUCT = "matrix_report"`, `type Product = "matrix_report"`, `MATRIX_REPORT_PRICE_KOPECKS = 29_000`;
  - `CHAPTER_TITLES: Record<ChapterId, string>` — «Личность и центр», «Задача и точка роста», «Отношения», «Деньги и дело», «Род», «Предназначения», «Ваш сценарий»;
  - `CHAPTER_POINTS: Record<Exclude<ChapterId, "scenario">, readonly MatrixPoint[]>` — core `["A","E"]`, task `["D"]`, love `["love","heart"]`, money `["money","heart"]`, family `["F","G","H","I"]`, purpose `["personal","social","spiritual"]`; scenario — `["E"]` (выдаётся функцией ниже);
  - `reportChapters(matrix: Matrix): { id: ChapterId; title: string; arcana: number[] }[]` — 7 глав по порядку, номера из матрицы;
  - `QUEUES = { generateReport: "generate-report" } as const`, `type GenerateReportJob = { purchaseId: string }`, `generateReportJobKey(job) = "generate-report:" + purchaseId`, `GENERATE_JOB_OPTIONS = { retryLimit: 2, retryDelay: 30, retryBackoff: true, expireInSeconds: 900 }` (7 глав × до 3 попыток по 60 с — 900, а не 600, как в Гранях).
  - `SCENARIO_FIELDS = ["pattern","tension","resource","blindSpot","turningPoint","experiment","question"] as const` и `SCENARIO_TITLES` («Паттерн», «Напряжение», «Ресурс», «Слепая зона», «Точка изменения», «Эксперимент на 7 дней», «Вопрос для себя»).

- [ ] **Step 1 (RED):** `report.test.ts`: для 1988-11-18 `reportChapters` даёт core [18, 11], task [10], love [7, 4], money [5, 4], family [11, 19, 18, 10], purpose [11, 22, 6], scenario [11]; 7 глав в порядке `CHAPTER_IDS`; у каждой непустой `title`; `generateReportJobKey({ purchaseId: "p1" }) === "generate-report:p1"`.
- [ ] **Step 2 (GREEN):** реализовать; `pnpm vitest run packages/core` зелёный, покрытие `report.ts` 100 %.
- [ ] **Step 3:** commit `feat(core): matrix report product, chapters and queue`.

---

### Task 3: `packages/db` — покупки, разборы, удаление данных (полное ревью)

**Files:**
- Modify: `packages/db/src/schema.ts`
- Create: `packages/db/drizzle/0001_*.sql` (через `pnpm --filter @oracle/db db:generate`)
- Create: `packages/db/src/purchases.ts`, `packages/db/src/purchases.test.ts`, `packages/db/src/reports.ts`, `packages/db/src/reports.test.ts`, `packages/db/src/job-id.ts`, `packages/db/src/job-id.test.ts`
- Modify: `packages/db/src/delete-user.ts`, `packages/db/src/delete-user.test.ts`, `packages/db/src/index.ts`

Перенос: `packages/db/src/purchases.ts` и `job-id.ts` Граней. Отличия: одна цель — `birth_date` вместо `result_id/pair_id`; добавлен `receipt_email`; `reports` ссылаются на покупку.

**Schema:**
- `productEnum = pgEnum("product", ["matrix_report"])`, `purchaseStatusEnum = pgEnum("purchase_status", ["pending","succeeded","canceled"])`.
- `purchases`: `id` uuid pk defaultRandom; `user_id` uuid not null → `users.id` (без cascade: пользователь только помечается удалённым); `product` not null; `birth_date` date(mode string) null; `receipt_email` text null; `amount_kopecks` integer not null; `status` default `pending`; `yookassa_payment_id` text unique; `confirmation_url` text; `created_at`; `paid_at` timestamptz null. Индекс `purchases_user_idx (user_id, created_at)`.
- `reports`: `id` uuid pk; `purchase_id` uuid not null unique → `purchases.id` on delete cascade; `chapters` jsonb not null; `created_at`.

**Interfaces (Produces):**
- `type PurchaseRecord = { id; userId; product: Product; birthDate: string | null; receiptEmail: string | null; amountKopecks; status: PurchaseStatus; yookassaPaymentId: string | null; confirmationUrl: string | null; createdAt: Date; paidAt: Date | null }`
- `createPurchase(db, { userId, product, birthDate, receiptEmail, amountKopecks }): Promise<PurchaseRecord>`
- `attachPayment(db, purchaseId, { paymentId, confirmationUrl }): Promise<void>`
- `findOpenPurchase(db, { userId, product, birthDate, since: Date }): Promise<PurchaseRecord | null>` — `pending`, есть `confirmation_url`, `created_at >= since`, самая новая
- `findPaidPurchase(db, { userId, product, birthDate }): Promise<PurchaseRecord | null>` — самая ранняя `succeeded`
- `getPurchase(db, id)`, `getPurchaseByPaymentId(db, paymentId)` — невалидный uuid → `null` (`isUuid`)
- `markPurchaseSucceeded(db, id, paidAt): Promise<boolean>` — только из `pending` (`where status = 'pending'`), `true`, если строка изменилась
- `markPurchaseCanceled(db, id): Promise<void>` — только из `pending`
- `listPaidPurchases(db, userId): Promise<{ id; birthDate: string; ready: boolean; paidAt: Date }[]>` — `succeeded`, `birth_date is not null`, left join `reports`, новые сверху
- `type StoredChapter = { id: ChapterId; source: "ai" | "fallback"; paragraphs?: string[]; scenario?: Record<ScenarioField, string> }`
- `saveReport(db, { purchaseId, chapters: StoredChapter[] }): Promise<{ created: boolean }>` — `on conflict (purchase_id) do nothing`
- `getReport(db, purchaseId): Promise<{ chapters: StoredChapter[]; createdAt: Date } | null>`
- `jobIdFor(key: string): string` — копия из Граней.

- [ ] **Step 1 (RED) — `purchases.test.ts`:** создание → `pending`, сумма; `attachPayment` + `getPurchaseByPaymentId`; `findOpenPurchase`: находит свою дату, не находит другую дату/чужого пользователя/старше `since`/без ссылки/не `pending`; `markPurchaseSucceeded` дважды → `true`, затем `false`; из `canceled` → `false`; `markPurchaseCanceled` не трогает `succeeded`; `findPaidPurchase` возвращает самую раннюю из двух оплаченных; `listPaidPurchases`: только оплаченные, `ready` по наличию разбора, без покупок с обнулённой датой; мусорный id → `null`.
- [ ] **Step 2 (RED) — `reports.test.ts`:** `saveReport` дважды → `created` true, потом false, текст первого сохранён; `getReport` несуществующей → `null`; удаление покупки каскадом удаляет разбор (прямым `delete` в тесте).
- [ ] **Step 3 (RED) — `delete-user.test.ts`:** у пользователя оплаченная покупка с разбором → после `deleteUserData`: разбора нет, у покупки `birth_date` и `receipt_email` — `null`, `status`, `amount_kopecks`, `paid_at`, `yookassa_payment_id` на месте; покупки другого пользователя не тронуты.
- [ ] **Step 4:** `pnpm vitest run packages/db` — падает.
- [ ] **Step 5 (GREEN):** схема → `db:generate` (проверить SQL глазами: enum'ы, unique, cascade только у `reports`) → репозитории → в транзакции `deleteUserData`: `delete reports where purchase_id in (select id from purchases where user_id = $1)`, `update purchases set birth_date = null, receipt_email = null where user_id = $1`.
- [ ] **Step 6:** `pnpm vitest run packages/db`, `pnpm typecheck` — зелёные. Commit `feat(db): purchases and reports, data deletion clears them`.
- [ ] **Step 7:** полное ревью (ревьюер-агент, модель sonnet): схема, миграция, удаление данных, отсутствие утечек между пользователями. Исправить Critical/Important.

---

### Task 4: `packages/ai` — GigaChat, промпт ORACLE, проверка, запасной текст

**Files (Create):** `packages/ai/package.json`, `tsconfig.json`, `vitest.config.ts` (как у `packages/content`), `src/index.ts`, `src/providers/gigachat.ts` (+ test), `src/input.ts` (+ test), `src/prompt.ts` (+ test), `src/validate.ts` (+ test), `src/fallback.ts` (+ test), `src/generate.ts` (+ test).

Перенос: `packages/ai/src/providers/gigachat.ts`, `generate.ts` (таймаут и попытки), `validate.ts` (`extractJson`) Граней. Провайдер Yandex не переносится. В `gigachat.ts` модель — параметр `model` (из env воркера, по умолчанию `"GigaChat"`), `max_tokens: 2500`.

**Interfaces:**
- Consumes: `Matrix`, `reportChapters`, `CHAPTER_TITLES`, `SCENARIO_FIELDS` (core); `arcanumByNumber`, `POSITIONS`, `findStopPhrases` (content); `StoredChapter` (db — тип; чтобы `ai` не зависел от `db`, тип `GeneratedChapter` объявить в `ai` с той же формой, а `db` принимает его структурно).
- Produces:
  - `type ReportWriter = { name: string; complete(prompt: Prompt, signal: AbortSignal): Promise<string> }`, `createGigaChatWriter({ authKey, scope, model?, fetchFn })`;
  - `type ChapterInput = { chapter: ChapterId; title: string; position: string; arcana: { number: number; name: string; blocks: Record<string, string[]> }[]; previous?: string[] }` — **только это**;
  - `buildChapterInputs(matrix: Matrix): ChapterInput[]` — главы 1–6 (блоки по таблице спецификации §2); `buildScenarioInput(matrix, previous: string[]): ChapterInput`;
  - `buildPrompt(input: ChapterInput): { system: string; user: string }`;
  - `validateChapter(input, raw): { ok: true; chapter: GeneratedChapter } | { ok: false; reason: "not_json" | "schema" | "length" | "stop_words" }`;
  - `fallbackChapter(input): GeneratedChapter` (`source: "fallback"`);
  - `generateReport(writer: ReportWriter | null, matrix: Matrix, options?: { timeoutMs?; attempts?; log? }): Promise<GeneratedChapter[]>` — главы 1–6 параллельно (`Promise.all`), затем scenario с `previous` = первые абзацы глав 1–6.

**Правила промпта (system):** редактор сервиса самопознания «Твой оракул»; дано: описание позиции, арканы и готовые блоки; связать в цельный текст, опираться только на блоки, не добавлять фактов и историй; язык гипотез; обращение на «вы» к одному человеку; нейтральный род («вам может быть близко», не «вы уверена»); нельзя: предсказания будущего, сроки и события, диагнозы, болезни, лечение, «карма накажет», порча, гарантии дохода; ответ — только JSON без Markdown. Схема глав 1–6: `{"paragraphs": ["абзац", "…"]}` — 3–5 абзацев, вместе 1200–2500 знаков. Схема scenario: `{"pattern": "…", "tension": "…", "resource": "…", "blindSpot": "…", "turningPoint": "…", "experiment": "…", "question": "…"}` — каждое поле 1–4 предложения, `experiment` — одно конкретное действие на 7 дней, `question` оканчивается «?».

- [ ] **Step 1 (RED) — `input.test.ts`:** для 1988-11-18 `buildChapterInputs` даёт 6 глав с арканами из спецификации; `love` берёт блоки `love` арканов 7 и 4; `JSON.stringify` всех входов **не содержит** `1988`, `18.11`, `@`, uuid-шаблона и ключей `name|email|userId|purchaseId|birthDate` (тест «нет ПДн во входе»).
- [ ] **Step 2 (RED) — `validate.test.ts`:** текст в обёртке ```json → ok; 2 абзаца или 900 знаков → `length`; 3000 знаков → `length`; стоп-фраза → `stop_words`; scenario без `blindSpot` → `schema`; `question` без «?» → `schema`.
- [ ] **Step 3 (RED) — `fallback.test.ts`:** для каждой из 7 глав результат проходит ту же схему (длина для запасного не проверяется), `source: "fallback"`, первый абзац — описание позиции; scenario собран из ресурса/перекоса/действия/вопроса аркана центра.
- [ ] **Step 4 (RED) — `generate.test.ts`:** `writer = null` → 7 запасных глав без вызовов; писатель отдаёт валидный ответ → 7 глав `ai`, scenario вызван после шести с `previous`; писатель дважды мусор, потом валидно → `ai`, 3 вызова на главу; всегда таймаут (таймаут 10 мс) → `fallback`, в `log` нет текста ответа. `gigachat.test.ts` — перенос тестов Граней (токен кешируется, 401 сбрасывает токен, ошибка без тела ответа).
- [ ] **Step 5 (GREEN):** реализовать; `pnpm vitest run packages/ai`, `pnpm typecheck`.
- [ ] **Step 6:** commit `feat(ai): GigaChat chapter writer with ORACLE prompt and fallback`.

---

### Task 5: `apps/worker`, Docker и выкладка

**Files:**
- Create: `apps/worker/package.json` (зависимости `@oracle/ai`, `@oracle/content`, `@oracle/core`, `@oracle/db`, `pg-boss@12.31.1`, `zod@4.6.5`; dev `esbuild@0.28.2`), `tsconfig.json`, `vitest.config.ts`, `scripts/build.mjs`, `src/env.ts` (+ test), `src/ai.ts` (+ test), `src/generate.ts` (+ test), `src/log.ts`, `src/main.ts`
- Modify: `Dockerfile` (стадии `build-worker`, `worker`), `deploy/docker-compose.yml` (сервис `worker`), `deploy/env.example`, `.github/workflows/images.yml` (матрица `[web, migrate, worker]`), `.github/workflows/deploy.yml` (targets, `compose up … web worker`, смоук «worker started»), `deploy/server-setup.md` (сертификат Минцифры в `/opt/oracle/certs`), `vitest.config.ts` корня (покрытие `apps/worker/src`)

Перенос: `apps/worker/src/{env,ai,log,main}.ts`, `scripts/build.mjs` Граней и блоки воркера в их `Dockerfile`/compose/`deploy.yml`. Убрать: Telegram, VK, уведомления, Yandex, `grammy` (бандл без `external: grammy` — тогда в образ не нужны `node_modules`, только `dist/main.mjs`; проверить, что `pg-boss` работает из бандла, иначе оставить `node_modules` как в Гранях).

**Interfaces:**
- `readWorkerEnv(source)`: `DATABASE_URL`, `DATABASE_POOL_MAX` (default 3), `AI_PROVIDER` `none|gigachat` (default `none`), `GIGACHAT_AUTH_KEY` (обязателен при `gigachat`), `GIGACHAT_SCOPE` (default `GIGACHAT_API_PERS`), `GIGACHAT_MODEL` (default `GigaChat`).
- `runGenerate(job: GenerateReportJob, deps: { db; writer: ReportWriter | null; log }): Promise<void>`:
  1. `getReport(purchaseId)` есть → выход;
  2. `getPurchase` нет, не `succeeded` или `birthDate === null` → `log("info", "report skipped", { reason })`, выход;
  3. дубль: `findPaidPurchase(userId, product, birthDate).id !== purchaseId` → `log("warn", "duplicate paid purchase — refund manually", { purchaseId })`, выход;
  4. `calculateMatrix(parseBirthDate(birthDate))` → `generateReport` → `saveReport` → `log("info", "report generated", { sources: [...] })`.

- [ ] **Step 1 (RED) — `generate.test.ts`** (PGlite + фейковый писатель): оплаченная покупка → разбор из 7 глав; повторный запуск → писатель не вызывается; `pending` → пропуск; обнулённая дата → пропуск; вторая оплаченная той же даты → пропуск и `warn`; в логах нет текста глав. `env.test.ts`: `gigachat` без ключа → ошибка с именем `GIGACHAT_AUTH_KEY` и без значений; значения по умолчанию.
- [ ] **Step 2 (GREEN):** реализовать; `main.ts` — `PgBoss` (`createQueue(QUEUES.generateReport)`, `work` с логом ошибки и `throw`), `log("info", "worker started", { ai })`, graceful shutdown 20 с.
- [ ] **Step 3:** `pnpm --filter @oracle/worker build`, затем локально: `pnpm dev:db`, `node --env-file=apps/web/.env.development.local apps/worker/dist/main.mjs` → в логе «worker started».
- [ ] **Step 4:** Docker/compose/workflows. compose: `worker` — образ `ghcr.io/${GHCR_OWNER}/oracle-worker:latest`, `env_file: .env`, `restart: unless-stopped`, `mem_limit: 250m`, `stop_grace_period: 30s`, `volumes: ["./certs:/certs:ro"]`, сеть `shared`. `env.example`: `AI_PROVIDER=none`, `GIGACHAT_AUTH_KEY=`, `GIGACHAT_MODEL=GigaChat`, `NODE_EXTRA_CA_CERTS=/certs/russian_trusted_root_ca.pem`. `docker build --target worker .` локально проходит.
- [ ] **Step 5:** `pnpm test`, `pnpm typecheck`. Commit `feat(worker): report generation worker with pg-boss`.

---

### Task 6: Оплата на сайте (полное ревью)

**Files:**
- Create: `apps/web/src/server/payments/{gateway,yookassa,fake,ip}.ts` (+ tests), `apps/web/src/server/queue.ts`, `apps/web/src/server/payments-service.ts` (+ test), `apps/web/src/server/payments-deps.ts`
- Create: `apps/web/src/app/api/purchases/route.ts` (POST), `apps/web/src/app/api/purchases/[id]/route.ts` (GET статус), `apps/web/src/app/api/yookassa/notification/route.ts`, `apps/web/src/app/api/dev/pay/route.ts`, `apps/web/src/app/dev/pay/[id]/page.tsx`
- Modify: `apps/web/src/server/env.ts` (+ test), `apps/web/src/server/rate-limit.ts` (`purchaseLimiter`: 10 в минуту), `apps/web/package.json` (`pg-boss`), `apps/web/.env.development.example`

Перенос: `apps/web/src/server/payments/*`, `queue.ts`, `payments-service.ts`, `payments-deps.ts`, маршруты `api/purchases`, `api/yookassa/notification`, `api/dev/pay`, `dev/pay/[id]` Граней. Отличия ниже.

**Env:** `PAYMENTS` `off|fake|yookassa` (default `off`); при `yookassa` обязательны `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`; `fake` разрешён только вместе с `DEV_LOGIN=1`. `PAID_REPORTS` `on|off` (default `off`). `AppEnv.payments: null | { kind: "fake" } | { kind: "yookassa"; shopId; secretKey }`, `AppEnv.paidReports: boolean`.

**Шлюз:** `CreatePaymentInput` + `receiptEmail`; в теле платежа `metadata: { purchase_id, receipt_email }`, `description = paymentDescription(email)`: «Разбор матрицы судьбы — «Твой оракул», чек: <email>», если длиннее 128 знаков — «Разбор матрицы судьбы — «Твой оракул», чек: см. метаданные».

**Interfaces (payments-service):**
- `type PaymentsDeps = { db; gateway: PaymentGateway; appUrl; now; enqueueGenerate(job: GenerateReportJob): Promise<void> }`
- `startPurchase(deps, { userId, email: unknown }): Promise<{ ok: true; url: string } | { ok: false; error: "no_birth_date" | "invalid_email" | "already_paid" | "payment_failed"; purchaseId?: string }>` — дата берётся из портрета (`getBirthDate`), не из запроса; e-mail — `z.email()`, ≤ 254 знака; `already_paid` возвращает `purchaseId` оплаченной; `pending` той же даты моложе 30 минут → её ссылка.
- `retryPurchase(deps, { userId, purchaseId })` — «Попробовать снова»: покупка своя и `canceled` → `startPurchase` с её `receiptEmail`.
- `syncPayment(deps, paymentId): Promise<PurchaseRecord | null>` — как в Гранях: сверка `purchaseId` и суммы; `succeeded && paid` → `markPurchaseSucceeded` → `true` → если `findPaidPurchase(...).id === purchase.id` → `enqueueGenerate`, иначе `console.warn("duplicate paid purchase — refund manually", { purchaseId })`.
- `getPurchaseView(deps, { purchaseId, userId }): Promise<{ status: "pending" | "canceled" | "generating" | "ready"; birthDate: string | null; duplicateOf: string | null } | null>` — чужая/несуществующая → `null`; `pending` с платежом → `syncPayment`; `succeeded` без разбора → повторная постановка задачи (тот же `jobIdFor`); дубль → `duplicateOf` = id первой.

**Маршруты:**
- `POST /api/purchases` — `PAID_REPORTS` выключен или `payments === null` → 404; `isSameOrigin`; `purchaseLimiter`; сессия → 401; ошибки → 400/409/502 с `{ ok: false, error }`; успех → `{ ok: true, url }`. Тело `{ email }` или `{ retry: purchaseId }`.
- `GET /api/purchases/[id]` — только владельцу; `{ status }`; `Cache-Control: no-store`.
- `POST /api/yookassa/notification` — перенос без изменений (IP ЮKassa, только `object.id`, 200/403/404/500).
- `/dev/pay/[id]` + `POST /api/dev/pay` — только при `payments.kind === "fake"`, иначе 404; кнопки «Оплатить» / «Отменить» → `fake.complete` → `syncPayment` → редирект на `return_url`.

- [ ] **Step 1 (RED) — перенесённые тесты** шлюза (тело запроса: сумма `290.00`, `capture: true`, idempotence-key = id покупки, metadata с e-mail; разбор ответа; 404 → `null`), `ip.test.ts`, `fake.test.ts`; новый: `paymentDescription` ≤ 128 знаков на длинном адресе.
- [ ] **Step 2 (RED) — `payments-service.test.ts`** (PGlite + фейковый шлюз + массив поставленных задач): нет даты → `no_birth_date`; плохой e-mail → `invalid_email`, покупка не создана; успех → `pending` с датой портрета и e-mail, ссылка; повтор в течение 30 мин → та же ссылка, один платёж; дата сменилась → новая покупка; оплаченная дата → `already_paid` с id; шлюз бросает → `canceled` и `payment_failed`, в логе нет e-mail; `syncPayment` с чужим `purchaseId`/другой суммой → статус не меняется; успешный → `succeeded` + одна задача; повторный `syncPayment` → задач не прибавилось; `canceled` → `canceled`; двойная оплата → вторая `succeeded`, задача одна, `warn`; `getPurchaseView` чужого → `null`; `succeeded` без разбора → задача поставлена снова; `retryPurchase` для `pending`/чужой → ошибка.
- [ ] **Step 3 (RED) — `env.test.ts`:** `PAYMENTS=yookassa` без ключей → ошибка с именами; `fake` без `DEV_LOGIN=1` → ошибка; по умолчанию `payments: null`, `paidReports: false`.
- [ ] **Step 4 (GREEN):** реализовать; маршруты — тонкие, как `api/profile/birth-date/route.ts`.
- [ ] **Step 5:** `pnpm test`, `pnpm typecheck`. Commit `feat(web): matrix report purchases via YooKassa`.
- [ ] **Step 6:** полное ревью (ревьюер-агент, sonnet; плюс `ecc:security-reviewer` на `payments/*`, маршруты и env): подделка уведомления, чужие покупки (IDOR), двойное списание, утечки e-mail/ключей в логи и ответы, CSRF (`isSameOrigin`), отключение `fake` в проде. Исправить Critical/Important.

---

### Task 7: Документы — оферта, контакты, политика

**Files:**
- Modify: `apps/web/src/lib/legal.ts` (+ test), `apps/web/src/app/privacy/page.tsx`, `apps/web/src/app/contacts/page.tsx`, `apps/web/src/components/Footer.tsx`, `apps/web/src/lib/seo.ts` (PUBLIC_PATHS через `DOCUMENT_PATHS`), `AGENTS.md`
- Create: `apps/web/src/app/oferta/page.tsx`

**Изменения:**
- `DATA_RECIPIENTS` + ЮKassa (НКО «ЮМани» (ООО): сумма, назначение платежа, e-mail для чека; данные карты вводятся на стороне ЮKassa — «приём оплаты») + GigaChat (ПАО Сбербанк: номера арканов и тексты описаний без имени и даты — «подготовка текста платного разбора»). Поле `basis: "consent" | "contract"`; `LOGIN_CONSENT_RECIPIENTS` = только `consent` без Метрики (явный фильтр). Тест: список получателей в согласии тот же, что до плана 2б.
- `DOCUMENT_PATHS` + `/oferta`; `LEGAL_VERSIONS.privacy` и `LEGAL_DATES.privacy` — новая редакция в день PR (Task 9).
- Политика: цель «приём оплаты и отправка чека»; категории — e-mail для чека, данные о покупке; «после удаления данных сохраняются сумма, дата оплаты и номер платежа — для налогового учёта; дата рождения и e-mail в записи о покупке стираются»; разборы удаляются вместе с данными.
- `/oferta` (`publicMetadata`, индексируется): исполнитель — `OPERATOR` (самозанятая, ФИО, ИНН, e-mail); предмет — «Разбор матрицы судьбы», цена из `MATRIX_REPORT_PRICE_KOPECKS`; акцепт — оплата; услуга оказывается после оплаты, обычно за 1–2 минуты, доступ — в «Моём портрете» после входа через VK ID; чек «Мой налог» на указанный e-mail; возвраты: полный до показа разбора и при технических сбоях — по письму на e-mail исполнителя, в течение 10 дней, после показа разбора услуга считается оказанной; 18+; данные для подготовки текста; `DISCLAIMER`.
- `/contacts`: блок «Услуги и оплата» — что продаётся, цена, как получить, ссылка на оферту, e-mail.
- Подвал: ссылка «Оферта» после «Политика обработки данных».
- `AGENTS.md`: в «Тексты кнопок … дословно» — новые тексты; в таблицу «Где что лежит» — страница разбора и блок продажи; в «Не трогать» — `apps/worker/`, `apps/web/src/app/oferta` (вид — только через общие стили).

- [ ] **Step 1 (RED):** `legal.test.ts` — получатели в согласии не изменились; в политике есть ЮKassa и GigaChat; `/oferta` в `DOCUMENT_PATHS`; `seo.test.ts` — `/oferta` публичная.
- [ ] **Step 2 (GREEN):** реализовать; `pnpm test`, `pnpm typecheck`.
- [ ] **Step 3:** commit `feat(web): offer, contacts and privacy for paid reports`.
- [ ] **Step 4:** показать владелице тексты оферты, контактов и новых абзацев политики — правки до PR.

---

### Task 8: Экраны

**Files:**
- Create: `apps/web/src/components/matrix/ReportOffer.tsx`, `apps/web/src/lib/report-offer.ts` (+ test), `apps/web/src/app/portret/razbor/[id]/page.tsx`, `apps/web/src/app/portret/razbor/[id]/ReportWaiting.tsx`, `apps/web/src/components/report/ReportView.tsx`, `apps/web/src/lib/report-view.ts` (+ test)
- Modify: `apps/web/src/app/matrica-sudby/page.tsx`, `apps/web/src/components/matrix/MatrixCalculator.tsx`, `apps/web/src/app/portret/page.tsx`, `apps/web/src/lib/analytics.ts` (GOALS + 3), `apps/web/src/app/globals.css`

**Логика (без браузера, с тестами):**
- `offerState({ enabled, signedIn, date, paid: { birthDate; purchaseId }[] }): { kind: "hidden" } | { kind: "guest" } | { kind: "buy" } | { kind: "open"; purchaseId }` — выключено или нет даты → hidden.
- `reportHeading(chapters, matrix)` → «Ваш центр — {название аркана E}»; `formatReportDate("1988-11-18")` → «18.11.1988».

**Страницы:**
- `matrica-sudby/page.tsx` передаёт в калькулятор `paidReports = getEnv().paidReports && getEnv().payments !== null` и `paid = listPaidPurchases(user)`; `ReportOffer` — после блока сохранения, перед связкой с Лилой; оглавление из `reportChapters(matrix)`; гость — ссылка на `loginHref(MATRIX_PATH)`; «Купить» — если в портрете нет этой даты, сначала существующий `save(date)`, затем `POST /api/purchases` → `location.assign(url)`; ошибки — `role="alert"`; цель `report_offer_click`.
- `/portret/razbor/[id]` — `requireUser()`, `getPurchaseView` → `null` → `notFound()`; `metadata: { robots: noindex }`; `generating`/`pending` → клиентский `ReportWaiting` (опрос `GET /api/purchases/[id]` раз в 3 с, по `ready` → `router.refresh()`; `role="status"`; цель `report_paid` один раз на покупку — флаг в `sessionStorage`); `canceled` → «Оплата не прошла» + «Попробовать снова» (`POST /api/purchases { retry }`); `duplicateOf` → `redirect` на первый; `ready` → `ReportView` (обложка с `arcanumImage(E, 960)`, `<h1>`, «по дате …», оглавление-якоря, главы 1–6 абзацами с метками-ссылками на арканы, глава 7 — семь блоков, `DISCLAIMER`); цель `report_opened`.
- `/portret` — карточка «Разборы» (если `listPaidPurchases` непуст): строка «Разбор матрицы судьбы · по дате …», метка «готовится» без разбора, ссылка «Открыть разбор».
- Визуал — по макетам `docs/design/mockups/matrix-paid-*.webp` в системе `visual-direction.md`; новые цвета — только переменными в `:root`.

- [ ] **Step 1 (RED):** `report-offer.test.ts` (все 4 состояния; дата оплачена — `open` с id; другая дата — `buy`), `report-view.test.ts`.
- [ ] **Step 2 (GREEN):** логика + компоненты + стили.
- [ ] **Step 3:** ручная проверка в браузере на `PAYMENTS=fake`, `PAID_REPORTS=on`: 1440 и 375 px — покупка → `/dev/pay` → ожидание → разбор (запасной, воркер с `AI_PROVIDER=none`); нет горизонтальной прокрутки; фокус виден; скриншоты владелице.
- [ ] **Step 4:** `pnpm test`, `pnpm typecheck`. Commit `feat(web): report offer, report page and portrait list`.

---

### Task 9: e2e, сборка, PR

**Files:**
- Create: `e2e/paid.spec.ts`
- Modify: `e2e/playwright.config.ts` (env `PAYMENTS=fake`, `PAID_REPORTS=on`, запуск воркера `AI_PROVIDER=none` как второй `webServer`), `e2e/helpers.ts`

- [ ] **Step 1:** `paid.spec.ts`:
  - гость: расчёт 18.11.1988 → блок «Разбор всей матрицы — 290 ₽» с оглавлением 7 глав → «Войти и купить разбор» ведёт на `/login?next=%2Fmatrica-sudby`;
  - вход (`/api/dev/login?next=/matrica-sudby`) → «Купить разбор — 290 ₽» без e-mail → `role="alert"`; с e-mail → `/dev/pay/…` → «Оплатить» → страница разбора → статус → `<h1>` «Ваш центр — Сила», 7 глав;
  - назад на калькулятор → «Открыть разбор»; `/portret` → карточка «Разборы»;
  - отмена оплаты → «Оплата не прошла» → «Попробовать снова» ведёт на `/dev/pay/…`;
  - чужая покупка (второй пользователь) → 404;
  - «Удалить мои данные» → страница разбора 404;
  - 375 px: блок продажи и разбор без горизонтальной прокрутки.
  - Отдельный проект без `PAID_REPORTS`: блока нет, `POST /api/purchases` → 404.
- [ ] **Step 2:** `pnpm test:coverage` (≥ 80 %), `pnpm typecheck`, `pnpm test:e2e` (старые 21 + новые), `NEXT_PUBLIC_SITE_URL=https://tvoy-orakul.ru pnpm --filter @oracle/web build`, `docker build --target worker .`, проверка `grep -rni grani …` пусто.
- [ ] **Step 3:** дата и версия политики = день PR (`LEGAL_DATES`, `LEGAL_VERSIONS`, формат `YYYY-MM-vN`).
- [ ] **Step 4:** блокеры PR: владелица вычитала 44 блока и `positions.md` (Task 1) и тексты документов (Task 7). Затем — отчёт владелице со скриншотами и разрешение на push и PR. Мерж — только по её «да».

---

## Действия владелицы

Готовит Claude пошаговыми инструкциями в момент, когда шаг понадобится; выполняет владелица.

1. **До Task 6** (можно сразу): поддержка ЮKassa — подключат ли магазин с такой тематикой и можно ли включить автоматические чеки «Мой налог»; уведомление РКН — есть ли «адрес электронной почты» в категориях (если нет — информационное письмо об изменении сведений).
2. **Для Task 8 (локальная проверка на настоящем тестовом магазине, необязательно):** тестовый магазин ЮKassa, его `shopId` и ключ — в свой `apps/web/.env.development.local` (`PAYMENTS=yookassa`), не в чат.
3. **До выкладки (Task 9):** ключ GigaChat (личный кабинет разработчика Сбера, API для физлиц/самозанятых), сертификат Минцифры в `/opt/oracle/certs/`; в `/opt/oracle/.env`: `AI_PROVIDER=gigachat`, `GIGACHAT_AUTH_KEY`, `GIGACHAT_MODEL`, `NODE_EXTRA_CA_CERTS`, `PAYMENTS=off`, `PAID_REPORTS=off`.
4. **Выкладка:** мерж по «да» → сайт с выключенными продажами, оферта и контакты видны → заявка/модерация магазина в ЮKassa.
5. **Включение:** боевые ключи ЮKassa в `.env` (`PAYMENTS=yookassa`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`), адрес уведомлений `https://tvoy-orakul.ru/api/yookassa/notification` (события `payment.succeeded`, `payment.canceled`), `PAID_REPORTS=on`, перезапуск `web worker`.
6. **Проверка:** одна настоящая покупка → разбор с главами от ИИ (в логе воркера `sources` — `ai`) → e-mail виден в описании платежа → чек вручную в «Мой налог» → возврат через кабинет ЮKassa. Цели Метрики `report_offer_click`, `report_paid`, `report_opened` — завести в кабинете Метрики.
