# Задача 6 — 22 страницы арканов

**Files:**
- Create: `apps/web/src/lib/arcana-paths.ts`; Test: `apps/web/src/lib/arcana-paths.test.ts`
- Modify: `apps/web/src/lib/seo.ts`, `apps/web/src/lib/seo.test.ts`
- Create: `apps/web/src/components/CalculatorLink.tsx`, `apps/web/src/components/ArcanaIndex.tsx`
- Create: `apps/web/src/app/matrica-sudby/[arkan]/page.tsx`
- Modify: `apps/web/src/app/globals.css` (блок «Страница аркана»)

**Interfaces:**
- Consumes: `ARCANA`, `arcanumByNumber`, `type Arcanum`, `SECTION_TITLES` из `@oracle/content` (задачи 2–3); `publicMetadata`, `PUBLIC_PATHS` (план 1); `reachGoal` (задача 5); `SITE_URL`, `SITE_NAME`.
- Produces:
  - `MATRIX_PATH = "/matrica-sudby"`
  - `arcanumParam(a: { number: number; slug: string }): string` — `"arkan-11-sila"`
  - `arcanumPath(a): string` — `"/matrica-sudby/arkan-11-sila"`
  - `arcanumFromParam(param: string): Arcanum | null`
  - `arcanumJsonLd(a: Arcanum, siteUrl: string): Record<string, unknown>` — разметка `Article`
  - `PUBLIC_PATHS` включает `/matrica-sudby` и 22 пути арканов (попадают в `sitemap.xml`)
  - `<CalculatorLink className? children>` — ссылка на `/matrica-sudby` с целью `arcana_to_calculator`
  - `<ArcanaIndex current? />` — сетка ссылок 1…22 (используется и калькулятором в задаче 7)
  - маршрут `/matrica-sudby/arkan-N-slug` (22 статические страницы, остальные — 404)

## Зачем

Спецификация 2а, разделы 3–4, 6. Справочник арканов — вход из поиска: страница по запросу «аркан 11 сила значение» объясняет аркан и ведёт в калькулятор. Страницы статические (собираются при сборке), индексируются, у каждой свой title, description, canonical и разметка `Article`.

## Шаги

- [ ] **Step 1: Падающие тесты путей и разметки**

`apps/web/src/lib/arcana-paths.test.ts`:

```ts
import { ARCANA } from "@oracle/content";
import { describe, expect, test } from "vitest";
import { arcanumFromParam, arcanumJsonLd, arcanumParam, arcanumPath, MATRIX_PATH } from "./arcana-paths";

const sila = { number: 11, slug: "sila" };

describe("arcanum paths", () => {
  test("build the page address from the number and slug", () => {
    expect(MATRIX_PATH).toBe("/matrica-sudby");
    expect(arcanumParam(sila)).toBe("arkan-11-sila");
    expect(arcanumPath(sila)).toBe("/matrica-sudby/arkan-11-sila");
  });

  test("resolve every published arcanum from its own parameter", () => {
    for (const arcanum of ARCANA) {
      expect(arcanumFromParam(arcanumParam(arcanum))).toBe(arcanum);
    }
  });

  test.each(["arkan-11-mag", "arkan-23-sila", "arkan-11", "sila", "arkan-011-sila", "arkan-11-sila-x"])("reject %s", (param) => {
    expect(arcanumFromParam(param)).toBeNull();
  });
});

describe("arcanumJsonLd", () => {
  test("describes the page as an Article in Russian", () => {
    const arcanum = ARCANA.find((item) => item.number === 11)!;
    const ld = arcanumJsonLd(arcanum, "https://oracle.test");

    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Аркан 11 «Сила» в матрице судьбы",
      inLanguage: "ru",
      mainEntityOfPage: "https://oracle.test/matrica-sudby/arkan-11-sila",
    });
    expect(String(ld.description).length).toBeLessThanOrEqual(160);
  });
});
```

В `apps/web/src/lib/seo.test.ts` в `describe("paths", …)` добавить:

```ts
  test("the matrix calculator and the 22 arcana pages are public", () => {
    expect(PUBLIC_PATHS).toContain("/matrica-sudby");
    expect(PUBLIC_PATHS).toContain("/matrica-sudby/arkan-11-sila");
    expect(PUBLIC_PATHS.filter((path) => path.startsWith("/matrica-sudby/arkan-"))).toHaveLength(22);
  });
```

Run: `pnpm vitest run --project web apps/web/src/lib/arcana-paths.test.ts apps/web/src/lib/seo.test.ts` — Expected: FAIL.

- [ ] **Step 2: Пути, разметка, публичные адреса**

`apps/web/src/lib/arcana-paths.ts`:

