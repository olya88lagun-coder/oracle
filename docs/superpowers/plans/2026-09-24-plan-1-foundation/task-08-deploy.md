# Задача 8 — Образы, выкладка на общий VPS, подготовка сервера

**Files:**
- Create: `Dockerfile`, `.dockerignore`
- Create: `.github/workflows/images.yml`, `.github/workflows/deploy.yml`
- Create: `deploy/docker-compose.yml`, `deploy/create-db.sql`, `deploy/env.example`, `deploy/server-setup.md`

**Interfaces:**
- Consumes: сборка `@oracle/web` (`output: "standalone"`, задача 3); `packages/db/scripts/migrate.mjs` (задача 2); маршрут `/api/health` (задача 3); `NEXT_PUBLIC_SITE_URL`.
- Produces:
  - образы `ghcr.io/<owner>/oracle-web` и `ghcr.io/<owner>/oracle-migrate` с тегами `latest` и `sha-<7 символов>`
  - переменная репозитория GitHub `SITE_URL` (например, `https://oracle-example.ru`) — адрес сайта для сборки и smoke-проверок
  - каталог `/opt/oracle` на сервере: `docker-compose.yml`, `.env`, `.db_password`, `backups/`

## Зачем

Спецификация 6, этап 0: деплой на VPS, отдельный домен. Схема выкладки уже работает у wishlist и Граней на том же сервере: образы собирает GitHub Actions, сервер только скачивает их, применяет миграции и перезапускает контейнер. База — отдельная БД `oracle` в Postgres трекера питания, наружу сайт выпускает Caddy трекера. Воркера в плане 1 нет: он появится в плане 2 вместе с ИИ.

Адрес сайта попадает в сборку через `--build-arg NEXT_PUBLIC_SITE_URL` из переменной репозитория `SITE_URL`: Next вшивает `NEXT_PUBLIC_*` в код при сборке. Без этой переменной сборка падает сразу, а не выпускает сайт с чужим адресом в `canonical`.

## Шаги

- [ ] **Шаг 1. Образы.** `Dockerfile`:

```dockerfile
ARG NODE_VERSION=24-slim

FROM node:${NODE_VERSION} AS deps
WORKDIR /repo
RUN corepack enable
COPY . .
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Адрес сайта Next вшивает в код при сборке: canonical, sitemap, проверка домена для Метрики
FROM deps AS build
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
RUN test -n "$NEXT_PUBLIC_SITE_URL" || (echo "NEXT_PUBLIC_SITE_URL build arg is required" >&2 && exit 1)
RUN pnpm --filter @oracle/web build

# pnpm держит зависимости пакета симлинками в корневой node_modules/.pnpm, поэтому копируются оба каталога
FROM node:${NODE_VERSION} AS migrate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/db ./packages/db
USER node
CMD ["node", "packages/db/scripts/migrate.mjs"]

FROM node:${NODE_VERSION} AS web
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
```

`.dockerignore`:

```
node_modules
**/node_modules
.next
**/.next
.git
.env
**/.env*
!**/.env.example
.dev-db
.dev-db-*
coverage
docs
e2e
**/dist
**/test-results
**/playwright-report
```

`.github/workflows/images.yml`:

```yaml
name: images
on:
  push:
    branches: [master]
permissions:
  contents: read
  packages: write
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        target: [web, migrate]
    steps:
      - uses: actions/checkout@v4
      - name: Check site address
        run: |
          if [[ -z "${{ vars.SITE_URL }}" ]]; then
            echo "Repository variable SITE_URL is not set (Settings → Secrets and variables → Actions → Variables)." >&2
            exit 1
          fi
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        run: |
          owner=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')
          echo "image=ghcr.io/${owner}/oracle-${{ matrix.target }}" >> "$GITHUB_OUTPUT"
          echo "sha=sha-${GITHUB_SHA::7}" >> "$GITHUB_OUTPUT"
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: Dockerfile
          target: ${{ matrix.target }}
          build-args: |
            NEXT_PUBLIC_SITE_URL=${{ vars.SITE_URL }}
          push: true
          tags: |
            ${{ steps.meta.outputs.image }}:latest
            ${{ steps.meta.outputs.image }}:${{ steps.meta.outputs.sha }}
          cache-from: type=gha,scope=${{ matrix.target }}
          cache-to: type=gha,mode=max,scope=${{ matrix.target }}
```

