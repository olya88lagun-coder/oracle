# План 8, этап 1 — платный разбор натальной карты: основа

> **Для исполнителя:** использовать superpowers:executing-plans (выбран inline: один исполнитель в этой сессии). Шаги — чекбоксы.

**Цель:** человек с известным временем рождения может купить «Разбор натальной карты — 490 ₽» (за флагом `PAID_NATAL`, по умолчанию выключен), оплатить через ЮKassa (в разработке — тестовый шлюз), дождаться генерации и открыть разбор в «Моём портрете». Главы собираются воркером из готовых блоков без ИИ.

**Архитектура:** продукт `natal_report` рядом с `matrix_report` и `lila_session`: те же таблицы `purchases` и `reports`, тот же шлюз, очередь `pg-boss` (отдельная очередь `generate-natal-report`), та же страница `/portret/razbor/[id]`. Данные рождения приходят в запросе покупки и сохраняются в покупке снимком (`natal_input`), а не в портрете. Карту считает воркер из снимка через `@oracle/core/natal`.

**Стек:** TypeScript, Next.js 16, Drizzle + PGlite (тесты), pg-boss, Vitest, Playwright.

**Спека:** `docs/superpowers/specs/2026-10-20-natal-paid-design.md` (разделы 2, 4–6, 8, 9: этап 1).

## Решения исполнителя (отклонения и уточнения к спеке)

- **Снимок** `NatalSnapshot = { date, time, instant, latitude, longitude, placeName }`: момент рождения (`instant`, ISO UTC) считается один раз на сервере при покупке (выбор покупателя при «времени дважды» передаётся как `zoneChoice`, по умолчанию `first`). Воркеру часовые пояса не нужны.
- **Ключ дубля** `inputKey = "<date>|<time>|<lat 2 знака>|<lon 2 знака>"` (колонка `purchases.input_key`); у матрицы он `null`.
- **Вступления глав** — константы TS (`packages/content/src/natal-report-texts.ts`), а не `natal-chapters.md`; блоки «в доме» и «функции планет» — этап 2.
- **Запасные главы** этапа 1 собираются из уже существующих текстов: «Суть» страницы знака, `HOUSE_TEXTS`, `ASPECT_TEXTS`. МС и лунный узел в текст не попадают (нет блоков), глава «Дело и деньги» опирается на описания домов 2, 6, 10.
- **ИИ-редактор** не подключается (этап 2): функция генерации без параметра `writer`.
- Покупка идёт по данным запроса: портрет не трогается, вход нужен.
- Нет времени рождения → блок продажи не показывается (вместо него короткое пояснение).

## Глобальные ограничения

- Тексты на русском, «вы»; цена и тексты кнопок — дословно из спеки: «Разбор натальной карты — 490 ₽», «Купить разбор — 490 ₽», «Войти и купить разбор», «Открыть разбор», «E-mail для чека», «Попробовать снова».
- Данные рождения не пишутся в лог, не попадают в ответы об ошибках и на вход ИИ.
- `@oracle/core/natal` не попадает в главный вход `@oracle/core` и в бандл калькулятора (динамический импорт сохраняется); в браузере из него берутся типы и чистые функции без движка только через уже существующие пути.
- Цели Метрики: `natal_offer_view`, `natal_offer_click`; `natal_paid` и `natal_report_opened` — по образцу `report_paid`/`report_opened`.
- Покрытие `packages/*/src`, `apps/web/src/server`, `apps/web/src/lib`, `apps/worker/src` не ниже 80 %.
- Коммиты — conventional commits на английском; ничего не пушить без согласия владелицы.

## Review Focus

1. Те же данные рождения покупаются второй раз (или две вкладки): вторая оплата не запускает генерацию, первая отдаётся ссылкой (тесты в задаче 5).
2. Широта за 85° или время, которое нельзя разобрать: покупка отклонена `invalid_birth`, платёж не создаётся (задача 5).
3. «Удалить мои данные»: снимок, ключ и e-mail обнулены, разбор удалён, страница разбора 404 (задача 2, e2e).
4. Владелица (`isOwner`): покупка за 0 ₽ без шлюза и почты, цели не считаются (задача 5).
5. Выключенный `PAID_NATAL`: маршрут покупки натального продукта отвечает 404, блок продажи не показывается, купленные разборы открываются (задачи 5–6).

