# План 1 — Фундамент: монорепо, вход через VK ID, «Мой портрет», документы, выкладка

## Статус на 2026-09-24

Код и проверки задач 1–9 (шаги 1–5) готовы: юнит-тестов — 96, сквозных сценариев Playwright — 11, все зелёные. Покрытие (`packages/*/src`, `apps/web/src/server`, `apps/web/src/lib`): строки 91.02%, ветви 90.97%, функции 83.33%, выражения 90.31% — везде ≥ 80%. Продакшен-сборка с `NEXT_PUBLIC_SITE_URL` проходит без предупреждений, слов «grani»/«Грани» в коде нет.

Осталось: подготовка сервера (задача 8, шаг 6), PR, выкладка и ручная проверка (задача 9, шаги 6–8); номер счётчика Метрики и код Вебмастера; подтверждение почты оператора.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Задачи лежат в отдельных файлах `task-NN-*.md` этой папки; выполнять по порядку.

**Goal:** Сайт ORACLE работает на собственном домене на общем VPS. Главная показывает четыре практики со статусом «скоро». Человек входит через VK ID с согласием на обработку данных, сохраняет дату рождения в «Мой портрет» и может удалить свои данные. На сайте есть политика, согласие, контакты, cookie-баннер с Метрикой, `robots.txt` и `sitemap.xml`. Платных функций и ИИ в плане 1 нет: они приходят в плане 2 вместе с матрицей судьбы.

**Architecture:** Монорепо pnpm по образцу Граней (`C:\dev\grani-test`): `packages/core` — чистая логика без зависимостей, `packages/db` — Drizzle + Postgres (в тестах PGlite), `apps/web` — Next.js 16 (App Router, `output: "standalone"`). Серверная логика лежит в `apps/web/src/server/*-service.ts` и принимает зависимости явно (`db`, `env`, `now`, `fetchFn`), поэтому тестируется без Next. Маршруты `app/api/**/route.ts` — тонкие обёртки: проверка `Origin`, ограничение частоты, сессия, вызов сервиса. Вход — VK ID OAuth 2.1 с PKCE, сессия — JWT HS256 в httpOnly-cookie (`jose`). Согласие фиксируется подписанной cookie до перехода в VK. Адрес сайта задаётся при сборке переменной `NEXT_PUBLIC_SITE_URL` и читается в одном месте — `apps/web/src/lib/site.ts`. Выкладка повторяет Грани: `Dockerfile` с целями `web` и `migrate`, образы в GHCR, `docker compose` на общем VPS, блок в Caddy трекера, workflow `deploy.yml` с проверкой после выкладки.

**Tech Stack:** Node 24, pnpm 12, TypeScript 6, Next.js 16.3, React 19.3, Drizzle ORM 0.45 + postgres.js 3.4, PGlite 0.5 (тесты и локальная БД), zod 4.6, jose 6.2, Vitest 5, Playwright 1.63, Docker, GitHub Actions, Caddy трекера питания. Версии — те же, что в Гранях (`C:\dev\grani-test\package.json`, `apps/web/package.json`, `packages/db/package.json`).

**Spec:** `docs/superpowers/specs/2026-09-24-oracle-site-structure-design.md` — разделы 2 («Принятые решения»), 3 («Карта сайта»: `/`, `/portret`, документы), 4 (п. 5 «Сохранение», правила «ненавязчиво»), 6 («Этап 0 — Фундамент»), 8 («Что переносим из v0.9»: визуальный язык).
**Образец кода:** `C:\dev\grani-test` (ветка `master`). Там, где задача говорит «перенести из Граней», файл копируется командой `cp`, после чего в нём делаются перечисленные правки. Итоговый вид каждого изменённого файла приведён в задаче целиком.
**Дорожная карта:** `docs/superpowers/plans/00-roadmap.md`

## Global Constraints

