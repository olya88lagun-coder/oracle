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