---

### Задача 1: Ядро — продукт, снимок, главы

**Файлы:**
- Изменить: `packages/core/src/report.ts`, `packages/core/src/index.ts`
- Создать: `packages/core/src/natal/report.ts`; дописать экспорт в `packages/core/src/natal/index.ts`
- Тесты: `packages/core/src/report.test.ts` (дополнить), `packages/core/src/natal/report.test.ts`

**Интерфейсы (производит):**
```ts
// report.ts
export const NATAL_REPORT_PRODUCT = "natal_report";
export type Product = typeof MATRIX_REPORT_PRODUCT | typeof NATAL_REPORT_PRODUCT | "lila_session";
export const NATAL_REPORT_PRICE_KOPECKS = 49_000;
export type NatalSnapshot = { date: string; time: string; instant: string; latitude: number; longitude: number; placeName: string };
export function natalSnapshotKey(s: Pick<NatalSnapshot, "date" | "time" | "latitude" | "longitude">): string; // "1990-03-07|12:00|55.75|37.62"
QUEUES.generateNatalReport = "generate-natal-report"; export type GenerateNatalReportJob = { purchaseId: string };
export function generateNatalReportJobKey(job: GenerateNatalReportJob): string; // "generate-natal-report:<id>"
// natal/report.ts
export const NATAL_CHAPTER_IDS = ["core","mind","love","action","work","growth","depth","aspects","scenario"] as const;
export type NatalChapterId = (typeof NATAL_CHAPTER_IDS)[number];
export const NATAL_CHAPTER_TITLES: Readonly<Record<NatalChapterId, string>>; // Ядро; Мышление и общение; Любовь и ценности; Энергия и действие; Дело и деньги; Рост и испытания; Глубокие слои; Главные аспекты; Ваш сценарий
export type ChapterPoint = { body: BodyId | "ascendant"; sign: SignId; house: number | null };
export type NatalChapterOutline = { id: NatalChapterId; title: string; points: ChapterPoint[]; houses: number[] };
export function natalChapterOutline(chart: NatalChart): NatalChapterOutline[]; // 9 глав; chart.timeKnown обязателен, иначе RangeError
export function mainAspects(chart: NatalChart, limit?: number): Aspect[]; // limit по умолчанию 7; порядок как в chart.aspects (точные первыми)
```
Состав глав: core — sun, moon, ascendant (house null); mind — mercury; love — venus, houses [7]; action — mars; work — points [], houses [2, 6, 10]; growth — jupiter, saturn; depth — uranus, neptune, pluto; aspects и scenario — points [], houses [].

- [ ] **Шаг 1: тесты `natal/report.test.ts`.** Карта Москвы 07.03.1990 12:00 (как в `reference.test.ts`: `computeNatalChart` с моментом из контракта): `natalChapterOutline` возвращает 9 глав в порядке `NATAL_CHAPTER_IDS`; у `core` три точки, у последней `body === "ascendant"` и `house === null`; у `work` `houses` равен `[2, 6, 10]`; у `depth` три точки; `mainAspects(chart)` не длиннее 7 и `mainAspects(chart, 3)` равен первым трём из `chart.aspects`; карта без времени (`timeKnown: false`) → `toThrow(RangeError)`. В `report.test.ts` ядра: `natalSnapshotKey` даёт `"1990-03-07|12:00|55.75|37.62"` для широты 55.7558 и долготы 37.6173; `generateNatalReportJobKey({ purchaseId: "p" })` равен `"generate-natal-report:p"`; `NATAL_REPORT_PRICE_KOPECKS === 49_000`.
- [ ] **Шаг 2: запустить** `pnpm exec vitest run packages/core/src/natal/report.test.ts packages/core/src/report.test.ts` — падает (нет экспортов).
- [ ] **Шаг 3: реализовать** по интерфейсам выше. `natalSnapshotKey` округляет через `toFixed(2)`; расположение `Product` и констант — как у соседних продуктов.
- [ ] **Шаг 4: запустить те же тесты и** `pnpm --filter @oracle/core typecheck` — зелёные. Остальной typecheck может упасть на `Record<Product, …>` — чинится в задачах 2 и 5.
- [ ] **Шаг 5: коммит** `feat(core): natal report product, snapshot key and chapter outline`.