- [ ] **Шаг 2. Выкладка.** `.github/workflows/deploy.yml`:

```yaml
name: deploy

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: oracle-deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
      DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
      DEPLOY_SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
      DEPLOY_KNOWN_HOSTS: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
      SITE_URL: ${{ vars.SITE_URL }}

    steps:
      - name: Check deploy configuration
        id: config
        shell: bash
        run: |
          if [[ -n "$DEPLOY_HOST" && -n "$DEPLOY_USER" && -n "$DEPLOY_SSH_KEY" && -n "$DEPLOY_KNOWN_HOSTS" && -n "$SITE_URL" ]]; then
            echo "configured=true" >> "$GITHUB_OUTPUT"
          else
            echo "configured=false" >> "$GITHUB_OUTPUT"
            echo "Deployment secrets or SITE_URL are not configured yet; deployment will be skipped."
          fi

      - name: Configure SSH
        if: steps.config.outputs.configured == 'true'
        shell: bash
        run: |
          install -d -m 700 ~/.ssh
          printf '%s\n' "$DEPLOY_SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > ~/.ssh/known_hosts
          chmod 644 ~/.ssh/known_hosts

      - name: Deploy web
        if: steps.config.outputs.configured == 'true'
        shell: bash
        run: |
          expected_tag="sha-${GITHUB_SHA:0:7}"
          remote_script="$(mktemp)"
          trap 'rm -f "$remote_script"' EXIT
          cat > "$remote_script" <<'REMOTE'
          set -euo pipefail
          EXPECTED_TAG="${1:?expected tag is required}"
          SITE="${2:?site url is required}"
          cd /opt/oracle
          owner="$(grep -E '^GHCR_OWNER=' .env | cut -d= -f2)"
          targets=(web migrate)

          # images.yml собирает образы параллельно — ждём, пока появятся все с тегом этого коммита
          for target in "${targets[@]}"; do
            image="ghcr.io/$owner/oracle-$target"
            for attempt in $(seq 1 60); do
              if docker pull -q "$image:$EXPECTED_TAG" >/dev/null; then
                break
              fi
              if [[ "$attempt" -eq 60 ]]; then
                echo "Expected image $image:$EXPECTED_TAG was not published in time." >&2
                exit 1
              fi
              sleep 10
            done
            docker tag "$image:$EXPECTED_TAG" "$image:latest"
          done

          # Миграции не откатываются — перед ними копия базы; хранятся пять последних
          mkdir -p backups
          docker exec food-tracker-bot-db-1 pg_dump -U food_tracker -d oracle --no-owner | gzip > "backups/pre-$EXPECTED_TAG.sql.gz"
          ls -1t backups/pre-*.sql.gz | tail -n +6 | xargs -r rm -f

          docker compose run --rm migrate
          docker compose up -d --force-recreate web

          for attempt in $(seq 1 30); do
            health="$(docker inspect -f '{{.State.Health.Status}}' oracle-web-1 2>/dev/null || true)"
            if [[ "$health" == "healthy" ]]; then
              break
            fi
            if [[ "$attempt" -eq 30 ]]; then
              echo "oracle-web-1 did not become healthy in time." >&2
              docker inspect -f '{{json .State.Health}}' oracle-web-1 || true
              exit 1
            fi
            sleep 3
          done

          tmp=$(mktemp -d)
          trap 'rm -rf "$tmp"' EXIT

          curl -fsS "$SITE/" > "$tmp/home.html"
          curl -fsS "$SITE/contacts" > "$tmp/contacts.html"
          curl -fsS "$SITE/portret" > "$tmp/portret.html"
          curl -fsS "$SITE/login" > "$tmp/login.html"
          curl -fsS "$SITE/sitemap.xml" > "$tmp/sitemap.xml"
          curl -fsS "$SITE/robots.txt" > "$tmp/robots.txt"

          assert_contains() {
            local needle="$1"
            local file="$2"
            local label="$3"
            if ! grep -Fq "$needle" "$file"; then
              echo "SMOKE TEST FAILED: $label"
              echo "Expected: $needle"
              case "$file" in
                *.html) grep -o '<title>[^<]*</title>' "$file" | head -1 || true ;;
                *) head -c 2000 "$file" || true; echo ;;
              esac
              exit 1
            fi
          }

          assert_status() {
            local expected="$1"
            local label="$2"
            shift 2
            local status
            status="$(curl -s -o /dev/null -w '%{http_code}' "$@")"
            if [[ ! " $expected " == *" $status "* ]]; then
              echo "SMOKE TEST FAILED: $label — got $status, expected one of: $expected"
              exit 1
            fi
          }

          assert_contains '<title>ORACLE — символические практики для самопознания</title>' "$tmp/home.html" "home title"
          assert_contains "rel=\"canonical\" href=\"$SITE\"" "$tmp/home.html" "home canonical"
          assert_contains 'content="index, follow"' "$tmp/home.html" "home indexable"
          assert_contains 'ИНН' "$tmp/contacts.html" "contacts INN"
          assert_contains 'noindex' "$tmp/portret.html" "portrait is not indexed"
          assert_contains 'noindex' "$tmp/login.html" "login is not indexed"
          assert_contains "$SITE/privacy" "$tmp/sitemap.xml" "sitemap documents"
          assert_contains "Sitemap: $SITE/sitemap.xml" "$tmp/robots.txt" "robots sitemap"
          assert_contains 'Disallow: /portret' "$tmp/robots.txt" "robots private pages"

          assert_status "404" "dev login is off in production" "$SITE/api/dev/login"
          assert_status "403" "profile API checks the origin" -X POST "$SITE/api/profile/birth-date" -d '{}'

          echo "Deployment and smoke tests passed."

          # Диск общий с трекером, wishlist и Гранями: оставляем текущий релиз и один предыдущий для отката
          for target in "${targets[@]}"; do
            image="ghcr.io/$owner/oracle-$target"
            mapfile -t old_tags < <(
              docker images "$image" --format '{{.CreatedAt}}\t{{.Tag}}' |
                sort -r |
                awk -F '\t' -v current="$EXPECTED_TAG" '$2 ~ /^sha-/ && $2 != current {print $2}' |
                tail -n +2
            )
            for tag in "${old_tags[@]}"; do
              docker rmi "$image:$tag" >/dev/null || echo "Could not remove $image:$tag" >&2
            done
          done
          docker image prune -f --filter "until=24h" >/dev/null || true
          df -h / | awk 'NR == 2 {print "Disk usage: " $3 " of " $2 " (" $5 ")"}'
          REMOTE

          ssh_args=(
            -i ~/.ssh/deploy_key
            -4
            -o IdentitiesOnly=yes
            -o StrictHostKeyChecking=yes
            -o ConnectTimeout=15
            -o ConnectionAttempts=3
            -o ServerAliveInterval=10
            -o ServerAliveCountMax=3
          )

          # Код 255 — сбой самого SSH-соединения: повторяем; любой другой код — результат скрипта
          for ssh_attempt in 1 2 3; do
            set +e
            ssh "${ssh_args[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "bash -s -- '$expected_tag' '$SITE_URL'" < "$remote_script"
            ssh_rc=$?
            set -e

            if [[ "$ssh_rc" -eq 0 ]]; then
              exit 0
            fi

            if [[ "$ssh_rc" -ne 255 || "$ssh_attempt" -eq 3 ]]; then
              exit "$ssh_rc"
            fi

            echo "SSH connection failed (exit 255); retrying in 5 seconds (attempt $((ssh_attempt + 1))/3)." >&2
            sleep 5
          done
```