```ts
import { ARCANA, type Arcanum } from "@oracle/content";

export const MATRIX_PATH = "/matrica-sudby";
const PARAM = /^arkan-([1-9]|1\d|2[0-2])-([a-z]+(?:-[a-z]+)*)$/;
const DESCRIPTION_LIMIT = 160;

type ArcanumRef = { number: number; slug: string };

export const arcanumParam = (a: ArcanumRef): string => `arkan-${a.number}-${a.slug}`;
export const arcanumPath = (a: ArcanumRef): string => `${MATRIX_PATH}/${arcanumParam(a)}`;

// Номер и slug должны совпасть с одним и тем же арканом — иначе 404, а не страница с чужим текстом
export function arcanumFromParam(param: string): Arcanum | null {
  const match = PARAM.exec(param);
  if (!match) return null;
  const arcanum = ARCANA.find((item) => item.number === Number(match[1]));
  return arcanum && arcanum.slug === match[2] ? arcanum : null;
}

export function shortDescription(text: string): string {
  if (text.length <= DESCRIPTION_LIMIT) return text;
  const cut = text.slice(0, DESCRIPTION_LIMIT - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function arcanumJsonLd(a: Arcanum, siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Аркан ${a.number} «${a.name}» в матрице судьбы`,
    description: shortDescription(a.essence[0] ?? a.name),
    inLanguage: "ru",
    keywords: a.keywords.join(", "),
    mainEntityOfPage: `${siteUrl}${arcanumPath(a)}`,
  };
}
```

`apps/web/src/lib/seo.ts` — добавить импорт и заменить `PUBLIC_PATHS`:

```ts
import { ARCANA } from "@oracle/content";
import { arcanumPath, MATRIX_PATH } from "./arcana-paths";
```

```ts
// Практики и их справочники; следующие планы добавят свои
export const PUBLIC_PATHS: string[] = ["/", MATRIX_PATH, ...ARCANA.map(arcanumPath), ...DOCUMENT_PATHS];
```

Run: тесты Step 1 — Expected: PASS. (Тест «public and private paths never overlap» тоже должен пройти.)

- [ ] **Step 3: Общие компоненты**

`apps/web/src/components/CalculatorLink.tsx`:

```tsx
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { reachGoal } from "@/lib/analytics";
import { MATRIX_PATH } from "@/lib/arcana-paths";

export function CalculatorLink({ className = "button", children }: { className?: string; children: ReactNode }) {
  return (
    <Link className={className} href={MATRIX_PATH} onClick={() => reachGoal("arcana_to_calculator")}>
      {children}
    </Link>
  );
}
```

`apps/web/src/components/ArcanaIndex.tsx`:

```tsx
import { ARCANA } from "@oracle/content";
import Link from "next/link";
import { arcanumPath } from "@/lib/arcana-paths";

