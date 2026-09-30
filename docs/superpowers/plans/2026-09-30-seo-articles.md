# SEO-статьи и автописатель — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в `/blog` статьи в формате Markdown с контент-планом, тестами целостности, защитой CI и IndexNow, чтобы по расписанию их мог публиковать автописатель без ручной вычитки.

**Architecture:** Markdown-файлы `packages/content/articles/*.md` собираются `pnpm content:build` в `generated/articles.json`, разбираются в `packages/content` (шапка, безопасное подмножество Markdown, проверки), а `apps/web/src/lib/blog.ts` объединяет их с четырьмя ручными статьями. Все гарантии качества — тесты и проверка CI, а не вычитка.

**Tech Stack:** TypeScript 6, Vitest 5, Next.js 16 (App Router), pnpm, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-30-seo-articles-design.md`

## Global Constraints

- Весь пользовательский текст и сообщения об ошибках — на русском; идентификаторы и имена файлов — латиницей.
- Обращение к читателю только «вы»; без предсказаний, диагнозов, «кармы», запугивания; язык гипотез.
- Внешних ссылок в статьях нет; внешних библиотек Markdown нет; внешние CDN и скрипты не подключать.
- Автописатель меняет только `packages/content/articles/*.md`, `packages/content/src/content-plan.ts`, `packages/content/src/generated/articles.json`.
- Файлы до 800 строк, функции до 50 строк, без мутации входных данных; покрытие тестами ≥ 80 % (порог в `vitest.config.ts`).
- Четыре существующие статьи блога (компоненты) и их адреса не меняются.
- Коммиты в формате `feat|fix|test|docs|ci|chore: описание`, без trailer'а Co-Authored-By.
- Работа только в `C:\dev\oracle-articles` (ветка `feat/seo-articles`); `C:\dev\oracle` не трогать.
- Запуск тестов из корня: `pnpm vitest run <путь>`; `pnpm typecheck`; `pnpm test`.

---

## Структура файлов

| Файл | Ответственность |
|---|---|
| `packages/content/src/article-basis.ts` (new) | Ключи «на чём основана статья» → название и файлы-источники |
| `packages/content/src/articles.ts` (new) | Тип `Article`, разбор шапки, `parseArticle` |
| `packages/content/src/articles-data.ts` (new) | Загрузка `generated/articles.json`: `ARTICLES`, `articleBySlug`; точка входа `@oracle/content/articles` |
| `packages/content/src/article-markdown.ts` (new) | Безопасное подмножество Markdown → блоки |
| `packages/content/src/article-check.ts` (new) | `checkArticle` — все проверки качества |
| `packages/content/src/article-fixture.ts` (new) | Образец статьи для тестов |
| `packages/content/src/content-plan.ts` (new) | `CONTENT_PLAN`: 13 тем |
| `packages/content/scripts/build-arcana.mjs` (+ `.d.mts`) | `collectArticles` |
| `packages/content/articles/` (new dir) | Markdown-статьи |
| `apps/web/src/lib/blog.ts` | Объединение ручных и Markdown-статей, FAQ JSON-LD |
| `apps/web/src/components/blog/ArticleBody.tsx` (new) | Отрисовка блоков, FAQ, «На чём основана» |
| `apps/web/src/app/blog/[slug]/page.tsx` | Выбор между компонентом и Markdown-статьёй |
| `apps/web/src/lib/articles-integrity.test.ts` (new) | Тесты целостности: ссылки, картинки, план ↔ статьи |
| `.github/workflows/ci.yml` | Проверка объёма изменений для веток `article/*` |
| `.github/workflows/deploy.yml`, `apps/web/public/indexnow.txt` | IndexNow |
| `docs/oracle-article-writer.md` (new), `AGENTS.md` | Инструкция автописателя и строка в таблице |

---

### Task 1: Разбор статьи и сборка контента

**Files:**
- Create: `packages/content/src/article-basis.ts`, `packages/content/src/articles.ts`, `packages/content/src/articles-data.ts`, `packages/content/src/article-fixture.ts`, `packages/content/src/articles.test.ts`, `packages/content/src/articles-data.test.ts`, `packages/content/articles/.gitkeep`, `packages/content/src/generated/articles.json` (`{}`)
- Modify: `packages/content/scripts/build-arcana.mjs`, `packages/content/scripts/build-arcana.d.mts`, `packages/content/package.json`

**Interfaces:**
- Produces: `ARTICLE_BASIS`, `ArticleBasisKey`, `isBasisKey(key: string): key is ArticleBasisKey`; `Article`, `ArticleFaq`, `ArticleFormatError`, `parseArticle(name: string, raw: string): Article`; `ARTICLES: readonly Article[]`, `articleBySlug(slug: string): Article | undefined`; `collectArticles(dir: string): Record<string, string>`; test helpers `articleSource(overrides?, body?)`, `sampleArticle(overrides?, body?)`, `DEFAULT_BODY`, `section(title, repeat?)`.

- [ ] **Step 1: Установить зависимости в копии**

Run: `cd /c/dev/oracle-articles && pnpm install --frozen-lockfile`
Expected: установка завершается без ошибок.

- [ ] **Step 2: Написать образец для тестов** `packages/content/src/article-fixture.ts`

```ts
import { parseArticle, type Article } from "./articles";

const BASE_HEADER: Readonly<Record<string, string>> = {
  title: "Предназначение в матрице судьбы",
  metaTitle: "Предназначение в матрице судьбы — личное, социальное, духовное",
  description: "Что такое личное, социальное и духовное предназначение в матрице судьбы и как читать их как направления, а не как задания.",
  date: "2026-10-02",
  image: "/hero.webp",
  imageAlt: "Матрица судьбы — символическая схема по дате рождения",
  cluster: "matrix",
  basis: "positions; matrix-formulas",
  faq: "Что такое предназначение? => Направление, в котором жизнь может ощущаться осмысленной. || Это задание извне? => Нет, это гипотеза для размышления. || Где оно в матрице? => Оно собирается из основных точек.",
};

const SENTENCE = "Позиция матрицы описывает одну из сторон характера, и её значение можно читать как гипотезу для размышления, а не как приговор. ";

export const section = (title: string, repeat = 14): string => `## ${title}\n\n${SENTENCE.repeat(repeat).trim()}`;

export const DEFAULT_BODY = [
  "Предназначение в матрице судьбы — это три направления, в которых жизнь может ощущаться осмысленной. Вы можете [рассчитать свою матрицу](/matrica-sudby) и посмотреть на них самостоятельно.",
  section("Личное предназначение"),
  `${section("Социальное предназначение")}\n\nЧасто это связывают с [арканом Маг](/matrica-sudby/arkan-1-mag).`,
  section("Духовное предназначение"),
].join("\n\n");

// null убирает поле из шапки
export function articleSource(overrides: Readonly<Record<string, string | null>> = {}, body: string = DEFAULT_BODY): string {
  const header = { ...BASE_HEADER, ...overrides };
  const lines = Object.entries(header)
    .filter((entry): entry is [string, string] => entry[1] !== null)
    .map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

export const sampleArticle = (overrides: Readonly<Record<string, string | null>> = {}, body: string = DEFAULT_BODY): Article =>
  parseArticle("prednaznachenie-v-matritse-sudby", articleSource(overrides, body));
```

- [ ] **Step 3: Написать падающие тесты** `packages/content/src/articles.test.ts`

```ts
import { describe, expect, test } from "vitest";
import { ARTICLE_BASIS, isBasisKey } from "./article-basis";
import { articleSource, sampleArticle } from "./article-fixture";
import { ArticleFormatError, parseArticle } from "./articles";

describe("parseArticle", () => {
  test("reads the header, faq and body of a well-formed article", () => {
    const article = sampleArticle();
    expect(article.slug).toBe("prednaznachenie-v-matritse-sudby");
    expect(article.title).toBe("Предназначение в матрице судьбы");
    expect(article.date).toBe("2026-10-02");
    expect(article.basis).toEqual(["positions", "matrix-formulas"]);
    expect(article.faq).toHaveLength(3);
    expect(article.faq[0]).toEqual({ question: "Что такое предназначение?", answer: "Направление, в котором жизнь может ощущаться осмысленной." });
    expect(article.body.startsWith("Предназначение в матрице судьбы")).toBe(true);
  });

  test.each([
    ["нет шапки", "просто текст", /шапк/],
    ["нет обязательного поля", articleSource({ cluster: null }), /cluster/],
    ["неизвестное поле", articleSource({ author: "Иван" }), /author/],
    ["плохая дата", articleSource({ date: "2026-02-31" }), /date/],
    ["картинка не webp", articleSource({ image: "/hero.png" }), /image/],
    ["неизвестный ключ основания", articleSource({ basis: "positions; wikipedia" }), /wikipedia/],
    ["пустое основание", articleSource({ basis: "" }), /basis/],
    ["мало вопросов", articleSource({ faq: "Один? => Ответ." }), /faq/],
    ["вопрос без знака", articleSource({ faq: "А => Б. || В? => Г. || Д? => Е." }), /вопрос/],
  ])("rejects %s", (_name, source, message) => {
    expect(() => parseArticle("prednaznachenie-v-matritse-sudby", source)).toThrow(ArticleFormatError);
    expect(() => parseArticle("prednaznachenie-v-matritse-sudby", source)).toThrow(message);
  });

  test("rejects a slug that is not latin lowercase with hyphens", () => {
    expect(() => parseArticle("Bad_Slug", articleSource())).toThrow(/slug/);
  });
});

describe("article basis", () => {
  test("has a label and at least one source file for every key", () => {
    for (const [key, entry] of Object.entries(ARTICLE_BASIS)) {
      expect(isBasisKey(key)).toBe(true);
      expect(entry.label.length).toBeGreaterThan(5);
      expect(entry.files.length).toBeGreaterThan(0);
    }
    expect(isBasisKey("wikipedia")).toBe(false);
  });
});
```

- [ ] **Step 4: Запустить и убедиться, что падает**

Run: `pnpm vitest run packages/content/src/articles.test.ts`
Expected: FAIL — модули `./article-basis` и `./articles` не найдены.

- [ ] **Step 5: Реализовать** `packages/content/src/article-basis.ts`

```ts
// Материалы, по которым автописатель вправе писать. Название показывается читателю, файлы проверяются тестом
export const ARTICLE_BASIS = {
  arcana: { label: "Тексты арканов «Твоего оракула»", files: ["packages/content/arcana"] },
  positions: { label: "Описания позиций матрицы судьбы", files: ["packages/content/positions.md"] },
  "matrix-formulas": { label: "Формулы расчёта матрицы судьбы", files: ["packages/core/src/matrix.ts"] },
  "compat-texts": { label: "Тексты раздела «Совместимость»", files: ["packages/content/compat-arcana.md"] },
  "compat-formulas": { label: "Формулы расчёта совместимости", files: ["packages/core/src/compatibility.ts"] },
  "lila-cells": { label: "Тексты клеток Лилы", files: ["packages/content/lila-cells.md"] },
  "lila-rules": { label: "Правила и логика игры Лила", files: ["packages/core/src/lila.ts"] },
  "lila-guide": { label: "Как работает проводник в Лиле", files: ["packages/ai/src/lila-validate.ts", "packages/ai/src/lila-fallback.ts"] },
} as const;

export type ArticleBasisKey = keyof typeof ARTICLE_BASIS;

export const isBasisKey = (key: string): key is ArticleBasisKey => Object.hasOwn(ARTICLE_BASIS, key);
```

`packages/content/src/articles.ts`:

```ts
import { isBasisKey, type ArticleBasisKey } from "./article-basis";

export type ArticleFaq = { readonly question: string; readonly answer: string };

export type Article = {
  readonly slug: string;
  readonly title: string;
  readonly metaTitle: string;
  readonly description: string;
  readonly date: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly cluster: string;
  readonly basis: readonly ArticleBasisKey[];
  readonly faq: readonly ArticleFaq[];
  readonly body: string;
};

export class ArticleFormatError extends Error {}

export const FAQ_MIN = 3;
export const FAQ_MAX = 5;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FIELDS = ["title", "metaTitle", "description", "date", "image", "imageAlt", "cluster", "basis", "faq"] as const;

function readFields(header: string, fail: (message: string) => never): Map<string, string> {
  const fields = new Map<string, string>();
  for (const line of header.split("\n").filter((row) => row.trim())) {
    const colon = line.indexOf(":");
    if (colon < 1) fail(`строка шапки без «ключ: значение»: ${line}`);
    const key = line.slice(0, colon).trim();
    if (!(FIELDS as readonly string[]).includes(key)) fail(`неизвестное поле шапки ${key}`);
    if (fields.has(key)) fail(`поле ${key} повторено`);
    fields.set(key, line.slice(colon + 1).trim());
  }
  for (const key of FIELDS) if (!fields.get(key)) fail(`нет поля ${key}`);
  return fields;
}

function readFaq(value: string, fail: (message: string) => never): ArticleFaq[] {
  const items = value.split("||").map((pair) => {
    const [question = "", ...rest] = pair.split("=>");
    return { question: question.trim(), answer: rest.join("=>").trim() };
  });
  if (items.length < FAQ_MIN || items.length > FAQ_MAX) fail(`faq — от ${FAQ_MIN} до ${FAQ_MAX} пар «Вопрос? => Ответ.» через ||`);
  for (const item of items) {
    if (!item.question.endsWith("?")) fail(`вопрос faq должен заканчиваться «?»: ${item.question}`);
    if (!item.answer) fail(`нет ответа на вопрос ${item.question}`);
  }
  return items;
}

export function parseArticle(name: string, raw: string): Article {
  const fail = (message: string): never => {
    throw new ArticleFormatError(`${name}.md: ${message}`);
  };
  if (!SLUG.test(name)) fail("slug — латиница в нижнем регистре и цифры через дефис");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw.replace(/\r\n/g, "\n").trim());
  if (!match) return fail("нет шапки между строками ---");
  const fields = readFields(match[1] ?? "", fail);
  const value = (key: (typeof FIELDS)[number]): string => fields.get(key) ?? "";

  const date = value("date");
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!DATE.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) fail("date — существующая дата в формате ГГГГ-ММ-ДД");
  const image = value("image");
  if (!image.startsWith("/") || !image.endsWith(".webp")) fail("image — путь от корня сайта к файлу .webp");
  const keys = value("basis").split(";").map((key) => key.trim()).filter(Boolean);
  if (keys.length === 0) fail("basis — хотя бы один ключ основания через «; »");
  for (const key of keys) if (!isBasisKey(key)) fail(`basis: неизвестный ключ ${key}`);

  return {
    slug: name,
    title: value("title"),
    metaTitle: value("metaTitle"),
    description: value("description"),
    date,
    image,
    imageAlt: value("imageAlt"),
    cluster: value("cluster"),
    basis: keys.filter(isBasisKey),
    faq: readFaq(value("faq"), fail),
    body: (match[2] ?? "").trim(),
  };
}
```

- [ ] **Step 6: Запустить тесты — должны пройти**

Run: `pnpm vitest run packages/content/src/articles.test.ts`
Expected: PASS (все тесты).

- [ ] **Step 7: Сборка и загрузка данных. Написать падающий тест** `packages/content/src/articles-data.test.ts`

```ts
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { ARTICLE_BASIS } from "./article-basis";
import { ARTICLES, articleBySlug } from "./articles-data";
import raw from "./generated/articles.json";
import { collectArticles } from "../scripts/build-arcana.mjs";
import { existsSync } from "node:fs";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const ARTICLES_DIR = fileURLToPath(new URL("../articles", import.meta.url));

describe("published articles", () => {
  test("generated json is in sync with packages/content/articles (run pnpm content:build)", () => {
    expect(raw).toEqual(collectArticles(ARTICLES_DIR));
  });

  test("every article parses and can be found by slug", () => {
    for (const article of ARTICLES) expect(articleBySlug(article.slug)).toBe(article);
    expect(articleBySlug("net-takoj-stati")).toBeUndefined();
  });

  test("every basis key points to existing files", () => {
    for (const [key, entry] of Object.entries(ARTICLE_BASIS)) {
      for (const file of entry.files) expect(existsSync(join(ROOT, file)), `${key}: ${file}`).toBe(true);
    }
  });
});
```

Импорт `collectArticles` из `../scripts/build-arcana.mjs` типизируется через `build-arcana.d.mts`; если typecheck ругнётся на импорт, повторить способ, которым `build-arcana.mjs` импортируется в `packages/content/src/build.test.ts`.

Run: `pnpm vitest run packages/content/src/articles-data.test.ts`
Expected: FAIL — нет `articles-data` и `collectArticles`.

- [ ] **Step 8: Реализовать** `packages/content/src/articles-data.ts`

```ts
import { parseArticle, type Article } from "./articles";
import raw from "./generated/articles.json";

export { ARTICLE_BASIS, type ArticleBasisKey } from "./article-basis";
export type { Article, ArticleFaq } from "./articles";

const SOURCES = raw as Record<string, string>;

// Собранные тексты: pnpm content:build → src/generated/articles.json. Отдельная точка входа, чтобы клиентский бандл не тянул лишнее
export const ARTICLES: readonly Article[] = Object.keys(SOURCES)
  .sort()
  .map((name) => parseArticle(name, SOURCES[name] ?? ""));

export const articleBySlug = (slug: string): Article | undefined => ARTICLES.find((article) => article.slug === slug);
```

В `packages/content/scripts/build-arcana.mjs` добавить после `collectCompat`:

```js
// Статьи блога: одна запись на файл, имя файла без .md — slug
export function collectArticles(dir) {
  const sources = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".md")).sort()) {
    sources[name.replace(/\.md$/, "")] = readText(join(dir, name));
  }
  return sources;
}
```

и в блок `if (import.meta.main)` после строки с `compat.json`:

```js
  write(join(root, "src", "generated", "articles.json"), collectArticles(join(root, "articles")));
```

В `packages/content/scripts/build-arcana.d.mts` добавить строку:

```ts
export function collectArticles(dir: string): Record<string, string>;
```

В `packages/content/package.json` в `exports` добавить `"./articles": "./src/articles-data.ts"`:

```json
"exports": { ".": "./src/index.ts", "./lila": "./src/lila-cells.ts", "./compat": "./src/compat-unions.ts", "./articles": "./src/articles-data.ts" },
```

Создать пустой `packages/content/articles/.gitkeep`. Затем:

Run: `pnpm content:build && cat packages/content/src/generated/articles.json`
Expected: строка `written: …articles.json`, файл содержит `{}`.

- [ ] **Step 9: Запустить тесты и типы**

Run: `pnpm vitest run packages/content && pnpm typecheck`
Expected: PASS, typecheck без ошибок.

- [ ] **Step 10: Commit**

```bash
git add packages/content
git commit -m "feat(content): article format, parser and build step"
```

---

### Task 2: Безопасное подмножество Markdown

**Files:**
- Create: `packages/content/src/article-markdown.ts`, `packages/content/src/article-markdown.test.ts`
- Modify: `packages/content/src/articles-data.ts` (реэкспорт)

**Interfaces:**
- Produces: `type Inline = {type:"text";text:string} | {type:"strong";text:string} | {type:"link";text:string;href:string}`; `type Block = {type:"h2";text:string} | {type:"p";inlines:Inline[]} | {type:"ul";items:Inline[][]}`; `ArticleMarkdownError`; `parseMarkdown(body: string): Block[]`; `plainText(blocks: readonly Block[]): string`; `linksOf(blocks: readonly Block[]): string[]`.

- [ ] **Step 1: Написать падающие тесты** `packages/content/src/article-markdown.test.ts`

```ts
import { describe, expect, test } from "vitest";
import { ArticleMarkdownError, linksOf, parseMarkdown, plainText } from "./article-markdown";

describe("parseMarkdown", () => {
  test("reads headings, paragraphs, bullet lists, bold and internal links", () => {
    const blocks = parseMarkdown("Вступление про **главное**.\n\n## Раздел\n\n- один\n- два с [калькулятором](/matrica-sudby)\n\nАбзац\nв две строки.");
    expect(blocks).toEqual([
      { type: "p", inlines: [{ type: "text", text: "Вступление про " }, { type: "strong", text: "главное" }, { type: "text", text: "." }] },
      { type: "h2", text: "Раздел" },
      { type: "ul", items: [[{ type: "text", text: "один" }], [{ type: "text", text: "два с " }, { type: "link", text: "калькулятором", href: "/matrica-sudby" }]] },
      { type: "p", inlines: [{ type: "text", text: "Абзац в две строки." }] },
    ]);
  });

  test("plainText drops markup and linksOf lists every internal link", () => {
    const blocks = parseMarkdown("Про [Лилу](/lila) и **суть**.\n\n## Заголовок\n\n- пункт [клетка](/lila/kletki/01-rozhdenie)");
    expect(plainText(blocks)).toBe("Про Лилу и суть.\nЗаголовок\nпункт клетка");
    expect(linksOf(blocks)).toEqual(["/lila", "/lila/kletki/01-rozhdenie"]);
  });

  test.each([
    ["заголовок третьего уровня", "### Мелко"],
    ["заголовок первого уровня", "# Крупно"],
    ["нумерованный список", "1. первый\n2. второй"],
    ["цитата", "> цитата"],
    ["таблица", "| a | b |\n| - | - |"],
    ["код", "```\nкод\n```"],
    ["картинка", "![alt](/hero.webp)"],
    ["внешняя ссылка", "[сайт](https://example.com)"],
    ["html", "Текст <b>жирный</b>"],
    ["курсив звёздочкой", "Слово *курсив* тут"],
    ["смешанный список", "- пункт\nобычная строка"],
  ])("rejects %s", (_name, source) => {
    expect(() => parseMarkdown(source)).toThrow(ArticleMarkdownError);
  });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `pnpm vitest run packages/content/src/article-markdown.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать** `packages/content/src/article-markdown.ts`

```ts
export type Inline =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "strong"; readonly text: string }
  | { readonly type: "link"; readonly text: string; readonly href: string };

export type Block =
  | { readonly type: "h2"; readonly text: string }
  | { readonly type: "p"; readonly inlines: readonly Inline[] }
  | { readonly type: "ul"; readonly items: readonly (readonly Inline[])[] };

export class ArticleMarkdownError extends Error {}

const INLINE = /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const INTERNAL_HREF = /^\/[a-z0-9\-/]*$/;
const LEFTOVER_MARKUP = /[*[\]<>`|]|\]\(/;
const UNSUPPORTED_LINE = /^(#|>|```|[-*+]\s|\d+\.\s|\|)/;

function assertPlain(text: string): string {
  if (LEFTOVER_MARKUP.test(text)) throw new ArticleMarkdownError(`неподдерживаемая разметка: ${text.slice(0, 60)}`);
  return text;
}

function parseInlines(text: string): Inline[] {
  const result: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    if (at > last) result.push({ type: "text", text: assertPlain(text.slice(last, at)) });
    if (match[1] !== undefined) {
      result.push({ type: "strong", text: match[1] });
    } else {
      const href = match[3] ?? "";
      if (!INTERNAL_HREF.test(href)) throw new ArticleMarkdownError(`ссылка должна быть внутренней (начинаться с «/»): ${href}`);
      result.push({ type: "link", text: match[2] ?? "", href });
    }
    last = at + match[0].length;
  }
  if (last < text.length) result.push({ type: "text", text: assertPlain(text.slice(last)) });
  return result;
}

function parseBlock(chunk: string): Block {
  const lines = chunk.split("\n");
  if (chunk.startsWith("## ")) {
    if (lines.length !== 1) throw new ArticleMarkdownError(`заголовок должен быть в одной строке: ${chunk.slice(0, 60)}`);
    return { type: "h2", text: assertPlain(chunk.slice(3).trim()) };
  }
  if (lines.every((line) => line.startsWith("- "))) return { type: "ul", items: lines.map((line) => parseInlines(line.slice(2).trim())) };
  if (lines.some((line) => UNSUPPORTED_LINE.test(line))) throw new ArticleMarkdownError(`неподдерживаемый блок: ${chunk.slice(0, 60)}`);
  return { type: "p", inlines: parseInlines(lines.map((line) => line.trim()).join(" ")) };
}

export function parseMarkdown(body: string): Block[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(parseBlock);
}

const inlineText = (inlines: readonly Inline[]): string => inlines.map((inline) => inline.text).join("");

export function plainText(blocks: readonly Block[]): string {
  return blocks
    .flatMap((block) => (block.type === "h2" ? [block.text] : block.type === "p" ? [inlineText(block.inlines)] : block.items.map(inlineText)))
    .join("\n");
}

export function linksOf(blocks: readonly Block[]): string[] {
  const inlines = blocks.flatMap((block) => (block.type === "p" ? [block.inlines] : block.type === "ul" ? block.items : []));
  return inlines.flat().flatMap((inline) => (inline.type === "link" ? [inline.href] : []));
}
```

В `packages/content/src/articles-data.ts` добавить строку реэкспорта:

```ts
export { ArticleMarkdownError, linksOf, parseMarkdown, plainText, type Block, type Inline } from "./article-markdown";
```

- [ ] **Step 4: Запустить тесты**

Run: `pnpm vitest run packages/content/src/article-markdown.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/content
git commit -m "feat(content): safe markdown subset for articles"
```

---

### Task 3: Проверки качества статьи

**Files:**
- Create: `packages/content/src/article-check.ts`, `packages/content/src/article-check.test.ts`
- Modify: `packages/content/src/articles-data.ts` (реэкспорт)

**Interfaces:**
- Consumes: `Article`, `parseMarkdown`, `plainText`, `linksOf`, `ArticleMarkdownError`, `findStopPhrases` (из `./check`), `ARCANA_COUNT`, `LILA_CELL_COUNT` (из `@oracle/core`), `sampleArticle`, `section`, `DEFAULT_BODY`.
- Produces: `ArticleCheckContext = { publicPaths: readonly string[]; arcanumName(number: number): string | undefined; cellName(number: number): string | undefined; today: string }`; `checkArticle(article: Article, context: ArticleCheckContext): string[]` (пустой массив — статья прошла); `TOOL_PATHS`, `BODY_MIN`, `BODY_MAX`.

- [ ] **Step 1: Написать падающие тесты** `packages/content/src/article-check.test.ts`

```ts
import { describe, expect, test } from "vitest";
import { checkArticle, type ArticleCheckContext } from "./article-check";
import { DEFAULT_BODY, sampleArticle, section } from "./article-fixture";

const context: ArticleCheckContext = {
  publicPaths: ["/", "/matrica-sudby", "/matrica-sudby/arkan-1-mag", "/sovmestimost", "/lila"],
  arcanumName: (number) => ({ 1: "Маг", 22: "Шут" })[number],
  cellName: (number) => ({ 1: "Рождение" })[number],
  today: "2026-10-05",
};

const withBody = (extra: string) => sampleArticle({}, `${DEFAULT_BODY}\n\n${extra}`);
const errorsOf = (article = sampleArticle()) => checkArticle(article, context).join("\n");

describe("checkArticle", () => {
  test("passes a well-formed article", () => {
    expect(checkArticle(sampleArticle(), context)).toEqual([]);
  });

  test("checks length, headings and the snippet fields", () => {
    expect(errorsOf(sampleArticle({}, `Коротко. [Калькулятор](/matrica-sudby)\n\n${section("А", 1)}`))).toMatch(/объём/);
    expect(errorsOf(sampleArticle({}, `Вступление [калькулятор](/matrica-sudby) и [аркан](/matrica-sudby/arkan-1-mag).\n\n${section("Один", 40)}`))).toMatch(/разделов/);
    expect(errorsOf(sampleArticle({ description: "Слишком коротко." }))).toMatch(/description/);
    expect(errorsOf(sampleArticle({ metaTitle: "Очень ".repeat(20) }))).toMatch(/metaTitle/);
  });

  test("rejects an introduction that announces the article", () => {
    const body = DEFAULT_BODY.replace("Предназначение в матрице судьбы —", "В этой статье мы разберём, что такое");
    expect(errorsOf(sampleArticle({}, body))).toMatch(/первый абзац/);
  });

  test("rejects stop phrases, karma and unqualified predictions", () => {
    expect(errorsOf(withBody("Вас ждёт удача."))).toMatch(/стоп/);
    expect(errorsOf(withBody("Это кармическая задача."))).toMatch(/карм/);
    expect(errorsOf(withBody("Это предсказание судьбы."))).toMatch(/предсказан/);
    expect(errorsOf(withBody("Это не предсказание, а инструмент. Здесь без предсказаний, а не предсказание."))).toBe("");
  });

  test("keeps the tone: only «вы», no gendered verbs after «вы»", () => {
    expect(errorsOf(withBody("Если ты хочешь разобраться."))).toMatch(/«вы»/);
    expect(errorsOf(withBody("Сайт «Твой оракул» помогает."))).toBe("");
    expect(errorsOf(withBody("Вы сделала первый шаг."))).toMatch(/род/);
    expect(errorsOf(withBody("Вы сделали первый шаг."))).toBe("");
  });

  test("requires internal links that exist and at least one link to a practice", () => {
    expect(errorsOf(withBody("См. [страницу](/net-takoj-stranicy)."))).toMatch(/net-takoj-stranicy/);
    const noTool = DEFAULT_BODY.replace("[рассчитать свою матрицу](/matrica-sudby)", "рассчитать матрицу").replace("[арканом Маг](/matrica-sudby/arkan-1-mag)", "арканом Маг");
    expect(errorsOf(sampleArticle({}, noTool))).toMatch(/ссылк/);
  });

  test("reports unsupported markdown instead of throwing", () => {
    expect(errorsOf(withBody("### Мелкий заголовок"))).toMatch(/неподдерживаемый/);
  });

  test("checks arcanum and cell numbers and names against the real texts", () => {
    expect(errorsOf(withBody("Аркан 23 не существует."))).toMatch(/аркан 23/i);
    expect(errorsOf(withBody("Клетка 73 не существует."))).toMatch(/клетка 73/i);
    expect(errorsOf(withBody("Аркан 1 «Шут» — ошибка."))).toMatch(/Маг/);
    expect(errorsOf(withBody("Аркан 1 «Маг» и клетка 1 «Рождение»."))).toBe("");
  });

  test("rejects a date from the future", () => {
    expect(errorsOf(sampleArticle({ date: "2026-12-31" }))).toMatch(/будущ/);
  });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `pnpm vitest run packages/content/src/article-check.test.ts`
Expected: FAIL — модуль `./article-check` не найден.

- [ ] **Step 3: Реализовать** `packages/content/src/article-check.ts`

```ts
import { ARCANA_COUNT, LILA_CELL_COUNT } from "@oracle/core";
import { ArticleMarkdownError, linksOf, parseMarkdown, plainText, type Block } from "./article-markdown";
import type { Article } from "./articles";
import { findStopPhrases } from "./check";

export type ArticleCheckContext = {
  readonly publicPaths: readonly string[];
  arcanumName(number: number): string | undefined;
  cellName(number: number): string | undefined;
  // сегодняшняя дата ГГГГ-ММ-ДД; статья не может быть датирована будущим
  readonly today: string;
};

export const TOOL_PATHS: readonly string[] = ["/matrica-sudby", "/sovmestimost", "/lila"];
export const BODY_MIN = 4000;
export const BODY_MAX = 9000;
const SECTIONS_MIN = 3;
const DESCRIPTION_RANGE = [90, 175] as const;
const META_TITLE_MAX = 75;
const TITLE_MAX = 90;

const BRAND = /твой оракул|твоего оракула|твоему оракулу/giu;
const SECOND_PERSON = /(?<![\p{L}])(?:ты|тебе|тебя|тобой|твой|твоя|твоё|твое|твои|твоих|твоей|твоего|твоему|твоим)(?![\p{L}])/iu;
const AFTER_VY = /(?<![\p{L}])вы\s+(\p{L}+)/giu;
const SINGULAR_PAST = /^\p{L}{2,}(?:ал|ел|ил|ул|ыл|ял|ла|ло)$/u;
const PREDICTION = /предсказ[аы]/giu;
const NEGATED = /(?:^|[^\p{L}])(?:не|без|ни)\s+$/iu;
const KARMA = /карм/iu;
const OPENING = /^(?:в этой статье|в данной статье|сегодня мы|мы разберём)/iu;
const REFERENCE = /(аркан\p{L}*|клетк\p{L}*)\s+(\d+)(?:\s*«([^»]+)»)?/giu;

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, "е");

function lengthErrors(article: Article, blocks: readonly Block[]): string[] {
  const errors: string[] = [];
  const body = plainText(blocks).length;
  if (body < BODY_MIN || body > BODY_MAX) errors.push(`объём текста ${body} знаков, нужно от ${BODY_MIN} до ${BODY_MAX}`);
  const sections = blocks.filter((block) => block.type === "h2").length;
  if (sections < SECTIONS_MIN) errors.push(`разделов «##» ${sections}, нужно не меньше ${SECTIONS_MIN}`);
  if (article.title.length > TITLE_MAX) errors.push(`title длиннее ${TITLE_MAX} знаков`);
  if (article.metaTitle.length > META_TITLE_MAX) errors.push(`metaTitle длиннее ${META_TITLE_MAX} знаков`);
  const [min, max] = DESCRIPTION_RANGE;
  if (article.description.length < min || article.description.length > max) errors.push(`description ${article.description.length} знаков, нужно от ${min} до ${max}`);
  const first = blocks[0];
  if (first?.type !== "p" || OPENING.test(plainText([first]))) errors.push("первый абзац должен сразу отвечать на запрос, без вступления «в этой статье…»");
  return errors;
}

function toneErrors(text: string): string[] {
  const errors: string[] = [];
  const stops = findStopPhrases(text);
  if (stops.length > 0) errors.push(`стоп-фразы: ${stops.join(", ")}`);
  if (KARMA.test(text)) errors.push("слова с основой «карм» запрещены");
  for (const match of text.matchAll(PREDICTION)) {
    if (!NEGATED.test(text.slice(Math.max(0, (match.index ?? 0) - 10), match.index))) errors.push("«предсказание» допустимо только с отрицанием: «не предсказание», «без предсказаний»");
  }
  if (SECOND_PERSON.test(text.replace(BRAND, ""))) errors.push("обращение только на «вы»: найдено «ты/твой»");
  for (const match of text.matchAll(AFTER_VY)) {
    if (SINGULAR_PAST.test(match[1] ?? "")) errors.push(`нейтральный род: после «вы» стоит форма единственного числа «${match[1]}» (нужно «сделали», а не «сделала»)`);
  }
  return errors;
}

function linkErrors(blocks: readonly Block[], publicPaths: readonly string[]): string[] {
  const links = linksOf(blocks);
  const errors = [...new Set(links)].filter((href) => !publicPaths.includes(href)).map((href) => `ссылка ведёт на несуществующую страницу ${href}`);
  if (!links.some((href) => TOOL_PATHS.includes(href))) errors.push(`нужна ссылка на калькулятор или Лилу: ${TOOL_PATHS.join(", ")}`);
  if (new Set(links).size < 2) errors.push("нужно не меньше двух разных внутренних ссылок");
  return errors;
}

function referenceErrors(text: string, context: ArticleCheckContext): string[] {
  const errors: string[] = [];
  for (const match of text.matchAll(REFERENCE)) {
    const isArcanum = normalize(match[1] ?? "").startsWith("аркан");
    const number = Number(match[2]);
    const label = `${isArcanum ? "аркан" : "клетка"} ${number}`;
    const known = isArcanum ? number >= 1 && number <= ARCANA_COUNT : number >= 1 && number <= LILA_CELL_COUNT;
    const real = isArcanum ? context.arcanumName(number) : context.cellName(number);
    if (!known || real === undefined) errors.push(`${label} не существует`);
    else if (match[3] !== undefined && normalize(match[3]) !== normalize(real)) errors.push(`${label}: в тексте «${match[3]}», по нашим текстам «${real}»`);
  }
  return errors;
}

export function checkArticle(article: Article, context: ArticleCheckContext): string[] {
  let blocks: Block[];
  try {
    blocks = parseMarkdown(article.body);
  } catch (error) {
    if (error instanceof ArticleMarkdownError) return [`неподдерживаемый Markdown: ${error.message}`];
    throw error;
  }
  const text = [article.title, article.description, plainText(blocks), ...article.faq.flatMap((item) => [item.question, item.answer])].join("\n");
  return [
    ...lengthErrors(article, blocks),
    ...toneErrors(text),
    ...linkErrors(blocks, context.publicPaths),
    ...referenceErrors(text, context),
    ...(article.date > context.today ? [`дата ${article.date} в будущем`] : []),
  ];
}
```

В `packages/content/src/articles-data.ts` добавить реэкспорт: `export { checkArticle, TOOL_PATHS, type ArticleCheckContext } from "./article-check";`

- [ ] **Step 4: Запустить тесты**

Run: `pnpm vitest run packages/content/src/article-check.test.ts`
Expected: PASS. Если какой-то тест падает — исправить регулярное выражение или образец так, чтобы тест выражал правило из спецификации (не ослаблять правило). Особенно проверить, что `не предсказание` проходит, а голое `предсказание` — нет, и что `Вы сделали` проходит.

- [ ] **Step 5: Типы и коммит**

Run: `pnpm typecheck`
Expected: без ошибок.

```bash
git add packages/content
git commit -m "feat(content): quality checks for articles"
```

---

### Task 4: Контент-план

**Files:**
- Create: `packages/content/src/content-plan.ts`, `packages/content/src/content-plan.test.ts`
- Modify: `packages/content/src/articles-data.ts` (реэкспорт)

**Interfaces:**
- Produces: `PlanTopic = { slug; title; primaryQuery; cluster: "matrix"|"compat"|"lila"|"general"; image; imageAlt; basis: ArticleBasisKey[]; internalLinks: string[]; status: "draft"|"published" }`; `CONTENT_PLAN: readonly PlanTopic[]`; `nextDraftTopic(plan?: readonly PlanTopic[]): PlanTopic | undefined`.

- [ ] **Step 1: Написать падающий тест** `packages/content/src/content-plan.test.ts`

```ts
import { describe, expect, test } from "vitest";
import { isBasisKey } from "./article-basis";
import { CONTENT_PLAN, nextDraftTopic, type PlanTopic } from "./content-plan";

describe("content plan", () => {
  test("has unique latin slugs and well-formed topics", () => {
    expect(new Set(CONTENT_PLAN.map((topic) => topic.slug)).size).toBe(CONTENT_PLAN.length);
    for (const topic of CONTENT_PLAN) {
      expect(topic.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(topic.title.length).toBeLessThanOrEqual(90);
      expect(topic.primaryQuery.length).toBeGreaterThan(5);
      expect(topic.basis.length).toBeGreaterThan(0);
      expect(topic.basis.every(isBasisKey)).toBe(true);
      expect(topic.internalLinks.length).toBeGreaterThanOrEqual(2);
      expect(topic.internalLinks.every((link) => link.startsWith("/"))).toBe(true);
      expect(topic.image).toMatch(/\.webp$/);
    }
  });

  test("starts with the highest-demand topic", () => {
    expect(CONTENT_PLAN[0]?.slug).toBe("rasshifrovka-matritsy-sudby");
  });

  test("nextDraftTopic returns the first topic that is still a draft", () => {
    const plan: PlanTopic[] = CONTENT_PLAN.map((topic, index) => ({ ...topic, status: index < 2 ? "published" : "draft" }));
    expect(nextDraftTopic(plan)?.slug).toBe(CONTENT_PLAN[2]?.slug);
    expect(nextDraftTopic(plan.map((topic) => ({ ...topic, status: "published" as const })))).toBeUndefined();
  });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `pnpm vitest run packages/content/src/content-plan.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать** `packages/content/src/content-plan.ts`

```ts
import type { ArticleBasisKey } from "./article-basis";

export type PlanTopic = {
  readonly slug: string;
  readonly title: string;
  // запрос, на который первый абзац статьи отвечает сразу
  readonly primaryQuery: string;
  readonly cluster: "matrix" | "compat" | "lila" | "general";
  // картинка: /hero.webp, /arcana/NN-slug.webp или /lila/NN-slug.webp
  readonly image: string;
  readonly imageAlt: string;
  readonly basis: readonly ArticleBasisKey[];
  // ссылки, которые обязаны быть в тексте статьи
  readonly internalLinks: readonly string[];
  readonly status: "draft" | "published";
};

const HERO_ALT = "Матрица судьбы — символическая схема по дате рождения";

// Очередь по убыванию пользы; спрос — Яндекс Вордстат за 30.08–28.09.2026 (см. docs/superpowers/specs/2026-09-30-seo-articles-design.md).
// Тема получает status: "published" ровно тогда, когда выходит статья
export const CONTENT_PLAN: readonly PlanTopic[] = [
  {
    slug: "rasshifrovka-matritsy-sudby",
    title: "Расшифровка матрицы судьбы: как читать позиции",
    primaryQuery: "расшифровка матрицы судьбы",
    cluster: "matrix",
    image: "/hero.webp",
    imageAlt: HERO_ALT,
    basis: ["positions", "arcana", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-1-mag", "/blog/chto-takoe-matritsa-sudby"],
    status: "draft",
  },
  {
    slug: "matritsa-sovmestimosti-rasshifrovka",
    title: "Матрица совместимости: как читать расшифровку",
    primaryQuery: "матрица совместимости расшифровка",
    cluster: "compat",
    image: "/arcana/06-vlyublennye.webp",
    imageAlt: "Аркан 6 «Влюблённые» — образ выбора и близости",
    basis: ["compat-texts", "compat-formulas"],
    internalLinks: ["/sovmestimost", "/matrica-sudby/arkan-6-vlyublennye"],
    status: "draft",
  },
  {
    slug: "kak-schitaetsya-matritsa-sovmestimosti",
    title: "Как считается матрица совместимости по дате рождения",
    primaryQuery: "матрица совместимости по дате рождения",
    cluster: "compat",
    image: "/arcana/06-vlyublennye.webp",
    imageAlt: "Аркан 6 «Влюблённые» — образ выбора и близости",
    basis: ["compat-formulas", "compat-texts"],
    internalLinks: ["/sovmestimost", "/matrica-sudby"],
    status: "draft",
  },
  {
    slug: "lila-s-ii-provodnikom",
    title: "Игра Лила с ИИ-проводником: как это работает",
    primaryQuery: "игра лила с чатом gpt",
    cluster: "lila",
    image: "/lila/68-kosmicheskoe-soznanie.webp",
    imageAlt: "Клетка 68 «Космическое сознание» в игре Лила",
    basis: ["lila-guide", "lila-rules"],
    internalLinks: ["/lila", "/lila/igra", "/blog/kak-igrat-v-lilu-onlain"],
    status: "draft",
  },
  {
    slug: "prednaznachenie-v-matritse-sudby",
    title: "Предназначение в матрице судьбы: личное, социальное, духовное",
    primaryQuery: "предназначение в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/01-mag.webp",
    imageAlt: "Аркан 1 «Маг» — образ первого шага",
    basis: ["positions", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-1-mag"],
    status: "draft",
  },
  {
    slug: "kletki-lily-znachenie",
    title: "Клетки Лилы: что означают 72 клетки игры",
    primaryQuery: "игра лила клетки",
    cluster: "lila",
    image: "/lila/01-rozhdenie.webp",
    imageAlt: "Клетка 1 «Рождение» в игре Лила",
    basis: ["lila-cells", "lila-rules"],
    internalLinks: ["/lila", "/lila/kletki/01-rozhdenie", "/lila/kletki/68-kosmicheskoe-soznanie"],
    status: "draft",
  },
  {
    slug: "zadacha-v-matritse-sudby",
    title: "Задача в матрице судьбы: что показывает точка D",
    primaryQuery: "задача в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/22-shut.webp",
    imageAlt: "Аркан 22 «Шут» — образ начала пути",
    basis: ["positions", "arcana"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-22-shut"],
    status: "draft",
  },
  {
    slug: "pole-igry-lila",
    title: "Поле игры Лила: как устроены 72 клетки, змеи и стрелы",
    primaryQuery: "лила поле игры",
    cluster: "lila",
    image: "/lila/12-zavist.webp",
    imageAlt: "Клетка 12 «Зависть» в игре Лила",
    basis: ["lila-rules", "lila-cells"],
    internalLinks: ["/lila", "/blog/zmei-i-strely-lily", "/lila/kletki/12-zavist"],
    status: "draft",
  },
  {
    slug: "liniya-lyubvi-v-matritse-sudby",
    title: "Линия любви в матрице судьбы: как её читать",
    primaryQuery: "линия любви в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/06-vlyublennye.webp",
    imageAlt: "Аркан 6 «Влюблённые» — образ выбора и близости",
    basis: ["positions", "arcana"],
    internalLinks: ["/matrica-sudby", "/sovmestimost"],
    status: "draft",
  },
  {
    slug: "lichnost-i-tsentr-v-matritse-sudby",
    title: "Личность и центр в матрице судьбы: точки A и E",
    primaryQuery: "личность и центр в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/02-verkhovnaya-zhrica.webp",
    imageAlt: "Аркан 2 «Верховная жрица» — образ внутренней опоры",
    basis: ["positions", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-2-verkhovnaya-zhrica"],
    status: "draft",
  },
  {
    slug: "liniya-deneg-v-matritse-sudby",
    title: "Линия денег в матрице судьбы: как её читать",
    primaryQuery: "линия денег в матрице судьбы",
    cluster: "matrix",
    image: "/arcana/03-imperatrica.webp",
    imageAlt: "Аркан 3 «Императрица» — образ созидания",
    basis: ["positions", "arcana"],
    internalLinks: ["/matrica-sudby", "/matrica-sudby/arkan-3-imperatrica"],
    status: "draft",
  },
  {
    slug: "matritsa-sudby-ne-predskazanie",
    title: "Матрица судьбы — инструмент самопознания, а не предсказание",
    primaryQuery: "матрица судьбы правда или нет",
    cluster: "general",
    image: "/hero.webp",
    imageAlt: HERO_ALT,
    basis: ["positions", "matrix-formulas"],
    internalLinks: ["/matrica-sudby", "/lila", "/blog/chto-takoe-matritsa-sudby"],
    status: "draft",
  },
  {
    slug: "kak-obsudit-sovmestimost-s-partnerom",
    title: "Как обсудить результат совместимости с партнёром",
    primaryQuery: "как обсудить совместимость с партнёром",
    cluster: "compat",
    image: "/arcana/06-vlyublennye.webp",
    imageAlt: "Аркан 6 «Влюблённые» — образ выбора и близости",
    basis: ["compat-texts"],
    internalLinks: ["/sovmestimost", "/matrica-sudby/arkan-6-vlyublennye"],
    status: "draft",
  },
];

export const nextDraftTopic = (plan: readonly PlanTopic[] = CONTENT_PLAN): PlanTopic | undefined => plan.find((topic) => topic.status === "draft");
```

В `packages/content/src/articles-data.ts` добавить: `export { CONTENT_PLAN, nextDraftTopic, type PlanTopic } from "./content-plan";`

- [ ] **Step 4: Запустить**

Run: `pnpm vitest run packages/content/src/content-plan.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/content
git commit -m "feat(content): content plan with 13 topics by search demand"
```

---

### Task 5: Статьи на сайте

**Files:**
- Create: `apps/web/src/components/blog/ArticleBody.tsx`, `apps/web/src/lib/article-body.test.ts`
- Modify: `apps/web/src/lib/blog.ts`, `apps/web/src/app/blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `ARTICLES`, `Article`, `parseMarkdown`, `ARTICLE_BASIS`, `Block`, `Inline` из `@oracle/content/articles`; `sampleArticle` (для теста) из `../../../../packages/content/src/article-fixture` — в тесте импортировать через относительный путь `@oracle/content/articles` нельзя, поэтому фикстура строится в тесте вручную (см. ниже).
- Produces: `articleFaqJsonLd(article: Article): Record<string, unknown>`; `BLOG_POSTS` теперь = ручные + Markdown-статьи, по дате от новых к старым; `<ArticleBody article={…} />`.

- [ ] **Step 1: Написать падающий тест** `apps/web/src/lib/article-body.test.ts`

```ts
import { parseArticle } from "@oracle/content/articles";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { articleFaqJsonLd } from "./blog";

const SOURCE = `---
title: Предназначение в матрице судьбы
metaTitle: Предназначение в матрице судьбы — личное, социальное, духовное
description: Что такое личное, социальное и духовное предназначение в матрице судьбы и как читать их как направления, а не как задания.
date: 2026-10-02
image: /hero.webp
imageAlt: Матрица судьбы
cluster: matrix
basis: positions; matrix-formulas
faq: Что такое предназначение? => Направление для размышления. || Это задание? => Нет. || Где оно? => В основных точках.
---
Первый абзац с [калькулятором](/matrica-sudby) и **выделением**.

## Раздел

- пункт один
- пункт два`;

const article = parseArticle("prednaznachenie-v-matritse-sudby", SOURCE);

describe("ArticleBody", () => {
  const html = renderToStaticMarkup(createElement(ArticleBody, { article }));

  test("renders the text with internal links, the FAQ and the basis block", () => {
    expect(html).toMatch(/<a[^>]*href="\/matrica-sudby"[^>]*>калькулятором<\/a>/);
    expect(html).toContain("<strong>выделением</strong>");
    expect(html).toContain("<h2>Раздел</h2>");
    expect(html).toContain("<li>пункт два</li>");
    expect(html).toContain("Частые вопросы");
    expect(html).toContain("<h3>Что такое предназначение?</h3>");
    expect(html).toContain("На чём основана статья");
    expect(html).toContain("Описания позиций матрицы судьбы");
    expect(html).toContain("Формулы расчёта матрицы судьбы");
  });

  test("publishes the FAQ as FAQPage markup with the same questions", () => {
    const entities = (articleFaqJsonLd(article).mainEntity as { name: string; acceptedAnswer: { text: string } }[]);
    expect(articleFaqJsonLd(article)["@type"]).toBe("FAQPage");
    expect(entities.map((entity) => entity.name)).toEqual(article.faq.map((item) => item.question));
    expect(entities[0]?.acceptedAnswer.text).toBe("Направление для размышления.");
  });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `pnpm vitest run apps/web/src/lib/article-body.test.ts`
Expected: FAIL — нет `ArticleBody` и `articleFaqJsonLd`.

- [ ] **Step 3: Реализовать компонент** `apps/web/src/components/blog/ArticleBody.tsx`

```tsx
import { ARTICLE_BASIS, parseMarkdown, type Article, type Inline } from "@oracle/content/articles";
import Link from "next/link";
import { Fragment } from "react";

function Inlines({ items }: { items: readonly Inline[] }) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={index}>
          {item.type === "strong" ? <strong>{item.text}</strong> : item.type === "link" ? <Link href={item.href}>{item.text}</Link> : item.text}
        </Fragment>
      ))}
    </>
  );
}

// Тело Markdown-статьи: текст, вопросы и ответы, блок «На чём основана статья»
export function ArticleBody({ article }: { article: Article }) {
  return (
    <>
      {parseMarkdown(article.body).map((block, index) =>
        block.type === "h2" ? (
          <h2 key={index}>{block.text}</h2>
        ) : block.type === "ul" ? (
          <ul key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Inlines items={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            <Inlines items={block.inlines} />
          </p>
        ),
      )}
      <section className="stack">
        <h2>Частые вопросы</h2>
        {article.faq.map((item) => (
          <div key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>
      <aside className="stack muted">
        <h2>На чём основана статья</h2>
        <ul>
          {article.basis.map((key) => (
            <li key={key}>{ARTICLE_BASIS[key].label}</li>
          ))}
        </ul>
      </aside>
    </>
  );
}
```

- [ ] **Step 4: Изменить** `apps/web/src/lib/blog.ts`

В начало файла добавить импорт: `import { ARTICLES, type Article } from "@oracle/content/articles";`

Заменить объявление `export const BLOG_POSTS: readonly BlogPost[] = [` на `const MANUAL_POSTS: readonly BlogPost[] = [` (содержимое массива не менять), а сразу после закрывающей `];` массива добавить:

```ts
const articlePost = (article: Article): BlogPost => ({
  slug: article.slug,
  title: article.title,
  metaTitle: article.metaTitle,
  description: article.description,
  published: article.date,
  image: { url: article.image, alt: article.imageAlt },
});

// Сначала новые; при одинаковой дате порядок объявления сохраняется (сортировка устойчива)
export const BLOG_POSTS: readonly BlogPost[] = [...MANUAL_POSTS, ...ARTICLES.map(articlePost)].sort((a, b) => b.published.localeCompare(a.published));

export function articleFaqJsonLd(article: Article): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}
```

- [ ] **Step 5: Изменить** `apps/web/src/app/blog/[slug]/page.tsx`

Добавить импорты: `import { articleBySlug } from "@oracle/content/articles";`, `import { ArticleBody } from "@/components/blog/ArticleBody";`, и `articleFaqJsonLd` в импорт из `@/lib/blog`. Заменить тело `BlogPostPage` до `return` и сам `return` так:

```tsx
export default async function BlogPostPage({ params }: Params) {
  const post = blogPostBySlug((await params).slug);
  const article = post ? articleBySlug(post.slug) : undefined;
  const Body = post ? BODIES[post.slug] : undefined;
  const content = Body ? <Body /> : article ? <ArticleBody article={article} /> : null;
  if (!post || !content) notFound();
  return (
    <main className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(blogPostJsonLd(post)) }} />
      {article && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(articleFaqJsonLd(article)) }} />}
      <article className="stack blog-article">
        <nav aria-label="Навигация" className="muted">
          <Link className="touch-link" href={BLOG_PATH}>
            Блог
          </Link>{" "}
          › {post.title}
        </nav>
        <h1 className="display">{post.title}</h1>
        <p className="muted">
          <time dateTime={post.published}>{dateLabel(post.published)}</time>
        </p>
        {content}
        <p className="muted">{DISCLAIMER}</p>
      </article>
    </main>
  );
}
```

`generateStaticParams` и `dynamicParams = false` не менять: они берут `BLOG_POSTS`, куда уже входят Markdown-статьи.

- [ ] **Step 6: Запустить тесты и типы**

Run: `pnpm vitest run apps/web/src/lib && pnpm typecheck`
Expected: PASS (в том числе существующие `blog.test.ts`, `seo`-тесты).

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): markdown articles in the blog with FAQ markup"
```

---

### Task 6: Тесты целостности на стороне сайта

**Files:**
- Create: `apps/web/src/lib/articles-integrity.test.ts`

**Interfaces:**
- Consumes: `ARTICLES`, `CONTENT_PLAN`, `checkArticle`, `parseMarkdown`, `linksOf` из `@oracle/content/articles`; `ARCANA` из `@oracle/content`; `LILA_CELLS` из `@oracle/content/lila`; `PUBLIC_PATHS` из `./seo`; `BLOG_POSTS` из `./blog`.

- [ ] **Step 1: Написать тесты** `apps/web/src/lib/articles-integrity.test.ts`

```ts
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ARCANA } from "@oracle/content";
import { ARTICLES, CONTENT_PLAN, checkArticle, linksOf, parseMarkdown, type ArticleCheckContext } from "@oracle/content/articles";
import { LILA_CELLS } from "@oracle/content/lila";
import { describe, expect, test } from "vitest";
import { BLOG_POSTS } from "./blog";
import { PUBLIC_PATHS } from "./seo";

const PUBLIC_DIR = fileURLToPath(new URL("../../public/", import.meta.url));
const ALLOWED_IMAGE = /^\/(?:hero|(?:arcana|lila)\/\d{2}-[a-z]+(?:-[a-z]+)*)\.webp$/;
const MANUAL_SLUGS = new Set(BLOG_POSTS.filter((post) => !ARTICLES.some((article) => article.slug === post.slug)).map((post) => post.slug));

const context: ArticleCheckContext = {
  publicPaths: PUBLIC_PATHS,
  arcanumName: (number) => ARCANA.find((item) => item.number === number)?.name,
  cellName: (number) => LILA_CELLS.find((item) => item.number === number)?.name,
  today: new Date().toISOString().slice(0, 10),
};

const imageProblem = (url: string): string | null =>
  !ALLOWED_IMAGE.test(url) ? `${url}: разрешены только /hero.webp и иллюстрации арканов и клеток` : existsSync(`${PUBLIC_DIR}${url.slice(1)}`) ? null : `${url}: файла нет в apps/web/public`;

describe("content plan", () => {
  test("uses only existing internal links and allowed existing images", () => {
    for (const topic of CONTENT_PLAN) {
      expect(topic.internalLinks.filter((link) => !PUBLIC_PATHS.includes(link)), topic.slug).toEqual([]);
      expect(imageProblem(topic.image), topic.slug).toBeNull();
    }
  });

  test("does not reuse a slug of the hand-written blog articles", () => {
    for (const topic of CONTENT_PLAN) expect(MANUAL_SLUGS.has(topic.slug), topic.slug).toBe(false);
  });

  test("is published exactly when the article exists", () => {
    const published = CONTENT_PLAN.filter((topic) => topic.status === "published").map((topic) => topic.slug).sort();
    expect(ARTICLES.map((article) => article.slug).sort()).toEqual(published);
  });
});

describe("published articles", () => {
  test.each(ARTICLES.map((article) => [article.slug, article] as const))("%s passes every automatic check", (_slug, article) => {
    expect(checkArticle(article, context)).toEqual([]);
    expect(imageProblem(article.image)).toBeNull();
  });

  test.each(ARTICLES.map((article) => [article.slug, article] as const))("%s follows its topic in the plan", (_slug, article) => {
    const topic = CONTENT_PLAN.find((item) => item.slug === article.slug);
    expect(topic, "нет темы в контент-плане").toBeDefined();
    const links = linksOf(parseMarkdown(article.body));
    for (const required of topic?.internalLinks ?? []) expect(links, `нет ссылки ${required}`).toContain(required);
    expect(article.basis).toEqual(expect.arrayContaining([...(topic?.basis ?? [])]));
  });

  test("have unique slugs and appear in the blog and in the public paths", () => {
    expect(new Set(ARTICLES.map((article) => article.slug)).size).toBe(ARTICLES.length);
    for (const article of ARTICLES) {
      expect(BLOG_POSTS.some((post) => post.slug === article.slug)).toBe(true);
      expect(PUBLIC_PATHS).toContain(`/blog/${article.slug}`);
    }
  });
});
```

- [ ] **Step 2: Запустить**

Run: `pnpm vitest run apps/web/src/lib/articles-integrity.test.ts`
Expected: PASS (статей пока нет; проверки плана — ссылки, картинки — реальные). Если падает `internalLinks`/`image` — исправить строку в `content-plan.ts` на реальный адрес/файл (имена арканов и клеток смотреть в `apps/web/public/arcana`, `apps/web/public/lila`, `PUBLIC_PATHS`); тест правила не ослаблять.

- [ ] **Step 3: Проверить, что тесты действительно ловят ошибки (одноразовая проверка)**

Временно создать `packages/content/articles/matritsa-sudby-ne-predskazanie.md` с шапкой из образца и текстом `Вас ждёт удача.`, выполнить `pnpm content:build && pnpm vitest run apps/web/src/lib/articles-integrity.test.ts`.
Expected: FAIL (стоп-фразы, разделы, план `draft` ≠ есть статья). Затем удалить файл и выполнить `pnpm content:build`, убедиться, что `generated/articles.json` снова `{}`, а `git status` не показывает этих файлов.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/articles-integrity.test.ts
git commit -m "test(web): integrity checks for articles, plan links and images"
```

---

### Task 7: Проверка CI для веток `article/*`

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Добавить задание в конец `jobs:` файла `.github/workflows/ci.yml`** (на одном уровне с `test:`)

```yaml
  article-scope:
    # PR автописателя может менять только файлы статей: любой другой код идёт к владелице на «да»
    if: github.event_name == 'pull_request' && startsWith(github.head_ref, 'article/')
    runs-on: ubuntu-latest
    env:
      BASE_REF: ${{ github.base_ref }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Only article files changed
        shell: bash
        run: |
          set -euo pipefail
          changed="$(git diff --name-only "origin/${BASE_REF}...HEAD")"
          echo "Changed files:"
          printf '%s\n' "$changed"
          forbidden="$(printf '%s\n' "$changed" | grep -vE '^(packages/content/articles/[a-z0-9-]+\.md|packages/content/src/content-plan\.ts|packages/content/src/generated/articles\.json)$' || true)"
          if [[ -n "$forbidden" ]]; then
            echo "::error::A pull request from article/* may change only article files. Not allowed:"
            printf '%s\n' "$forbidden"
            exit 1
          fi
```

- [ ] **Step 2: Проверить логику фильтра локально**

Run:
```bash
printf 'packages/content/articles/a-b.md\npackages/content/src/generated/articles.json\napps/web/src/lib/blog.ts\n' | grep -vE '^(packages/content/articles/[a-z0-9-]+\.md|packages/content/src/content-plan\.ts|packages/content/src/generated/articles\.json)$'
```
Expected: выводит только `apps/web/src/lib/blog.ts`.

- [ ] **Step 3: Проверить синтаксис YAML**

Run: `node -e "const y=require('node:fs').readFileSync('.github/workflows/ci.yml','utf8'); console.log(y.includes('article-scope') && !y.includes('\t'))"`
Expected: `true` (нет табуляций; структуру окончательно проверит запуск в PR).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: article pull requests may change only article files"
```

---

### Task 8: IndexNow

**Files:**
- Create: `apps/web/public/indexnow.txt`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Создать публичный ключ** (это не секрет: он должен лежать на сайте)

Run: `cd /c/dev/oracle-articles && printf '%s' "$(openssl rand -hex 16)" > apps/web/public/indexnow.txt && wc -c apps/web/public/indexnow.txt`
Expected: `32 apps/web/public/indexnow.txt`.

- [ ] **Step 2: Добавить шаги в конец списка `steps:` задания `deploy` в `.github/workflows/deploy.yml`** (после шага `Deploy web and worker`, тот же отступ)

```yaml

      # Новые и изменённые статьи сразу сообщаем Яндексу по IndexNow, не дожидаясь обхода.
      # Ключ публичный и лежит на сайте (apps/web/public/indexnow.txt); сбой уведомления релиз не отменяет
      - name: Checkout for IndexNow
        if: steps.config.outputs.configured == 'true'
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Notify Yandex about changed articles (IndexNow)
        if: steps.config.outputs.configured == 'true'
        shell: bash
        run: |
          set -uo pipefail
          site="${SITE_URL%/}"
          host="${site#https://}"
          key="$(cat apps/web/public/indexnow.txt)"
          urls=()
          while IFS= read -r file; do
            urls+=("$site/blog/$(basename "$file" .md)")
          done < <(git diff --name-only --diff-filter=AM HEAD^1 HEAD -- 'packages/content/articles/*.md')
          if [[ ${#urls[@]} -eq 0 ]]; then
            echo "No changed articles — nothing to send to IndexNow."
            exit 0
          fi
          urls+=("$site/blog" "$site/sitemap.xml")
          payload="$(jq -n --arg host "$host" --arg key "$key" --arg loc "$site/indexnow.txt" '{host: $host, key: $key, keyLocation: $loc, urlList: $ARGS.positional}' --args "${urls[@]}")"
          printf 'IndexNow: %s\n' "${urls[@]}"
          code="$(curl -s -o /tmp/indexnow.out -w '%{http_code}' -X POST https://yandex.com/indexnow -H 'Content-Type: application/json; charset=utf-8' --data "$payload" || echo 000)"
          echo "IndexNow response: $code $(head -c 300 /tmp/indexnow.out 2>/dev/null)"
          if [[ "$code" != "200" && "$code" != "202" ]]; then
            echo "::warning::IndexNow returned $code; articles will still be found through sitemap.xml"
          fi
```

`SITE_URL` уже задан в `env:` этого задания.

- [ ] **Step 3: Проверить формирование адресов и запроса без отправки**

Run:
```bash
cd /c/dev/oracle-articles && site="https://tvoy-orakul.ru"; host="${site#https://}"; key="$(cat apps/web/public/indexnow.txt)"; urls=("$site/blog/example" "$site/blog" "$site/sitemap.xml"); jq -n --arg host "$host" --arg key "$key" --arg loc "$site/indexnow.txt" '{host: $host, key: $key, keyLocation: $loc, urlList: $ARGS.positional}' --args "${urls[@]}"
```
Expected: JSON с `host: tvoy-orakul.ru`, ключом из 32 символов и тремя адресами. (Если `jq` не установлен локально — пропустить, шаг проверится на runner'е; в отчёте так и написать.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/public/indexnow.txt .github/workflows/deploy.yml
git commit -m "ci: notify Yandex about new articles via IndexNow"
```

---

### Task 9: Инструкция автописателя и AGENTS.md

**Files:**
- Create: `docs/oracle-article-writer.md`
- Modify: `AGENTS.md` (одна строка в таблице «Где что лежит»)

- [ ] **Step 1: Создать `docs/oracle-article-writer.md`**

````markdown
# Автописатель статей «Твоего оракула»

Инструкция для агента, который по расписанию (вторник и пятница) пишет и публикует одну статью в `/blog`. Владелица решила 30.09.2026: статьи выходят **без ручной вычитки**. Агент сам мержит свой PR, если все проверки зелёные. Поэтому всё ниже обязательно; если условие выполнить нельзя — статью не публиковать (см. «Когда остановиться»).

Агент меняет только три вида файлов: `packages/content/articles/*.md`, `packages/content/src/content-plan.ts` (одно поле `status` выбранной темы или удаление дублирующей темы) и `packages/content/src/generated/articles.json`. Любой другой файл — стоп: CI такой PR не пропустит. Код сайта, тесты, workflow и остальное правит только человек по «да» владелицы.

## 0. Перед началом

1. `git checkout master && git pull`.
2. `gh pr list --state open --search "head:article/"` — если есть открытый PR статьи, сначала довести его (исправить проверки) или закрыть с комментарием. Новую статью в этот запуск не писать.
3. `pnpm install`.

## 1. Выбор темы

1. Взять первую тему `CONTENT_PLAN` (`packages/content/src/content-plan.ts`) со статусом `draft`. Если тем нет — остановиться и сообщить: очередь закончилась, нужны новые темы от владелицы.
2. Сравнить запрос темы с опубликованными статьями (`packages/content/articles`, `apps/web/src/lib/blog.ts`) и страницами сайта. Если тема по сути повторяет существующую страницу, удалить её из плана (одна запись) и взять следующую: две страницы под один запрос отбирают друг у друга позиции.

## 2. На чём можно писать

Только на материалах, перечисленных в `basis` темы (ключи из `packages/content/src/article-basis.ts`; файлы указаны там же):

- тексты арканов `packages/content/arcana/*.md`, позиций `positions.md`, совместимости `compat-arcana.md`, клеток Лилы `lila-cells.md`;
- формулы и правила из кода: `packages/core/src/matrix.ts`, `compatibility.ts`, `lila.ts`; проводник Лилы — `packages/ai/src/lila-*.ts`.

Правила достоверности:

- Прочитать нужные файлы целиком перед письмом. Любое утверждение о том, как считается, что означает, что происходит в игре, должно прямо следовать из этих файлов.
- Никаких выдуманных фактов, авторов, дат, «древней традиции», «истории метода», исследований, процентов, статистики. Если факта нет в материалах — не писать его.
- Числа арканов (1–22) и клеток (1–72) и названия берутся только из наших текстов; тест сверяет «аркан N «Название»» с реальными.
- Расчёт объяснять по коду: какие точки от каких считаются, какие правила приведения чисел; не обобщать сверх кода.
- Не пересказывать целыми фразами тексты арканов и клеток: объяснять своими словами, ссылаясь на страницу.

## 3. Текст

Образец тона — четыре статьи блога (`apps/web/src/components/blog/*.tsx`) и тексты арканов.

- Русский язык, спокойный тон, без кликбейта и восклицательных знаков. Обращение только «вы»; без «ты/твой» (кроме названия «Твой оракул»).
- Нейтральный род: не «вы сделали бы её/его», не «вы сама/сам», избегать кратких прилагательных и причастий в единственном числе; формулировать через «можно заметить», «нередко», «вам может быть важно».
- Язык гипотез: «может проявляться», «нередко», «стоит присмотреться». Нет обещаний и вердиктов.
- Нельзя: предсказания («вас ждёт», «вам суждено», «неизбежно»), диагнозы и медицинские советы, «карма» и любые слова с этой основой, запугивание («порча», «сглаз», «расплата»), «гарантирует». Слово «предсказание» допустимо только с отрицанием («не предсказание», «без предсказаний»).
- Объём тела — 4 000–9 000 знаков (ориентир 5 500–7 500), не меньше трёх разделов `## `.
- Первый абзац сразу отвечает на запрос темы (`primaryQuery`), без «в этой статье мы…».
- Разрешён только такой Markdown: абзацы, `## Заголовок` (не `###`), списки `- пункт`, `**жирный**`, ссылки `[текст](/путь)`. Никаких таблиц, картинок, нумерованных списков, цитат, кода, HTML, внешних ссылок.
- Все ссылки из поля `internalLinks` темы обязательны в тексте. Минимум одна ссылка ведёт на калькулятор или Лилу (`/matrica-sudby`, `/sovmestimost`, `/lila`). Все ссылки — на существующие страницы сайта.
- В конце текста — мягкое приглашение рассчитать матрицу или сыграть, без давления.

### Файл статьи

`packages/content/articles/<slug>.md`, slug и поля берутся из темы плана:

```yaml
---
title: <H1, до 90 знаков; можно title темы>
metaTitle: <до 75 знаков, для выдачи>
description: <90–175 знаков, отвечает на запрос>
date: <сегодня, ГГГГ-ММ-ДД, не в будущем>
image: <картинка темы из плана>
imageAlt: <осмысленное описание картинки>
cluster: <matrix | compat | lila | general — из плана>
basis: <ключи через «; » — как в плане, можно добавить>
faq: Вопрос 1? => Ответ 1. || Вопрос 2? => Ответ 2. || Вопрос 3? => Ответ 3.
---
```

FAQ — от 3 до 5 пар, ответы простым текстом без разметки и без символов `||` и `=>`.

Картинка: только `/hero.webp` или существующая иллюстрация `/arcana/NN-slug.webp` или `/lila/NN-slug.webp` (файлы в `apps/web/public`). Брать ту, что указана в теме; заменить можно на другую по смыслу. Новые картинки не создавать.

## 4. План и сборка

1. В `content-plan.ts` у выбранной темы поставить `status: "published"`.
2. `pnpm content:build`.
3. `pnpm typecheck` и `pnpm test`. Падения исправлять в статье или плане. Тесты и код не менять.

## 5. Самопроверка перед публикацией

Перечитать статью и убедиться:

- каждое утверждение прямо следует из материалов `basis`;
- нет предсказаний, диагнозов, «кармы», запугивания; тон «вы», нейтральный род;
- все числа и названия арканов и клеток верны, ссылки ведут на существующие страницы;
- первый абзац отвечает на запрос, текст не пересказывает арканы и клетки целыми фразами.

## 6. Публикация

1. Ветка `article/<slug>` от свежего `master`. Коммит: `feat(content): article <slug>`.
2. `gh pr create --base master --title "Статья: <title>" --body "<запрос, о чём статья, на чём основана>"`.
3. `gh pr checks <номер> --watch` — дождаться всех проверок, включая `article-scope`.
4. Если всё зелёное — `gh pr merge <номер> --merge`. Мерж запускает деплой, деплой сам сообщит Яндексу по IndexNow.

## Когда остановиться

Не мержить, оставить PR открытым с комментарием, что не так, если:

- проверки не зелёные после двух попыток исправления;
- для статьи пришлось бы менять что-то кроме трёх видов файлов;
- в материалах `basis` не хватает фактов для темы;
- тема оказалась медицинской, диагностической или из стоп-списка (`STOP_PHRASES` в `packages/content/src/check.ts`);
- в плане не осталось тем.

Лучше пропустить публикацию, чем выпустить статью с выдуманными фактами: сайт публикуется без ручной проверки.
````

- [ ] **Step 2: Добавить строку в таблицу `AGENTS.md`** после строки «Блог» (искать по началу `| Блог |`)

```markdown
| Статьи блога в Markdown (пишет автописатель) | `packages/content/articles/*.md`, контент-план — `packages/content/src/content-plan.ts`, проверки — `packages/content/src/article-check.ts`, инструкция — `docs/oracle-article-writer.md` (после правки статьи — `pnpm content:build`) |
```

- [ ] **Step 3: Проверить, что инструкция не расходится с кодом**

Run: `grep -c "article-scope" docs/oracle-article-writer.md && grep -n "STOP_PHRASES" packages/content/src/check.ts | head -1`
Expected: `1` и найденная строка объявления.

- [ ] **Step 4: Commit**

```bash
git add docs/oracle-article-writer.md AGENTS.md
git commit -m "docs: article writer procedure for the scheduled agent"
```

---

### Task 10: Финальная проверка и PR

- [ ] **Step 1: Полная проверка**

Run: `pnpm content:build && git status --short && pnpm typecheck && pnpm test:coverage`
Expected: `git status` пуст после сборки (generated в синхроне), typecheck и тесты зелёные, покрытие ≥ 80 %.

- [ ] **Step 2: Сборка сайта и просмотр страницы блога**

Run: `pnpm --filter @oracle/web build`
Expected: сборка успешна; `/blog` и четыре старые статьи собираются.

- [ ] **Step 3: Показать владелице результат и получить «да» на публикацию PR**

Свести: список коммитов (`git log --oneline origin/master..HEAD`), результат тестов, оговорки (например, что IndexNow и `article-scope` проверятся в первом запуске GitHub Actions).

- [ ] **Step 4: Отправить ветку и открыть PR** (только после «да»)

```bash
git push -u origin feat/seo-articles
gh pr create --base master --title "feat: SEO-статьи в блоге и защита для автописателя" --body "<сводка по спецификации docs/superpowers/specs/2026-09-30-seo-articles-design.md, план тестов>"
```

Затем `gh pr checks <номер> --watch`; мерж — только по отдельному «да» владелицы.

---

## Самопроверка плана по спецификации

- Формат, сборка, парсер, `/blog` общий, рендер, FAQ, блок «На чём основана» — Tasks 1, 2, 5.
- Контент-план из 13 тем и порядок — Task 4.
- Тесты целостности (стоп-лист, тон, структура, ссылки, основание, числа и названия, план ↔ статьи, картинки) — Tasks 3, 6.
- Защита процесса (`article-scope`, IndexNow) — Tasks 7, 8.
- Инструкция автописателя — Task 9.
- Порядок работ (копия, PR по «да»), первая статья и расписание, отдельный PR с заголовками страниц — вне этого плана: первая статья и расписание выполняются после мержа (шаги 5–6 порядка работ), правка заголовков идёт отдельным планом по «да».