- [ ] **Шаг 3. Файлы сервера.**

`deploy/docker-compose.yml`:

```yaml
name: oracle

services:
  web:
    image: ghcr.io/${GHCR_OWNER}/oracle-web:latest
    env_file: .env
    restart: unless-stopped
    mem_limit: 350m
    networks:
      shared:
        aliases: [oracle-web]

  migrate:
    image: ghcr.io/${GHCR_OWNER}/oracle-migrate:latest
    env_file: .env
    profiles: ["tools"]
    mem_limit: 200m
    networks: [shared]

networks:
  shared:
    external: true
    name: food-tracker-bot_default
```

`deploy/create-db.sql`:

```sql
SELECT format('CREATE ROLE oracle LOGIN PASSWORD %L', :'pw')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'oracle') \gexec

SELECT 'CREATE DATABASE oracle OWNER oracle'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'oracle') \gexec

SELECT datname FROM pg_database WHERE datname = 'oracle';
```

`deploy/env.example`:

```
# Переменные сайта. Незаполненные строки удалить или закомментировать:
# пустое значение («KEY=») считается ошибкой настройки, и сайт не запустится.

# --- заполняются при настройке сервера (server-setup.md, раздел 4) ---
APP_URL=https://<домен>
NEXT_PUBLIC_SITE_URL=https://<домен>
DATABASE_URL=postgres://oracle:<пароль из .db_password>@db:5432/oracle
SESSION_SECRET=<openssl rand -hex 32>
GHCR_OWNER=olya88lagun-coder
NODE_ENV=production

# --- вписывает владелица сама ---
VK_CLIENT_ID=<ID приложения VK ID для ORACLE>
```