### Задача 2: База — миграция, покупка со снимком, разбор, удаление

**Файлы:**
- Изменить: `packages/db/src/schema.ts` (enum `product` + `natal_report`; в `purchases` — `natalInput` jsonb nullable и `inputKey` text nullable), `packages/db/src/purchases.ts`, `packages/db/src/reports.ts`, `packages/db/src/delete-user.ts`, `packages/db/src/index.ts` (если нужен экспорт)
- Создать: миграция `packages/db/drizzle/0007_*.sql` командой `pnpm --filter @oracle/db db:generate` (имя генерируется)
- Тесты: `purchases.test.ts`, `reports.test.ts`, `delete-user.test.ts` (дополнить)

**Интерфейсы (потребляет):** `NatalSnapshot`, `natalSnapshotKey`, `Product`, `NatalChapterId` из `@oracle/core`/`@oracle/core/natal` (последний — только тип).
**Интерфейсы (производит):**
```ts
type NewPurchase = { …; natal?: NatalSnapshot | null }           // birthDate = natal.date, inputKey = natalSnapshotKey(natal)
PurchaseRecord += { natalInput: NatalSnapshot | null; inputKey: string | null }
type PurchaseKey = { userId: string; product: Product; birthDate: string; inputKey?: string | null }
findOpenPurchase(db, p: PurchaseKey & { since: Date }); findPaidPurchase(db, p: PurchaseKey)   // inputKey null ↔ IS NULL
type PaidPurchase = { id: string; product: Product; birthDate: string; ready: boolean; paidAt: Date }
type StoredChapter = { id: ChapterId | NatalChapterId; source: "ai" | "fallback"; paragraphs?: string[]; scenario?: Record<ScenarioField, string> }
```

- [ ] **Шаг 1: тесты.** `purchases.test.ts`: покупка с `natal` сохраняет `natalInput`, `inputKey`, `birthDate`; `findPaidPurchase` с тем же `inputKey` находит её, с другим временем — нет, а поиск матричной покупки той же даты (`inputKey` отсутствует) натальную не находит; `listPaidPurchases` возвращает `product`. `reports.test.ts`: `saveReport` принимает главу с id `"mind"`. `delete-user.test.ts`: после удаления у натальной покупки `natalInput`, `inputKey`, `birthDate`, `receiptEmail` равны `null`, разбор удалён, сумма и статус остались.
- [ ] **Шаг 2: запустить** `pnpm exec vitest run packages/db` — падает.
- [ ] **Шаг 3: схема и миграция.** Изменить `schema.ts`, выполнить `pnpm --filter @oracle/db db:generate`, проверить, что в SQL есть `ALTER TYPE "product" ADD VALUE 'natal_report'` и два `ADD COLUMN`; если drizzle-kit спрашивает интерактивно — написать SQL и снимок вручную по образцу `0006`.
- [ ] **Шаг 4: реализовать** `purchases.ts` (`sameInput` вместо `sameDate`: userId, product, birthDate и `inputKey` равен ключу либо IS NULL), `reports.ts`, `delete-user.ts` (обнулить `natalInput`, `inputKey`).
- [ ] **Шаг 5: запустить** `pnpm exec vitest run packages/db` и `pnpm --filter @oracle/db typecheck` — зелёные.
- [ ] **Шаг 6: коммит** `feat(db): natal report purchases with a birth snapshot`.

### Задача 3: Тексты и запасные главы (`packages/content`, `packages/ai`)

**Файлы:**
- Создать: `packages/content/src/natal-report-texts.ts`, `packages/ai/src/natal-fallback.ts`; экспорты в `packages/content/src/index.ts` и `packages/ai/src/index.ts`
- Тесты: `packages/content/src/natal-report-texts.test.ts`, `packages/ai/src/natal-fallback.test.ts`