- Репозиторий `C:\dev\oracle`, ветка плана `feat/foundation` от `master`. PR в `master` — после зелёного CI и согласия пользователя. Выкладка начинается с мержа в `master`.
- Команды pnpm в Git Bash: перед `pnpm ...` выполнить `export PATH="/c/Users/olya8/AppData/Roaming/npm:$PATH"`. После `pnpm add` — `pnpm dedupe`.
- Пространство имён пакетов — `@oracle/*` (`@oracle/core`, `@oracle/db`, `@oracle/web`). Слова `grani`, `Грани` и `grani-test.ru` в коде ORACLE не встречаются; проверка — `grep -rni grani --exclude-dir=node_modules --exclude-dir=docs --exclude-dir=.next --exclude=server-setup.md .` без вывода (инструкция сервера законно упоминает соседние сайты).
- **Адрес сайта** — только из `NEXT_PUBLIC_SITE_URL` через `SITE_URL` в `apps/web/src/lib/site.ts`. Локально — `http://localhost:3000`, при сборке образа — переменная репозитория GitHub `SITE_URL`. Каноничный адрес без завершающего слэша.
- **Вход — только VK ID.** Telegram-вход и уведомления из Граней не переносятся. Новый пользователь создаётся только с согласием; версия согласия — `2026-09-v1`.
- **Обращение нейтральное к полу** (спецификация 4): никаких «готова», «сделала», «ты уверена». Пол из VK ID не запрашивается и не хранится.
- **Индексация:** публичные страницы (`/`, `/privacy`, `/consent`, `/contacts`) — `index, follow` через `publicMetadata(...)`. Всё личное (`/login`, `/portret`, `/portret/*`, `/api/*`) — `noindex` и `Disallow` в `robots.txt`. По умолчанию в `layout.tsx` стоит `noindex`.
- **Метрика** загружается только после «Принять» в cookie-баннере и только на боевом домене. Выбор хранится в `localStorage` (`oracle-cookie-consent` = `all` | `necessary`). Цели плана 1 — ровно `login` и `birth_date_saved`. Вебвизор выключен.
- **Визуальный стиль** — `docs/design/visual-direction.md` (создаётся в задаче 3): тёмный премиальный интерфейс из v0.9, цвета только из CSS-переменных, без «ярмарочной эзотерики» (звёзды, свечи, золотые завитки, глаз в треугольнике).
- **Секреты** (`SESSION_SECRET`, пароль БД) — только в `/opt/oracle/.env` на сервере. Агенту не присылаются, в репозиторий и логи не попадают.
- **Сервер общий** с трекером питания, wishlist и Гранями (`root@200.169.178.231`). У трекера трогаем только две вещи: создаём БД и роль `oracle` в его Postgres и **дописываем** блок в его `Caddyfile`. Лимит памяти: `web` 350m.
- **Каждое действие вне репозитория** (сервер, GitHub Settings/Secrets/Variables, VK ID, Метрика, Вебмастер, DNS) делает пользователь. Агент готовит команды и ждёт подтверждения. Команды по SSH агент запускает только с явного разрешения на каждый шаг, и в них не должно быть секретов.
- Тесты: Vitest (AAA), репозитории — с PGlite, сквозные — Playwright на локальном приложении. Покрытие `packages/*/src`, `apps/web/src/server`, `apps/web/src/lib` ≥ 80%.
- Коммиты — conventional commits, без Co-Authored-By. Ответы пользователю — по-русски.

## Предварительные действия пользователя

1. **Домен.** Купить или выбрать домен для ORACLE и завести A-запись на `200.169.178.231`. Значение нужно к задаче 8.
2. **Репозиторий на GitHub** `olya88lagun-coder/oracle` (можно приватный) и `git remote add origin ...` в `C:\dev\oracle`. Нужен к задаче 8 (CI можно проверить и раньше).
3. **VK ID:** на id.vk.ru создать отдельное веб-приложение «ORACLE» (не использовать приложение Граней: у него свой домен и свой список Redirect URL). Доверенный Redirect URL — `https://<домен>/api/auth/vk/callback`, базовый домен — `<домен>`. Нужен ID приложения (`VK_CLIENT_ID`) — к задаче 8.
4. **Яндекс.Метрика:** новый счётчик для домена, вебвизор выключен, цели `login` и `birth_date_saved` как «JavaScript-событие». Нужен номер счётчика — к задаче 7 (без него Метрика просто выключена).
5. **Яндекс.Вебмастер:** добавить сайт, способ подтверждения «Метатег», прислать значение `content` — к задаче 7.
6. **Память VPS:** проверить запас (`free -h`, `docker stats --no-stream`). На сервере уже работают трекер, wishlist и Грани; ORACLE добавит до 350 МБ. Если свободно меньше 500 МБ — увеличить память в панели Timeweb до задачи 8.
7. **Модерация рекламы** (спецификация 6, этап 0 — параллельно с планом): прочитать правила Яндекс.Директа и VK Рекламы для эзотерики и астрологии и проверить, пройдёт ли формулировка «инструмент самопознания». Коду плана 1 не нужно, но от этого зависит тест рекламы после плана 2.