`deploy/server-setup.md`:

````markdown
# ORACLE — выкладка на общий VPS

Сервер `root@200.169.178.231` (Timeweb, Москва) общий с трекером питания (`/opt/food-tracker-bot`), wishlist (`/opt/wishlist`) и Гранями (`/opt/grani`). У трекера трогаем только две вещи: создаём БД и роль `oracle` в его Postgres и **дописываем** блок в его `Caddyfile`. Каталог ORACLE — `/opt/oracle`.

Во всех командах ниже `DOMAIN` — домен ORACLE без `https://`. Перед началом в терминале: `DOMAIN=<домен>`.

## 1. Память

```bash
free -h
docker stats --no-stream --format "{{.Name}} {{.MemUsage}}"
```

Лимит ORACLE: `web` 350 МБ. Если свободно меньше 500 МБ — увеличить память в панели Timeweb до запуска.

## 2. DNS

A-запись домена → `200.169.178.231`. Проверка: `getent hosts $DOMAIN` на сервере возвращает этот адрес.

## 3. Каталог и база данных

С машины разработчика:

```bash
ssh root@200.169.178.231 'mkdir -p /opt/oracle/backups && chmod 700 /opt/oracle'
scp deploy/create-db.sql deploy/docker-compose.yml root@200.169.178.231:/opt/oracle/
```

На сервере:

```bash
cd /opt/oracle
[ -f .db_password ] || { openssl rand -hex 24 > .db_password; chmod 600 .db_password; }
docker exec -i food-tracker-bot-db-1 psql -U food_tracker -d postgres -v ON_ERROR_STOP=1 -v pw="$(cat .db_password)" -At < create-db.sql
```

Последняя строка вывода — `oracle`. Скрипт можно запускать повторно.

## 4. `.env`

```bash
cd /opt/oracle
[ -f .env ] || cat > .env <<EOF
APP_URL=https://$DOMAIN
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
DATABASE_URL=postgres://oracle:$(cat .db_password)@db:5432/oracle
SESSION_SECRET=$(openssl rand -hex 32)
GHCR_OWNER=olya88lagun-coder
NODE_ENV=production
VK_CLIENT_ID=PASTE_VK_CLIENT_ID
EOF
chmod 600 .env
```

Затем владелица открывает `nano /opt/oracle/.env` и вписывает ID приложения VK ID вместо `PASTE_VK_CLIENT_ID`. **Пустых переменных быть не должно.**

## 5. Доступ к образам

Образы `ghcr.io/olya88lagun-coder/oracle-{web,migrate}` публикует workflow `images` после каждого мержа в `master`. У пакетов GHCR видимость по умолчанию закрытая. На сервере уже есть `docker login ghcr.io` под тем же владельцем (wishlist, Грани) — проверить: `docker pull ghcr.io/olya88lagun-coder/oracle-web:latest`.

## 6. Первый запуск

После первой публикации образов:

```bash
cd /opt/oracle
docker compose --profile tools pull
docker compose run --rm migrate
docker compose up -d web
docker compose ps
```

## 7. Caddy

`Caddyfile` трекера смонтирован как отдельный файл: **только дописывать (`>>`)**, не редактировать через `sed -i` или редакторы, которые меняют inode.

```bash
cd /opt/food-tracker-bot
cp Caddyfile Caddyfile.bak-$(date +%Y%m%d%H%M%S)
grep -q "oracle-web:3000" Caddyfile || printf "\n%s {\n\tencode gzip\n\treverse_proxy oracle-web:3000\n}\n" "$DOMAIN" >> Caddyfile
docker exec food-tracker-bot-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile \
  && docker exec food-tracker-bot-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
curl -fsS https://$DOMAIN/api/health
curl -fsS -o /dev/null -w "trackermeal %{http_code}\n" https://trackermeal.ru
curl -fsS -o /dev/null -w "wishlist %{http_code}\n" https://my-wish-list.online
curl -fsS -o /dev/null -w "grani %{http_code}\n" https://grani-test.ru
```