**Интерфейсы (производит):**
```ts
// content
export const NATAL_CHAPTER_INTROS: Readonly<Record<NatalChapterId, string>>;   // по 2–3 предложения, «вы», гипотезы
export const NATAL_ASPECT_NAMES: Readonly<Record<AspectId, string>>;           // соединение, секстиль, квадрат, трин, оппозиция
// ai
export type NatalChapter = { id: NatalChapterId; source: "fallback"; paragraphs?: string[]; scenario?: Record<ScenarioField, string> };
export function fallbackNatalReport(chart: NatalChart): NatalChapter[];        // 9 глав в порядке NATAL_CHAPTER_IDS; chart.timeKnown обязателен
```
Алгоритм запасной главы (главы 1–4, 6, 7): вступление; затем для каждой точки главы (по порядку) абзац `"<название страницы>, <N> дом."` (для асцендента без дома) и первый абзац «Суть» этой страницы знака; дополнительно — `HOUSE_TEXTS[N]` для дома точки. Глава `love` дополняется описанием 7-го дома, `work` — домов 2, 6, 10 после вступления. Глава `aspects`: вступление и для каждого из `mainAspects(chart)` строка `"<Тело A> — <вид> — <Тело B> (орбис <x,x>°)."` и `ASPECT_TEXTS[вид]`; название тела берётся из имени первой страницы тела (до « в »/« во »). Глава `scenario`: поля из текстов страниц Солнца, Луны и асцендента карты: `pattern` — `manifestation[0]` Солнца, `tension` — `pitfalls[0]` Луны, `resource` — `manifestation[0]` асцендента, `blindSpot` — `pitfalls[0]` Солнца, `turningPoint` — `pitfalls[0]` асцендента, `experiment` — «Семь дней подряд — одно небольшое действие: …» + `questions[1]` Луны, `question` — `questions[0]` Солнца. Все страницы читаются через `natalText(slug)` по паре «тело + знак».

- [ ] **Шаг 1: тесты.** `natal-report-texts.test.ts`: у каждой из 9 глав есть вступление 15–60 слов; `findStopPhrases` на всех вступлениях пуст; в вступлениях нет слов «карма», «ты». `natal-fallback.test.ts` (карта Москвы 07.03.1990 12:00): 9 глав в порядке, `source === "fallback"`; в `core` первый абзац после вступления начинается с `"Солнце в Рыбах, 10 дом."`; глава `love` содержит `HOUSE_TEXTS[7]`; глава `work` содержит тексты домов 2, 6, 10; `aspects` содержит строку с «орбис» и текст вида аспекта; у `scenario` заполнены все семь полей `SCENARIO_FIELDS`; карта без времени → `toThrow(RangeError)`; результат не содержит строки «undefined».
- [ ] **Шаг 2: запустить** `pnpm exec vitest run packages/content/src/natal-report-texts.test.ts packages/ai/src/natal-fallback.test.ts` — падает.
- [ ] **Шаг 3: реализовать.** Вступления пишет исполнитель (по одному на главу, нейтрально, без обещаний). Если «Суть» страницы нет, абзац пропускается.
- [ ] **Шаг 4: запустить** тесты и `pnpm --filter @oracle/content typecheck`, `pnpm --filter @oracle/ai typecheck` — зелёные.
- [ ] **Шаг 5: коммит** `feat(ai): natal report fallback chapters from the existing texts`.

### Задача 4: Воркер

**Файлы:**
- Создать: `apps/worker/src/generate-natal.ts`, `apps/worker/src/generate-natal.test.ts`
- Изменить: `apps/worker/src/main.ts` (очередь `QUEUES.generateNatalReport`, обработчик с логом по образцу матрицы)

**Интерфейсы (потребляет):** `getReport`, `getPurchase`, `findPaidPurchase`, `saveReport`, `computeNatalChart`, `fallbackNatalReport`, `GenerateNatalReportJob`.
**Производит:** `runGenerateNatal(job: GenerateNatalReportJob, deps: { db: Database; log: Logger }): Promise<void>`.

Поведение: разбор уже есть → выход; покупка не найдена / не `succeeded` / `natalInput === null` (данные удалены) → выход с `info` в лог без данных; вторая оплата тех же данных (`findPaidPurchase` по `inputKey` вернул другую) → `warn` «duplicate paid purchase — refund manually» и выход; иначе `computeNatalChart({ instant: new Date(natalInput.instant), latitude, longitude, timeKnown: true })`, `fallbackNatalReport`, `saveReport`, `info` «natal report generated» (id покупки, `created`).