export function ArcanaIndex({ current }: { current?: number }) {
  return (
    <nav className="stack" aria-labelledby="arcana-index">
      <h2 id="arcana-index">Все 22 аркана</h2>
      <ul className="arcana-index">
        {ARCANA.map((arcanum) => (
          <li key={arcanum.number}>
            <Link href={arcanumPath(arcanum)} aria-current={arcanum.number === current ? "page" : undefined}>
              <span className="arcana-index__number">{arcanum.number}</span> {arcanum.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: Страница аркана**

`apps/web/src/app/matrica-sudby/[arkan]/page.tsx`:

```tsx
import { ARCANA, arcanumByNumber, SECTION_TITLES } from "@oracle/content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArcanaIndex } from "@/components/ArcanaIndex";
import { CalculatorLink } from "@/components/CalculatorLink";
import { arcanumFromParam, arcanumJsonLd, arcanumParam, arcanumPath, MATRIX_PATH, shortDescription } from "@/lib/arcana-paths";
import { publicMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ arkan: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ARCANA.map((arcanum) => ({ arkan: arcanumParam(arcanum) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const arcanum = arcanumFromParam((await params).arkan);
  if (!arcanum) return {};
  return publicMetadata({
    title: `Аркан ${arcanum.number} ${arcanum.name} в матрице судьбы — значение`,
    description: shortDescription(arcanum.essence[0] ?? arcanum.name),
    path: arcanumPath(arcanum),
  });
}

const neighbour = (number: number) => arcanumByNumber(((number - 1 + ARCANA.length) % ARCANA.length) + 1);

export default async function ArcanumPage({ params }: Params) {
  const arcanum = arcanumFromParam((await params).arkan);
  if (!arcanum) notFound();
  const previous = neighbour(arcanum.number - 1);
  const next = neighbour(arcanum.number + 1);
  const jsonLd = JSON.stringify(arcanumJsonLd(arcanum, SITE_URL)).replace(/</g, "\\u003c");

  return (
    <main className="page page--wide stack arcanum-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Навигация" className="muted">
        <Link href={MATRIX_PATH}>Матрица судьбы</Link> › Аркан {arcanum.number}
      </nav>

      <header className="arcanum-hero">
        <span className="arcanum-hero__number" aria-hidden="true">
          {arcanum.number}
        </span>
        <div className="stack">
          <p className="eyebrow eyebrow--line">Аркан {arcanum.number}</p>
          <h1 className="display">{arcanum.name}</h1>
          <ul className="row arcanum-hero__keywords" aria-label="Ключевые слова">
            {arcanum.keywords.map((keyword) => (
              <li key={keyword} className="tag">
                {keyword}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="arcanum-grid">
        <section className="stack" aria-labelledby="essence">
          <h2 id="essence">{SECTION_TITLES.essence}</h2>
          {arcanum.essence.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
        <aside className="card card--accent stack">
          <h2>Рассчитать свою матрицу</h2>
          <p className="muted">Узнайте, где этот аркан стоит в вашей дате рождения.</p>
          <p>
            <CalculatorLink>Рассчитать свою матрицу</CalculatorLink>
          </p>
        </aside>
      </div>

      <section className="arcanum-positions" aria-label="Аркан в позициях матрицы">
        {(["personality", "center", "task"] as const).map((key) => (
          <article key={key} className="card stack">
            <h2>{SECTION_TITLES[key]}</h2>
            {arcanum[key].map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </section>

      <section className="arcanum-poles" aria-label="Ресурс и перекос">
        {(["resource", "distortion"] as const).map((key) => (
          <div key={key} className="card stack">
            <h2>{SECTION_TITLES[key]}</h2>
            <ul>
              {arcanum[key].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="arcanum-poles" aria-label="Практика">
        <div className="card stack">
          <h2>{SECTION_TITLES.action}</h2>
          <p>{arcanum.action}</p>
        </div>
        <div className="card stack">
          <h2>{SECTION_TITLES.question}</h2>
          <p className="arcanum-question">{arcanum.question}</p>
        </div>
      </section>

      <p>
        <CalculatorLink>Рассчитать свою матрицу</CalculatorLink>
      </p>

      <nav className="row arcanum-neighbours" aria-label="Соседние арканы">
        <Link className="button button--ghost" href={arcanumPath(previous)}>
          ← {previous.number} · {previous.name}
        </Link>
        <Link className="button button--ghost" href={arcanumPath(next)}>
          {next.number} · {next.name} →
        </Link>
      </nav>

      <ArcanaIndex current={arcanum.number} />
    </main>
  );
}
```

- [ ] **Step 5: Стили**

В `apps/web/src/app/globals.css` перед комментарием `/* Карточки практик` добавить:

```css
/* Страница аркана: крупный номер, секции карточками, соседи и сетка всех арканов */
.arcanum-hero { display: grid; gap: 20px; align-items: center; }
.arcanum-hero__number { font-family: var(--font-display); font-weight: 300; font-size: clamp(96px, 18vw, 180px); line-height: 0.9; color: var(--accent); }
.arcanum-hero__keywords { list-style: none; margin: 0; padding: 0; }
.arcanum-grid { display: grid; gap: 20px; align-items: start; }
.arcanum-positions, .arcanum-poles { display: grid; gap: 16px; }
.arcanum-positions h2, .arcanum-poles h2 { font-size: 24px; }
.arcanum-question { font-family: var(--font-display); font-size: 22px; line-height: 1.35; }
.arcanum-neighbours { justify-content: space-between; }
.arcana-index { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; list-style: none; margin: 0; padding: 0; }
.arcana-index a { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 6px 12px; border: 1px solid var(--line); border-radius: var(--radius); color: var(--ink-soft); text-decoration: none; }
.arcana-index a:hover, .arcana-index a[aria-current="page"] { border-color: var(--line-strong); color: var(--ink); }
.arcana-index__number { min-width: 24px; font-family: var(--font-display); color: var(--accent); }
@media (min-width: 760px) {
  .arcanum-hero { grid-template-columns: auto 1fr; gap: 40px; }
  .arcanum-grid { grid-template-columns: 1.4fr 1fr; }
  .arcanum-positions { grid-template-columns: repeat(3, 1fr); }
  .arcanum-poles { grid-template-columns: 1fr 1fr; }
}
```

- [ ] **Step 6: Проверки**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

Run (сборка со статикой): `NEXT_PUBLIC_SITE_URL=https://tvoy-orakul.ru pnpm --filter @oracle/web build`
Expected: в выводе `● /matrica-sudby/[arkan]` с 22 путями (SSG), без ошибок.

Локально (`pnpm dev:web`): `/matrica-sudby/arkan-11-sila` — 200, `<meta name="robots" content="index, follow">`, canonical, JSON-LD; `/matrica-sudby/arkan-11-mag` и `/matrica-sudby/arkan-23-x` — 404; `/sitemap.xml` содержит 22 адреса арканов. На 375 px — без горизонтальной прокрутки.

- [ ] **Step 7: Коммит**

```bash
git add apps/web/src/lib/arcana-paths.ts apps/web/src/lib/arcana-paths.test.ts apps/web/src/lib/seo.ts apps/web/src/lib/seo.test.ts apps/web/src/components/CalculatorLink.tsx apps/web/src/components/ArcanaIndex.tsx "apps/web/src/app/matrica-sudby/[arkan]" apps/web/src/app/globals.css
git commit -m "feat(web): 22 static arcana pages with Article markup and sitemap entries"
```