Если `validate` падает — не перезагружать, восстановить `Caddyfile` из `Caddyfile.bak-*`. Если `caddy reload` пишет `config is unchanged`, контейнер видит старую версию файла — применить так:

```bash
docker exec -i food-tracker-bot-caddy-1 sh -c "cat > /tmp/Caddyfile" < /opt/food-tracker-bot/Caddyfile
docker exec food-tracker-bot-caddy-1 caddy validate --config /tmp/Caddyfile --adapter caddyfile \
  && docker exec food-tracker-bot-caddy-1 caddy reload --config /tmp/Caddyfile --adapter caddyfile
```

Сертификат Caddy получает сам при первом запросе. Блока для `www` нет.

## 8. GitHub

Репозиторий → Settings → Secrets and variables → Actions:

- **Variables:** `SITE_URL` = `https://<домен>` (без слэша в конце). Без неё `images` падает, а `deploy` пропускает выкладку.
- **Secrets** — такие же, как у wishlist и Граней: `DEPLOY_HOST` (`200.169.178.231`), `DEPLOY_USER` (`root`), `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` (вывод `ssh-keyscan 200.169.178.231`).

## 9. VK ID

В настройках приложения ORACLE на id.vk.ru: доверенный Redirect URL `https://<домен>/api/auth/vk/callback`, базовый домен `<домен>`.

## 10. Логи и откат

```bash
docker logs --since 30m oracle-web-1
```

Откат на предыдущий образ:

```bash
cd /opt/oracle
docker images ghcr.io/olya88lagun-coder/oracle-web --format '{{.Tag}} {{.CreatedAt}}'
docker tag ghcr.io/olya88lagun-coder/oracle-web:sha-<предыдущий> ghcr.io/olya88lagun-coder/oracle-web:latest
docker compose up -d web
```

Миграции не откатываются. Восстановление базы из копии — при остановленном `web`:

```bash
cd /opt/oracle
docker compose stop web
docker exec -i food-tracker-bot-db-1 psql -U food_tracker -d postgres -c "DROP DATABASE oracle" -c "CREATE DATABASE oracle OWNER oracle"
gunzip -c backups/pre-<тег>.sql.gz | docker exec -i food-tracker-bot-db-1 psql -U oracle -d oracle -v ON_ERROR_STOP=1
docker compose up -d web
```
````

- [ ] **Шаг 4. Сборка локально.** Production-сборка должна проходить без предупреждений и с адресом из переменной:

```bash
cd /c/dev/oracle/apps/web
NEXT_PUBLIC_SITE_URL=https://oracle.test pnpm build
cd /c/dev/oracle
grep -rl "https://oracle.test" apps/web/.next/server/app/index.html
```

Ожидается: сборка успешна, файл главной содержит адрес. Сборка без переменной (`NEXT_PUBLIC_SITE_URL= pnpm --filter @oracle/web build`) падает с `NEXT_PUBLIC_SITE_URL is required`.

Если на машине есть Docker — дополнительно `docker build --target web --build-arg NEXT_PUBLIC_SITE_URL=https://oracle.test -t oracle-web:local .`. Если Docker нет, образ проверит workflow `images` после мержа.

- [ ] **Шаг 5. Коммит.**

```bash
git add Dockerfile .dockerignore .github/workflows/images.yml .github/workflows/deploy.yml deploy
git commit -m "ci(deploy): web and migrate images, compose, Caddy block and deploy workflow with smoke tests"
```

- [ ] **Шаг 6. Подготовка сервера (делает владелица, агент подсказывает).** Нужны домен, ID приложения VK ID и A-запись (предварительные действия, п. 1–3). По `deploy/server-setup.md` выполнить разделы 1–5 и 7–9 **до мержа**: первую выкладку делает workflow `deploy` (миграции и запуск `web`), и его smoke-проверки ходят на домен через Caddy. До первой выкладки `curl https://$DOMAIN/api/health` в разделе 7 отвечает `502` — это ожидаемо; сертификат Caddy получает и без работающего сайта. Раздел 6 нужен только для ручного запуска. Команды по SSH агент запускает только с явного разрешения на каждый шаг.