- [ ] **Шаг 1: тесты на PGlite** (как `generate.test.ts`): оплаченная покупка со снимком → создан разбор из 9 глав; повтор задачи не создаёт второй; неоплаченная и «данные удалены» не создают; дубль не создаёт; в лог не попадают дата, время и название места (проверка на собранных логах).
- [ ] **Шаг 2: запустить** `pnpm exec vitest run apps/worker` — падает.
- [ ] **Шаг 3: реализовать** `runGenerateNatal` и подключить в `main.ts` (`createQueue`, `boss.work` с `retryLimit` из `GENERATE_JOB_OPTIONS` ставится на стороне сайта).
- [ ] **Шаг 4: тесты, `pnpm --filter @oracle/worker typecheck` и `pnpm --filter @oracle/worker build`** — зелёные (сборка проверяет, что движок вошёл в бандл).
- [ ] **Шаг 5: коммит** `feat(worker): generate the natal report from the purchase snapshot`.

### Задача 5: Покупка на сайте (сервис, маршрут, очередь, флаг)

**Файлы:**
- Изменить: `apps/web/src/server/payments-service.ts`, `payments-deps.ts`, `queue.ts`, `env.ts`, `apps/web/src/app/api/purchases/route.ts`, `apps/web/src/lib/natal-moment.ts` (тип входа: `city: Pick<City, "zone" | "latitude" | "longitude">`), `deploy/env.example`, `apps/web/.env.development.example` (`PAID_NATAL=on`)
- Создать: `apps/web/src/server/natal-snapshot.ts` (+ тест)
- Тесты: `payments-service.test.ts`, `env.test.ts`, тест маршрута (рядом, как у существующих) — дополнить

**Интерфейсы (производит):**
```ts
// natal-snapshot.ts
export function parseNatalBirth(value: unknown, now: Date): { snapshot: NatalSnapshot } | null;
// value: { birthDate, time (обязательно "ЧЧ:ММ"), name, latitude, longitude, zone, zoneChoice?: "first" | "second" };
// валидация — parseBirthPlaceBody из profile-service; широта по модулю не больше 85; момент — buildBirthMoment; instant → ISO
// payments-service.ts
export type StartPurchaseError += "invalid_birth";
export async function startNatalPurchase(deps: PaymentsDeps, p: { userId: string; email: unknown; birth: unknown }): Promise<StartPurchaseOutcome>;
PaymentsDeps += { enqueueGenerateNatal: (job: GenerateNatalReportJob) => Promise<void> }
PurchaseView += { product: Product }
PRODUCT_DESCRIPTIONS.natal_report = "Разбор натальной карты — «Твой оракул»"
// env.ts / payments-deps.ts
AppEnv += { paidNatal: boolean }  // PAID_NATAL on/off, по умолчанию off
salesEnabled(NATAL_REPORT_PRODUCT) → env.payments !== null && env.paidNatal
```
Правила: тело запроса `{ product: "natal_report", email, birth }`; статус `invalid_birth` → 400; флаг `PAID_NATAL=off` → 404 (как у остальных); повтор («Попробовать снова») берёт продукт и снимок из самой покупки; `firstPaidOf` и поиск открытой покупки учитывают `inputKey`; `onPaid` и `getPurchaseView` ставят задачу в очередь по продукту (`enqueueGenerateNatal` для натального); `purchaseReturnPath` — `reportPath`; владелица — как у матрицы (0 ₽, без почты, без шлюза).

