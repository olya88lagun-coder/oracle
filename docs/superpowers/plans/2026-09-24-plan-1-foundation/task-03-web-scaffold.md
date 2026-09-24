# Задача 3 — `apps/web`: окружение, визуальная система, главная, SEO-база

**Files:**
- Create: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`, `apps/web/.env.development.example`
- Create: `apps/web/src/lib/site.ts`, `apps/web/src/lib/seo.ts`, `apps/web/src/lib/practices.ts`
- Test: `apps/web/src/lib/site.test.ts`, `apps/web/src/lib/seo.test.ts`, `apps/web/src/lib/practices.test.ts`
- Create: `apps/web/src/server/env.ts`, `apps/web/src/server/db.ts`; Test: `apps/web/src/server/env.test.ts`
- Create: `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/app/page.tsx`, `apps/web/src/app/robots.ts`, `apps/web/src/app/sitemap.ts`, `apps/web/src/app/api/health/route.ts`
- Create: `apps/web/src/components/Header.tsx`
- Create: `docs/design/visual-direction.md`
- Modify: `vitest.config.ts` (добавить проект `apps/*`)

**Interfaces:**
- Consumes: `createDb`, `type Database` из `@oracle/db`.
- Produces:
  - `SITE_NAME = "ORACLE"`; `SITE_URL: string` — origin из `NEXT_PUBLIC_SITE_URL`; `readSiteUrl(value: string | undefined): string`
  - `publicMetadata(p: { title: string; description: string; path: string; absoluteTitle?: boolean }): Metadata`; `PUBLIC_PATHS: string[]` (задача 4 дописывает документы); `PRIVATE_PATHS: readonly string[]`
  - `type Practice = { slug: "matrix" | "lila" | "tarot" | "natal"; title: string; summary: string }`; `PRACTICES: readonly Practice[]`
  - `type AppEnv = { APP_URL: string; DATABASE_URL: string; SESSION_SECRET: string; VK_CLIENT_ID: string }`; `readEnv(source?): AppEnv`; `getEnv(): AppEnv`
  - `getDb(): Database`
  - CSS-классы (см. `globals.css` и `docs/design/visual-direction.md`): `page`, `page--wide`, `stack`, `row`, `eyebrow`, `display`, `lead`, `muted`, `error`, `success`, `card`, `card--accent`, `tag`, `button`, `button--ghost`, `button--block`, `field`, `input`, `choice`, `practice-grid`, `practice-card`, `site-header`, `footer`, `cookie-banner`, `link-button`, `disclaimer`

## Зачем

Спецификация 8: из v0.9 переносим визуальный язык — тёмный премиальный интерфейс без ярмарочной эзотерики. Здесь он фиксируется токенами и документом, чтобы следующие задачи и планы не изобретали цвета заново. Главная в плане 1 честно показывает четыре практики со статусом «скоро» и ведёт в «Мой портрет» — единственную работающую функцию плана.

Адрес сайта нужен и серверу (метаданные, `sitemap.xml`), и браузеру (Метрика работает только на боевом домене). Next подставляет `process.env.NEXT_PUBLIC_*` в код при сборке, поэтому адрес читается одной строкой в `site.ts` и дальше импортируется как `SITE_URL`. `APP_URL` из окружения сервера используется для редиректов и cookie; на сервере обе переменные совпадают.

## Шаги

- [ ] **Шаг 1. Пакет и конфигурация.**

`apps/web/package.json`:

```json
{
  "name": "@oracle/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@oracle/core": "workspace:*",
    "@oracle/db": "workspace:*",
    "drizzle-orm": "0.45.2",
    "jose": "6.2.12",
    "next": "16.3.5",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "zod": "4.6.5"
  },
  "devDependencies": {
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0"
  }
}
```

`apps/web/next.config.ts`:

```ts
import path from "node:path";
import type { NextConfig } from "next";

// `next build` запускается из apps/web (pnpm --filter), корень монорепо — на два уровня выше
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  transpilePackages: ["@oracle/core", "@oracle/db"],
  poweredByHeader: false,
};

export default nextConfig;
```

`apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "allowJs": false,
    "types": ["node"],
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src", ".next/types/**/*.ts", "next.config.ts"],
  "exclude": ["node_modules"]
}
```

`apps/web/vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

