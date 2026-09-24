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

### Срок хранения копий

Деплой сам хранит только пять последних копий и удаляет те, что старше 30 дней, но выкладки могут быть редкими, и без деплоя чистка не запустится. На сервере нужна ежедневная проверка через cron: `crontab -e`, затем добавить строку

```
0 4 * * * find /opt/oracle/backups -name 'pre-*.sql.gz' -mtime +30 -delete
```