- [ ] **Шаг 1: тесты `natal-snapshot.test.ts`.** Москва 07.03.1990 12:00 → `instant` равен `"1990-03-07T08:00:00.000Z"`, `date`, `time`, `placeName` сохранены; нет времени (`time: null`) → `null`; широта 86 → `null`; несуществующая зона → `null`; «время дважды» (Москва осенью 1990 переходов нет; брать зону с известным переводом назад, например `Europe/Berlin` 1990-09-30 02:30): `zoneChoice: "second"` даёт момент на час позже, чем по умолчанию.
- [ ] **Шаг 2: тесты `payments-service.test.ts`** (с поддельным шлюзом, как для матрицы): `startNatalPurchase` создаёт покупку на 49 000 копеек со снимком и платёж с описанием «Разбор натальной карты — «Твой оракул», чек: …»; те же данные после оплаты → `already_paid` с `purchaseId`; другое время тех же даты и места — новая покупка; неверный e-mail → `invalid_email`; нет времени → `invalid_birth` и шлюз не вызывался; владелица → покупка за 0 ₽ без шлюза; после `syncPayment` оплаты ставится задача `enqueueGenerateNatal`, а не `enqueueGenerate`; двойная оплата — вторая не ставит задачу; `retryPurchase` отменённой натальной покупки создаёт новую с тем же снимком; `getPurchaseView` вернул `product: "natal_report"`. `env.test.ts`: `PAID_NATAL` по умолчанию `off`, `on` включает `paidNatal`. Тест маршрута: при `PAID_NATAL=off` ответ 404 и покупка не создана.
- [ ] **Шаг 3: запустить** `pnpm exec vitest run apps/web/src/server` — падает.
- [ ] **Шаг 4: реализовать.** Обобщить `purchaseFor` (принимает продукт, цену, `birthDate`, `natal?`), добавить `startNatalPurchase`, `enqueueGenerateNatal` в `queue.ts` (по образцу `enqueueGenerate`, с `generateNatalReportJobKey` и `GENERATE_JOB_OPTIONS`), `paidNatal` в `env.ts`, ветку продукта в маршруте (читать продукт из тела / из покупки при повторе, как для Лилы), `STATUS.invalid_birth = 400`; в `deploy/env.example` — строка `PAID_NATAL=off` с комментарием.
- [ ] **Шаг 5: запустить** `pnpm exec vitest run apps/web/src/server apps/web/src/app/api` и `pnpm typecheck` — зелёные.
- [ ] **Шаг 6: коммит** `feat(web): start and sync natal report purchases behind PAID_NATAL`.

### Задача 6: Страница разбора, блок продажи, портрет, цели

**Файлы:**
- Создать: `apps/web/src/components/report/NatalReportView.tsx`, `apps/web/src/components/natal/NatalReportOffer.tsx`, `apps/web/src/lib/natal-report-offer.ts`; тесты рядом
- Изменить: `apps/web/src/app/portret/razbor/[id]/page.tsx` и `ReportWaiting.tsx` (картинка аркана становится необязательной, тексты по продукту), `apps/web/src/components/natal/NatalResult.tsx` и `NatalOutcome.tsx` и `NatalCalculator.tsx` (слот `offer`), `apps/web/src/app/natalnaya-karta/page.tsx` (`offerEnabled = salesEnabled(NATAL_REPORT_PRODUCT)`), `apps/web/src/app/portret/page.tsx` (карточка «Разборы» с учётом продукта), `apps/web/src/app/matrica-sudby/page.tsx` и `sovmestimost/page.tsx` (в списках оплаченных — только `product === "matrix_report"`), `apps/web/src/lib/analytics.ts` + `docs/analytics-goals.md` (цели), `apps/web/src/lib/natal-copy.ts` (все строки блока), `AGENTS.md` (дословные тексты и раздел)

**Интерфейсы (производит):**
```ts
// natal-report-offer.ts
export type NatalOfferState = { kind: "hidden" } | { kind: "no_time" } | { kind: "guest" } | { kind: "buy" };
export function natalOfferState(p: { enabled: boolean; signedIn: boolean; timeKnown: boolean }): NatalOfferState;
export function chapterLabel(outline: NatalChapterOutline): string; // "Любовь и ценности — Венера в Водолее, 8 дом"; без точек — только дома/пусто → ""
// NatalReportOffer props: { state: NatalOfferState; chart: NatalChart; input: NatalInput; choice: ZoneChoice | null; free?: boolean }
// NatalReportView props: { chapters: StoredChapter[]; date: string; placeName: string | null; purchaseId: string }
```
Поведение: блок продажи под ключевыми блоками результата, заголовок «Разбор натальной карты — 490 ₽», оглавление девяти глав с позициями человека (`natalChapterOutline` в браузере: функция из `@oracle/core/natal` уже подгружена вместе с расчётом; блок рендерится только когда карта построена), кнопки: `guest` — «Войти и купить разбор — 490 ₽» (ссылка на вход с возвратом на страницу), `buy` — поле «E-mail для чека» и «Купить разбор — 490 ₽» (POST `/api/purchases` с `{ product: "natal_report", email, birth }`), `no_time` — абзац «Для разбора нужно время рождения: укажите его и рассчитайте карту заново»; ошибка — `role="alert"`; `already_paid` → переход на страницу разбора; владелице — «Получить разбор бесплатно» без почты. Цели: `natal_offer_view` (заголовок блока наполовину виден), `natal_offer_click` (до запроса), `checkout_*` как у матрицы с продуктом `natal`. Страница разбора: для натального продукта показывает `NatalReportView` (заголовок «Разбор натальной карты», дата и место, оглавление, главы, поля сценария, `DISCLAIMER`, ссылка «← Мой портрет») и состояния ожидания без картинки аркана.