export default defineProject({
  // В tsconfig Next стоит jsx: "preserve" — для тестов JSX нужно компилировать самим
  oxc: { jsx: { runtime: "automatic", importSource: "react" } },
  test: {
    name: "web",
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    // site.ts читает адрес при импорте; в тестах — вымышленный домен
    env: { NEXT_PUBLIC_SITE_URL: "https://oracle.test" },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
```

`apps/web/.env.development.example`:

```
# Скопировать в apps/web/.env.development.local
APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable
DATABASE_POOL_MAX=1
SESSION_SECRET=local-dev-secret-local-dev-secret-local
VK_CLIENT_ID=1
DEV_LOGIN=1
```

В корневом `vitest.config.ts` заменить строку проектов:

```ts
    projects: ["packages/*", "apps/*"],
```

(комментарий над ней удалить).

```bash
export PATH="/c/Users/olya8/AppData/Roaming/npm:$PATH"
pnpm install
cp apps/web/.env.development.example apps/web/.env.development.local
```

- [ ] **Шаг 2. Тесты `lib` и `env` (RED).**

`apps/web/src/lib/site.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { readSiteUrl, SITE_URL } from "./site";

describe("readSiteUrl", () => {
  test("keeps only the origin, without a trailing slash", () => {
    expect(readSiteUrl("https://oracle.example/")).toBe("https://oracle.example");
    expect(readSiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  test("fails loudly when the address is missing or broken", () => {
    expect(() => readSiteUrl(undefined)).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => readSiteUrl("")).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => readSiteUrl("not a url")).toThrow();
  });

  test("the site address comes from the build environment", () => {
    expect(SITE_URL).toBe("https://oracle.test");
  });
});
```

`apps/web/src/lib/seo.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { PRIVATE_PATHS, PUBLIC_PATHS, publicMetadata } from "./seo";

describe("publicMetadata", () => {
  test("opens the page for indexing with a canonical address", () => {
    const metadata = publicMetadata({ title: "Контакты", description: "Как связаться", path: "/contacts" });

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({ canonical: "/contacts" });
    expect(metadata.title).toBe("Контакты");
    expect(metadata.openGraph).toMatchObject({ title: "Контакты", url: "/contacts", locale: "ru_RU", siteName: "ORACLE" });
  });

  test("an absolute title skips the site-wide template", () => {
    expect(publicMetadata({ title: "ORACLE", description: "d", path: "/", absoluteTitle: true }).title).toEqual({ absolute: "ORACLE" });
  });
});

describe("paths", () => {
  test("public and private paths never overlap", () => {
    for (const path of PUBLIC_PATHS) {
      expect(PRIVATE_PATHS.some((prefix) => path.startsWith(prefix))).toBe(false);
    }
  });

  test("the home page is public and the portrait is private", () => {
    expect(PUBLIC_PATHS).toContain("/");
    expect(PRIVATE_PATHS).toContain("/portret");
  });
});
```

`apps/web/src/lib/practices.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { PRACTICES } from "./practices";

describe("PRACTICES", () => {
  test("lists the four practices of the spec in launch order", () => {
    expect(PRACTICES.map((practice) => practice.slug)).toEqual(["matrix", "lila", "tarot", "natal"]);
  });

  test("every practice has a title and a one-sentence summary", () => {
    for (const practice of PRACTICES) {
      expect(practice.title.length).toBeGreaterThan(0);
      expect(practice.summary).toMatch(/^\S.+\.$/);
    }
  });
});
```

`apps/web/src/server/env.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { readEnv } from "./env";

const VALID = {
  APP_URL: "https://oracle.test",
  DATABASE_URL: "postgres://u:p@db:5432/oracle",
  SESSION_SECRET: "x".repeat(32),
  VK_CLIENT_ID: "54770000",
};

describe("readEnv", () => {
  test("accepts a complete environment and drops unrelated variables", () => {
    expect(readEnv({ ...VALID, PATH: "/usr/bin" })).toEqual(VALID);
  });

  test("names the invalid variables without printing their values", () => {
    const run = () => readEnv({ ...VALID, SESSION_SECRET: "short", VK_CLIENT_ID: undefined });

    expect(run).toThrow(/SESSION_SECRET/);
    expect(run).toThrow(/VK_CLIENT_ID/);
    expect(run).not.toThrow(/short/);
  });
});
```

Запуск: `pnpm vitest run apps/web`. Ожидается FAIL: модули не найдены.

- [ ] **Шаг 3. Реализация `lib` и `server`.**

`apps/web/src/lib/site.ts`:

```ts
export const SITE_NAME = "ORACLE";

export function readSiteUrl(value: string | undefined): string {
  if (!value) throw new Error("NEXT_PUBLIC_SITE_URL is required");
  return new URL(value).origin;
}

// Next подставляет литерал process.env.NEXT_PUBLIC_SITE_URL при сборке — и в серверный, и в браузерный код
export const SITE_URL = readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
```

`apps/web/src/lib/seo.ts`:

```ts
import type { Metadata } from "next";
import { SITE_NAME } from "./site";

// Личные страницы: вход, портрет и всё, что под ними. В поиск не попадают
export const PRIVATE_PATHS: readonly string[] = ["/api/", "/login", "/portret"];

// Документы добавляет задача 4, страницы практик — следующие планы
export const PUBLIC_PATHS: string[] = ["/"];

export function publicMetadata(p: { title: string; description: string; path: string; absoluteTitle?: boolean }): Metadata {
  return {
    title: p.absoluteTitle ? { absolute: p.title } : p.title,
    description: p.description,
    robots: { index: true, follow: true },
    alternates: { canonical: p.path },
    openGraph: { title: p.title, description: p.description, url: p.path, type: "website", locale: "ru_RU", siteName: SITE_NAME },
  };
}
```

`apps/web/src/lib/practices.ts`:

```ts
export type Practice = { slug: "matrix" | "lila" | "tarot" | "natal"; title: string; summary: string };

// Порядок — порядок запуска из спецификации (раздел 6)
export const PRACTICES: readonly Practice[] = [
  { slug: "matrix", title: "Матрица судьбы", summary: "22 аркана по дате рождения: сильные стороны, повторяющиеся сценарии и точки роста." },
  { slug: "lila", title: "Лила", summary: "Игра с намерением на поле из 72 клеток — повод посмотреть на свой вопрос по-новому." },
  { slug: "tarot", title: "Таро", summary: "Расклад на вопрос и карта дня: символы как зеркало, а не приговор." },
  { slug: "natal", title: "Натальная карта", summary: "Настоящий расчёт по дате, времени и месту рождения." },
];
```

`apps/web/src/server/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  VK_CLIENT_ID: z.string().regex(/^\d+$/),
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  // В сообщение попадают только имена переменных: значения могут быть секретами
  if (!parsed.success) throw new Error(`Invalid environment variables: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  return parsed.data;
}

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  cached ??= readEnv();
  return cached;
}
```

`apps/web/src/server/db.ts`:

```ts
import { createDb, type Database } from "@oracle/db";
import { getEnv } from "./env";

// Route handlers и страницы Next собираются в разные бандлы, а HMR перезагружает модули:
// храним пул в globalThis, чтобы на процесс было ровно одно подключение
const holder = globalThis as typeof globalThis & { __oracleDb?: Database };

export function getDb(): Database {
  // Локальная PGlite-БД обслуживает одно соединение: DATABASE_POOL_MAX=1 в .env.development.local
  const maxConnections = process.env.DATABASE_POOL_MAX ? Number(process.env.DATABASE_POOL_MAX) : undefined;
  holder.__oracleDb ??= createDb(getEnv().DATABASE_URL, { maxConnections });
  return holder.__oracleDb;
}
```

Запуск: `pnpm vitest run apps/web`. Ожидается PASS.

- [ ] **Шаг 4. Визуальная система.** `docs/design/visual-direction.md`:

```markdown
# ORACLE — визуальное направление

Источник — интерфейс v0.9 (`C:\Users\olya8\oracle_mvp_v09\index.html`), который владелица приняла как «современный тёмный премиальный». Здесь он зафиксирован токенами. Цвета в компонентах — только через CSS-переменные из `apps/web/src/app/globals.css`.

## Настроение

Тихий ночной интерфейс: глубокий почти чёрный фон с лёгким фиолетовым свечением сверху, светлый текст, один акцент — лавандовый. Символ практики важнее декора.

**Нельзя:** звёзды и блёстки россыпью, свечи, золотые завитки, глаз в треугольнике, «магические» шрифты с засечками-крючками, анимация «мерцания», красный как цвет тревоги в предсказаниях.

## Токены

| Токен | Значение | Где |
|---|---|---|
| `--bg` | `#08070D` | фон страницы |
| `--surface` | `#12101A` | карточки |
| `--surface-2` | `#171321` | вложенные блоки, поля ввода при наведении |
| `--surface-3` | `#21182F` | акцентные карточки (градиент с `--surface`) |
| `--line` | `#2D2638` | рамки |
| `--line-strong` | `#55416F` | рамка акцентной карточки, фокус |
| `--ink` | `#F6F1FF` | основной текст |
| `--ink-soft` | `#AAA1B9` | второстепенный текст |
| `--ink-faint` | `#8F879A` | подписи, оговорки |
| `--accent` | `#B89CFF` | кнопки, ссылки, фокус |
| `--accent-hover` | `#C9B3FF` | наведение на кнопку |
| `--accent-ink` | `#100B17` | текст на кнопке |
| `--accent-soft` | `#E9D5FF` | надзаголовки (`eyebrow`) |
| `--good` | `#9FE6D2` | подтверждения |
| `--danger` | `#FF8A8A` | ошибки |

Контраст основного и второстепенного текста на `--bg` и `--surface` — не ниже 4.5:1.

## Типографика

Manrope (кириллица и латиница), начертания 400, 600, 800. Заголовок первого экрана — 800, плотный трекинг (`-0.04em`), крупный кегль через `clamp`. Надзаголовки — 11 px, 700, капсом, разрядка `0.15em`, цвет `--accent-soft`.

## Форма

Радиус 16 px, у крупных карточек 24 px. Глубина — тоном поверхности и тонкой рамкой `--line`; одна мягкая тень у карточек. Кнопка основного действия — одна на экран.
```

`apps/web/src/app/globals.css`:

```css
:root {
  color-scheme: dark;
  --bg: #08070D;
  --surface: #12101A;
  --surface-2: #171321;
  --surface-3: #21182F;
  --line: #2D2638;
  --line-strong: #55416F;
  --ink: #F6F1FF;
  --ink-soft: #AAA1B9;
  --ink-faint: #8F879A;
  --accent: #B89CFF;
  --accent-hover: #C9B3FF;
  --accent-ink: #100B17;
  --accent-soft: #E9D5FF;
  --good: #9FE6D2;
  --danger: #FF8A8A;
  --radius: 16px;
  --radius-lg: 24px;
  --shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  --font-body: var(--font-manrope), system-ui, sans-serif;
}

* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  min-height: 100vh;
  background: radial-gradient(circle at 15% 0, #24183A 0, #0B0911 38%, var(--bg) 100%) fixed;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-underline-offset: 4px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
h1, h2, h3 { margin: 0; line-height: 1.15; letter-spacing: -0.02em; }
h2 { font-size: 28px; font-weight: 800; }
h3 { font-size: 20px; font-weight: 800; }

.page { max-width: 720px; margin: 0 auto; padding: 24px 16px 96px; }
.page--wide { max-width: 1120px; }
@media (min-width: 900px) { .page { padding: 40px 28px 120px; } }
body .stack > * + * { margin-top: 20px; }
.row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }

.site-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; max-width: 1120px; margin: 0 auto; padding: 16px; }
.site-header__logo { color: var(--ink); font-weight: 800; letter-spacing: 0.2em; text-decoration: none; }
.site-header a:not(.site-header__logo) { color: var(--ink-soft); font-size: 14px; text-decoration: none; }

.eyebrow { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent-soft); }
.display { font-size: clamp(40px, 9vw, 80px); font-weight: 800; line-height: 0.98; letter-spacing: -0.04em; }
.lead { margin: 0; font-size: 18px; color: var(--ink-soft); max-width: 640px; }
.muted { color: var(--ink-soft); font-size: 14px; }
.error { color: var(--danger); font-weight: 600; }
.success { color: var(--good); }
.tag { display: inline-flex; width: fit-content; padding: 6px 10px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--accent-soft); font-size: 12px; }

.card { background: linear-gradient(180deg, var(--surface-2), var(--surface)); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 24px 20px; box-shadow: var(--shadow); }
@media (min-width: 760px) { .card { padding: 32px; } }
.card--accent { border-color: var(--line-strong); background: linear-gradient(135deg, var(--surface-3), var(--surface)); }

.button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 13px 20px; border: 0; border-radius: var(--radius); background: var(--accent); color: var(--accent-ink); font: inherit; font-weight: 800; text-decoration: none; cursor: pointer; transition: background 200ms ease; }
.button:hover { background: var(--accent-hover); }
.button:disabled { opacity: 0.5; cursor: not-allowed; }
.button--ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 1px var(--line-strong); }
.button--ghost:hover { background: var(--surface-2); }
.button--block { width: 100%; }