## Задачи

| # | Файл | Что делает | Тип |
|---|---|---|---|
| 1 | `task-01-monorepo-core.md` | корневые файлы монорепо, CI, `packages/core` с датой рождения | код |
| 2 | `task-02-db.md` | `packages/db`: схема, миграция, пользователи, профиль рождения, удаление данных, локальная БД | код |
| 3 | `task-03-web-scaffold.md` | `apps/web`: окружение, подключение к БД, визуальная система, главная, SEO-база, `/api/health` | код |
| 4 | `task-04-legal.md` | операторы и получатели данных, политика, согласие, контакты, подвал с оговоркой | код |
| 5 | `task-05-vk-login.md` | токены, VK ID с PKCE, согласие, вход, выход, dev-вход, страница входа | код |
| 6 | `task-06-portrait.md` | «Мой портрет»: дата рождения, ограничение частоты, удаление данных | код |
| 7 | `task-07-analytics.md` | cookie-баннер, Метрика после согласия, цели, код Вебмастера | код |
| 8 | `task-08-deploy.md` | `Dockerfile`, `images.yml`, `deploy/`, `deploy.yml` со smoke-проверками, настройка сервера | код + выкладка |
| 9 | `task-09-e2e-launch.md` | сквозные сценарии, итоговые проверки, PR, выкладка, ручная проверка на телефоне | код + выкладка |

## Карта файлов

```
package.json  pnpm-workspace.yaml  tsconfig.base.json  vitest.config.ts
.editorconfig  .gitattributes  .gitignore  .dockerignore  Dockerfile
.github/workflows/ci.yml  images.yml  deploy.yml
packages/core/src/birth-date.ts  birth-date.test.ts  index.ts
packages/db/src/schema.ts  users.ts  profiles.ts  delete-user.ts  testing.ts  client.ts  types.ts  uuid.ts  index.ts  (+ *.test.ts)
packages/db/drizzle/0000_*.sql                       первая миграция (генерирует drizzle-kit)
packages/db/scripts/dev-db.mjs  migrate.mjs
apps/web/src/lib/site.ts  seo.ts  legal.ts  login-mark.ts  login-errors.ts  analytics.ts  (+ *.test.ts)
apps/web/src/server/env.ts  db.ts  http.ts  deps.ts  viewer.ts  rate-limit.ts  dev-login.ts
apps/web/src/server/auth/tokens.ts  auth/vk.ts
apps/web/src/server/login-service.ts  login-response.ts  profile-service.ts  account-service.ts  (+ *.test.ts)
apps/web/src/app/layout.tsx  globals.css  page.tsx  robots.ts  sitemap.ts
apps/web/src/app/login/page.tsx  LoginPanel.tsx
apps/web/src/app/portret/page.tsx  BirthDateForm.tsx  delete/page.tsx  delete/DeleteForm.tsx
apps/web/src/app/privacy/page.tsx  consent/page.tsx  contacts/page.tsx
apps/web/src/app/api/health  consent  auth/vk/start  auth/vk/callback  auth/logout  dev/login  profile/birth-date  me/delete
apps/web/src/components/Footer.tsx  Analytics.tsx  CookieSettingsButton.tsx
docs/design/visual-direction.md
deploy/docker-compose.yml  create-db.sql  env.example  server-setup.md
e2e/playwright.config.ts  helpers.ts  portrait.spec.ts  launch.spec.ts
```

## Не входит в план 1

**Отличие от спецификации.** В разделе 6 спецификации ЮKassa, воркер, GigaChat и серверная проверка оплаты перечислены в этапе 0. Здесь они перенесены в план 2: в плане 1 нет ни одного платного продукта и ни одного вызова ИИ, поэтому переносить их сейчас — код без проверки делом. В плане 2 они приходят вместе с первым продуктом (разбор матрицы) и проверяются сквозным сценарием покупки.

- Практики, платные разборы, ЮKassa, оферта, ИИ и воркер — план 2 и дальше.
- Перенос даты из калькулятора в портрет до входа (отложенная cookie) — план 2, когда появится калькулятор.
- Время и город рождения — план 6 (натальная карта).
- Вход через Telegram, уведомления, сообщество ВК — вне первой версии (спецификация 6: «Не делаем в первой версии»).
- Бэкапы в S3 — отдельно после запуска; до этого перед каждой миграцией `deploy.yml` делает `pg_dump` на диск сервера.