- [ ] **Шаг 1: тесты.** `natal-report-offer.test.ts`: четыре состояния по входам (`enabled false` → hidden; `timeKnown false` → no_time; не вошёл → guest; вошёл → buy); `chapterLabel` для главы `love` на карте Москвы 07.03.1990 12:00 содержит «Венера в» и «дом». Тесты разметки: `NatalReportOffer` в состоянии `guest` содержит «Войти и купить разбор — 490 ₽», в `buy` — «E-mail для чека» и «Купить разбор — 490 ₽», в `no_time` кнопок нет; девять заголовков глав; `NatalReportView` выводит главы по порядку `NATAL_CHAPTER_IDS` и поля сценария. Тест страницы калькулятора: при `offerEnabled` false блока в разметке нет. Тест списков: страница матрицы не считает натальную покупку той же даты купленной матрицей.
- [ ] **Шаг 2: запустить** `pnpm exec vitest run apps/web` — падает.
- [ ] **Шаг 3: реализовать** файлы по списку; строки — только в `natal-copy.ts`; разметка с зацепками `natal-offer*` и повтором классов `report-*` там, где вид совпадает с разбором матрицы (оформление по ТЗ Codex позже, до этого блок использует общие стили карточек `card`).
- [ ] **Шаг 4: запустить** `pnpm exec vitest run apps/web` и `pnpm typecheck` — зелёные.
- [ ] **Шаг 5: коммит** `feat(web): natal report offer, report page and portrait list`.

### Задача 7: Сквозной тест и документация

**Файлы:**
- Создать: `e2e/natal-paid.spec.ts`
- Изменить: `AGENTS.md` (строка про платный разбор карты: флаг `PAID_NATAL`, файлы, дословные тексты), `docs/superpowers/specs/2026-10-20-natal-paid-design.md` (статус и отклонения этапа 1), `e2e/goals.spec.ts` (цели блока продажи)

- [ ] **Шаг 1: e2e** (образец — сквозной тест покупки разбора матрицы): гость считает карту с временем → видит блок «Разбор натальной карты — 490 ₽» и «Войти и купить разбор — 490 ₽» → вход через `/api/dev/login` → «Купить разбор — 490 ₽» с e-mail → тестовая оплата → ожидание → готовый разбор из девяти глав → карточка «Разборы» в портрете показывает его → повторная покупка тех же данных ведёт на тот же разбор → «Удалить мои данные» → страница разбора 404. Без времени рождения кнопки покупки нет.
- [ ] **Шаг 2: запустить** стек (`pnpm dev:db`, `pnpm dev:web`, `pnpm dev:worker`, с `PAID_NATAL=on`) и `pnpm test:e2e` для новых и затронутых файлов (`natal`, `natal-save`, `goals`, `portrait`, `report`): все зелёные.
- [ ] **Шаг 3: полный прогон** `pnpm typecheck && pnpm test` — зелёные; `NEXT_PUBLIC_SITE_URL=https://tvoy-orakul.ru pnpm --filter @oracle/web build` — собирается.
- [ ] **Шаг 4: документы и коммит** `test(e2e): natal report purchase flow` и `docs: natal paid report stage 1`.

## Самопроверка плана

- Покрытие спеки: §2 главы — задачи 1, 3; §4 данные и оплата — задачи 2, 5; §5 генерация — задачи 3, 4 (без ИИ, по решению этапа 1); §6 экраны — задача 6; §8 цели — задача 6; §7 документы и §3 новые блоки — этапы 2–3, в этот план не входят.
- Согласованность имён: `NatalSnapshot`, `natalSnapshotKey`, `NatalChapterId`, `natalChapterOutline`, `fallbackNatalReport`, `startNatalPurchase`, `enqueueGenerateNatal`, `salesEnabled(NATAL_REPORT_PRODUCT)` одинаковы во всех задачах.
- Пропорция: план короче кода, который описывает; тела функций не приведены, кроме алгоритма запасных глав.