.field { display: grid; gap: 8px; }
.field label { color: var(--ink-soft); font-size: 13px; }
.input { width: 100%; min-height: 48px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--radius); background: #0B0910; color: var(--ink); font: inherit; color-scheme: dark; }
.input:focus { border-color: var(--line-strong); outline: none; box-shadow: 0 0 0 3px rgba(184, 156, 255, 0.12); }
.choice { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; color: var(--ink-soft); cursor: pointer; }
.choice input { width: 18px; height: 18px; margin-top: 2px; accent-color: var(--accent); }

.practice-grid { display: grid; gap: 12px; list-style: none; margin: 0; padding: 0; }
@media (min-width: 760px) { .practice-grid { grid-template-columns: 1fr 1fr; } }
.practice-card { display: grid; gap: 10px; align-content: start; padding: 20px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
.practice-card h3 { margin: 0; }
.practice-card p { margin: 0; color: var(--ink-soft); font-size: 14px; }

.footer { max-width: 1120px; margin: 0 auto; padding: 24px 16px 40px; font-size: 13px; color: var(--ink-faint); }
.footer nav { display: flex; flex-wrap: wrap; gap: 10px 20px; padding-top: 20px; border-top: 1px solid var(--line); }
.footer a, .footer .link-button { color: var(--ink-faint); }
.disclaimer { margin: 16px 0 0; max-width: 720px; }
.link-button { background: none; border: 0; padding: 0; font: inherit; text-decoration: underline; cursor: pointer; }
.cookie-banner { position: fixed; z-index: 10; inset-inline: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); max-width: 608px; margin-inline: auto; padding: 20px; border: 1px solid var(--line-strong); border-radius: var(--radius); background: var(--surface-2); color: var(--ink); font-size: 14px; box-shadow: var(--shadow); }
.cookie-banner p { margin: 0 0 14px; }
body.has-cookie-banner { padding-bottom: 220px; }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
```

- [ ] **Шаг 5. Оболочка и главная.**

`apps/web/src/components/Header.tsx`:

```tsx
import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__logo">
        ORACLE
      </Link>
      <Link href="/portret">Мой портрет</Link>
    </header>
  );
}
```

`apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const body = Manrope({ subsets: ["latin", "cyrillic"], weight: ["400", "600", "800"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — символические практики для самопознания`, template: `%s — ${SITE_NAME}` },
  description: "Матрица судьбы, Лила, таро и натальная карта как инструмент самопознания — без обещаний предсказать будущее.",
  // По умолчанию страницы закрыты от поиска: вход и портрет личные. Публичные страницы включают индексацию через publicMetadata
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={body.variable}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
```

`apps/web/src/app/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PRACTICES } from "@/lib/practices";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "ORACLE — символические практики для самопознания",
  description: "Матрица судьбы, Лила, таро и натальная карта как инструмент самопознания — без обещаний предсказать будущее.",
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <main className="page page--wide stack">
      <p className="eyebrow">Символические практики · самопознание</p>
      <h1 className="display">
        Иногда нужен не ответ.
        <br />А другой взгляд.
      </h1>
      <p className="lead">
        ORACLE помогает исследовать личный вопрос через символы матрицы судьбы, Лилы, таро и натальной карты. Мы не предсказываем будущее —
        помогаем увидеть, что происходит сейчас.
      </p>

      <section className="stack" aria-labelledby="practices">
        <h2 id="practices">Практики</h2>
        <ul className="practice-grid">
          {PRACTICES.map((practice) => (
            <li key={practice.slug} className="practice-card">
              <span className="tag">Скоро</span>
              <h3>{practice.title}</h3>
              <p>{practice.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card card--accent stack">
        <p className="eyebrow">Мой портрет</p>
        <h2>Одна дата рождения — для всех практик</h2>
        <p className="muted">Сохраните дату один раз: каждая новая практика откроется в портрете сразу, без повторного ввода.</p>
        <p>
          <Link className="button" href="/portret">
            Открыть портрет
          </Link>
        </p>
      </section>
    </main>
  );
}
```

`apps/web/src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { PRIVATE_PATHS } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] }], sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
```

`apps/web/src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { PUBLIC_PATHS } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));
}
```

`apps/web/src/app/api/health/route.ts`:

```ts
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("health check failed", error);
    return Response.json({ ok: false }, { status: 503 });
  }
}
```

- [ ] **Шаг 6. Проверка в браузере.** В двух терминалах:

```bash
pnpm dev:db
pnpm dev:web
```

Открыть `http://localhost:3000` (Browser pane, `preview_start`): тёмная страница, заголовок «Иногда нужен не ответ. А другой взгляд.», четыре карточки «Скоро», кнопка «Открыть портрет». `http://localhost:3000/api/health` → `{"ok":true}`. `http://localhost:3000/robots.txt` содержит `Disallow: /portret`. Проверить ширину 375 px (`resize_window` preset `mobile`): нет горизонтальной прокрутки. Сделать скриншот для отчёта.

Если `next dev` дописал блок в `apps/web/AGENTS.md` или создал `apps/web/CLAUDE.md` — это ожидаемо (см. тот же файл в Гранях), файлы коммитятся вместе с задачей.

- [ ] **Шаг 7. Проверки и коммит.**

```bash
pnpm vitest run
pnpm typecheck
git add vitest.config.ts apps/web docs/design pnpm-lock.yaml
git commit -m "feat(web): Next app scaffold, dark visual system, home page and SEO base"
```
