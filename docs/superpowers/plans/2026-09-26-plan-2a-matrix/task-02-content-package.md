# Задача 2 — пакет `@oracle/content`: формат, разбор, проверка, сборка

**Files:**
- Create: `packages/content/package.json`, `packages/content/tsconfig.json`, `packages/content/vitest.config.ts`
- Create: `packages/content/arcana/.gitkeep`
- Create: `packages/content/scripts/build-arcana.mjs`, `packages/content/scripts/build-arcana.d.mts`
- Create: `packages/content/src/arcana.ts`, `src/check.ts`, `src/index.ts`, `src/testing.ts`, `src/generated/arcana.json`
- Test: `packages/content/src/arcana.test.ts`, `src/check.test.ts`, `src/build.test.ts`
- Modify: корневой `package.json` (скрипт `content:build`), `vitest.config.ts` (покрытие), `apps/web/package.json` (зависимость), `apps/web/next.config.ts` (`transpilePackages`)

**Interfaces:**
- Consumes: `ARCANA_COUNT` из `@oracle/core` (задача 1).
- Produces (`@oracle/content`):
  - `type Arcanum = { number: number; name: string; slug: string; keywords: readonly string[]; essence: readonly string[]; personality: readonly string[]; center: readonly string[]; task: readonly string[]; resource: readonly string[]; distortion: readonly string[]; action: string; question: string }` (все поля `readonly`)
  - `SECTION_TITLES` — `{ essence: "Суть", personality: "В личности", center: "В центре", task: "Как задача", resource: "В ресурсе", distortion: "В перекосе", action: "Действие на сегодня", question: "Вопрос для себя" }`
  - `parseArcanum(source: string, file: string): Arcanum` — бросает `ArcanumFormatError` с именем файла
  - `STOP_PHRASES`, `findStopPhrases(text: string): string[]`, `checkArcana(entries: readonly { file: string; arcanum: Arcanum }[], expectedCount?: number): string[]`
  - `loadArcana(sources: Readonly<Record<string, string>>): { file: string; arcanum: Arcanum }[]`
  - `ARCANA: readonly Arcanum[]` (по возрастанию номера), `arcanumByNumber(n: number): Arcanum` (бросает, если нет), `arcanumBySlug(slug: string): Arcanum | undefined`
  - скрипт `pnpm content:build` → `packages/content/src/generated/arcana.json` (`{ "<имя файла без .md>": "<текст>" }`)

## Зачем

Спецификация 2а, раздел 3. Тексты арканов пишутся и вычитываются как обычные Markdown-файлы; сайт получает их собранными в JSON, чтобы калькулятор мог показать трактовку прямо в браузере. Проверка при сборке не пускает на сайт аркан без секции, с опечаткой в номере или с запрещёнными оборотами («вас ждёт», «порча»…). Образец — пакет контента Граней (`C:\dev\grani-test\packages\content`): скрипт только собирает сырые тексты, а разбор и проверки живут в TypeScript и покрыты тестами.

## Формат файла `arcana/NN-slug.md`

```markdown
---
number: 11
name: Сила
slug: sila
keywords: мягкая сила; самообладание; доверие к себе
---

## Суть

Абзац.

Ещё абзац.

## В личности

Абзац (можно несколько).

## В центре

Абзац.

## Как задача

Абзац.

## В ресурсе

- пункт
- пункт
- пункт

## В перекосе

- пункт
- пункт
- пункт

## Действие на сегодня

Один абзац.

## Вопрос для себя

Один вопрос.
```

Правила: имя файла — номер из двух цифр и slug (`11-sila.md`); `keywords` — 3–4 фразы через `; `; все восемь секций обязательны и идут с заголовком второго уровня; в «В ресурсе» и «В перекосе» — ровно 3 пункта списка; «Действие на сегодня» и «Вопрос для себя» — ровно один абзац.

## Шаги

- [ ] **Step 1: Каркас пакета**

`packages/content/package.json`:

```json
{
  "name": "@oracle/content",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "build": "node scripts/build-arcana.mjs"
  },
  "dependencies": { "@oracle/core": "workspace:*" }
}
```

`packages/content/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["node"], "allowJs": false },
  "include": ["src", "scripts/*.d.mts"]
}
```

`packages/content/vitest.config.ts`:

```ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: { name: "content", environment: "node" },
});
```

`packages/content/arcana/.gitkeep` — пустой файл. `packages/content/src/generated/arcana.json`:

```json
{}
```

Корневой `package.json` — в `scripts` добавить строку `"content:build": "pnpm --filter @oracle/content build",`.

Корневой `vitest.config.ts` — в `coverage.include` добавить `"packages/content/src/**/*.ts"`:

```ts
      include: ["packages/core/src/**/*.ts", "packages/content/src/**/*.ts", "packages/db/src/**/*.ts", "apps/web/src/server/**/*.ts", "apps/web/src/lib/**/*.{ts,tsx}"],
```

`apps/web/package.json` — в `dependencies` добавить `"@oracle/content": "workspace:*",` (по алфавиту между `@oracle/core` и `@oracle/db`). `apps/web/next.config.ts` — `transpilePackages: ["@oracle/core", "@oracle/content", "@oracle/db"],`.

Run: `pnpm install` — Expected: lockfile обновлён, без ошибок.

- [ ] **Step 2: Тестовые данные**

`packages/content/src/testing.ts` (исключён из покрытия правилом `**/testing.ts`):

```ts
type SampleArcanum = { number?: number; name?: string; slug?: string; keywords?: string; drop?: string; extra?: string; essence?: string };

// Корректный файл аркана; поля переопределяются, секцию можно выбросить (drop) или добавить лишний текст (extra)
export function sampleArcanumSource(p: SampleArcanum = {}): string {
  const sections: [string, string][] = [
    ["Суть", p.essence ?? "Первый абзац о сути.\n\nВторой абзац о сути."],
    ["В личности", "Как это видно в характере."],
    ["В центре", "На что можно опереться."],
    ["Как задача", "Какой урок стоит заметить."],
    ["В ресурсе", "- спокойствие\n- ясность\n- тепло"],
    ["В перекосе", "- спешка\n- контроль\n- обида"],
    ["Действие на сегодня", "Сделайте одно маленькое дело."],
    ["Вопрос для себя", "Что для вас сейчас важно?"],
  ];
  const body = sections
    .filter(([title]) => title !== p.drop)
    .map(([title, text]) => `## ${title}\n\n${text}`)
    .join("\n\n");
  return [
    "---",
    `number: ${p.number ?? 11}`,
    `name: ${p.name ?? "Сила"}`,
    `slug: ${p.slug ?? "sila"}`,
    `keywords: ${p.keywords ?? "мягкая сила; самообладание; доверие к себе"}`,
    "---",
    "",
    p.extra ?? "",
    body,
  ].join("\n");
}
```

- [ ] **Step 3: Падающие тесты разбора**

`packages/content/src/arcana.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { ArcanumFormatError, parseArcanum } from "./arcana";
import { sampleArcanumSource } from "./testing";

describe("parseArcanum", () => {
  test("reads the header and every section", () => {
    const arcanum = parseArcanum(sampleArcanumSource(), "11-sila.md");

    expect(arcanum).toEqual({
      number: 11,
      name: "Сила",
      slug: "sila",
      keywords: ["мягкая сила", "самообладание", "доверие к себе"],
      essence: ["Первый абзац о сути.", "Второй абзац о сути."],
      personality: ["Как это видно в характере."],
      center: ["На что можно опереться."],
      task: ["Какой урок стоит заметить."],
      resource: ["спокойствие", "ясность", "тепло"],
      distortion: ["спешка", "контроль", "обида"],
      action: "Сделайте одно маленькое дело.",
      question: "Что для вас сейчас важно?",
    });
  });

  test("accepts Windows line endings and joins wrapped lines of a paragraph", () => {
    const source = sampleArcanumSource({ essence: "Строка один\nстрока два." }).replace(/\n/g, "\r\n");
    expect(parseArcanum(source, "11-sila.md").essence).toEqual(["Строка один строка два."]);
  });

  test.each([
    ["missing header", "## Суть\n\nтекст", /шапк/],
    ["number out of range", sampleArcanumSource({ number: 23 }), /номер/],
    ["bad slug", sampleArcanumSource({ slug: "Сила" }), /slug/],
    ["too few keywords", sampleArcanumSource({ keywords: "одно; два" }), /keywords/],
    ["missing section", sampleArcanumSource({ drop: "В центре" }), /В центре/],
    ["text before the first section", sampleArcanumSource({ extra: "лишний текст\n" }), /до первой секции/],
  ])("rejects %s", (_case, source, message) => {
    expect(() => parseArcanum(source, "11-sila.md")).toThrow(ArcanumFormatError);
    expect(() => parseArcanum(source, "11-sila.md")).toThrow(message);
  });

  test("rejects an unknown or repeated section", () => {
    const unknown = `${sampleArcanumSource()}\n\n## Прогноз\n\nтекст`;
    const repeated = `${sampleArcanumSource()}\n\n## Суть\n\nещё`;
    expect(() => parseArcanum(unknown, "f.md")).toThrow(/Прогноз/);
    expect(() => parseArcanum(repeated, "f.md")).toThrow(/повтор/);
  });

  test("requires exactly three list items and a single paragraph where the format says so", () => {
    const twoItems = sampleArcanumSource().replace("- спокойствие\n- ясность\n- тепло", "- спокойствие\n- ясность");
    const notList = sampleArcanumSource().replace("- спешка", "спешка");
    const twoParagraphs = sampleArcanumSource().replace("Сделайте одно маленькое дело.", "Раз.\n\nДва.");
    expect(() => parseArcanum(twoItems, "f.md")).toThrow(/3 пункта/);
    expect(() => parseArcanum(notList, "f.md")).toThrow(/списк/);
    expect(() => parseArcanum(twoParagraphs, "f.md")).toThrow(/один абзац/);
  });

  test("names the file in every error", () => {
    expect(() => parseArcanum(sampleArcanumSource({ number: 0 }), "00-bad.md")).toThrow(/00-bad\.md/);
  });
});
```

Run: `pnpm vitest run --project content` — Expected: FAIL, `./arcana` не найден.

- [ ] **Step 4: Разбор**

`packages/content/src/arcana.ts`:

```ts
import { ARCANA_COUNT } from "@oracle/core";

export const SECTION_TITLES = {
  essence: "Суть",
  personality: "В личности",
  center: "В центре",
  task: "Как задача",
  resource: "В ресурсе",
  distortion: "В перекосе",
  action: "Действие на сегодня",
  question: "Вопрос для себя",
} as const;

type SectionKey = keyof typeof SECTION_TITLES;

export type Arcanum = {
  readonly number: number;
  readonly name: string;
  readonly slug: string;
  readonly keywords: readonly string[];
  readonly essence: readonly string[];
  readonly personality: readonly string[];
  readonly center: readonly string[];
  readonly task: readonly string[];
  readonly resource: readonly string[];
  readonly distortion: readonly string[];
  readonly action: string;
  readonly question: string;
};

export class ArcanumFormatError extends Error {}

const LIST_SECTIONS: readonly SectionKey[] = ["resource", "distortion"];
const SINGLE_SECTIONS: readonly SectionKey[] = ["action", "question"];
const LIST_LENGTH = 3;
const SLUG = /^[a-z]+(-[a-z]+)*$/;
const TITLE_TO_KEY = new Map<string, SectionKey>(Object.entries(SECTION_TITLES).map(([key, title]) => [title, key as SectionKey]));

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

function readHeader(header: string, fail: (message: string) => never) {
  const fields = new Map(
    header.split("\n").map((line) => {
      const colon = line.indexOf(":");
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()] as const;
    }),
  );
  const number = Number(fields.get("number"));
  if (!Number.isInteger(number) || number < 1 || number > ARCANA_COUNT) fail(`номер аркана должен быть от 1 до ${ARCANA_COUNT}`);
  const name = fields.get("name") ?? "";
  if (!name) fail("нет name");
  const slug = fields.get("slug") ?? "";
  if (!SLUG.test(slug)) fail("slug — латиница в нижнем регистре через дефис");
  const keywords = (fields.get("keywords") ?? "").split(";").map((word) => word.trim()).filter(Boolean);
  if (keywords.length < 3 || keywords.length > 4) fail("keywords — 3–4 фразы через «; »");
  return { number, name, slug, keywords };
}

function readSections(body: string, fail: (message: string) => never): Record<SectionKey, string> {
  const [before, ...chunks] = body.split(/^## /m);
  if (before?.trim()) fail("текст до первой секции");
  const found = new Map<SectionKey, string>();
  for (const chunk of chunks) {
    const newline = chunk.indexOf("\n");
    const title = (newline === -1 ? chunk : chunk.slice(0, newline)).trim();
    const key = TITLE_TO_KEY.get(title);
    if (!key) fail(`неизвестная секция «${title}»`);
    if (found.has(key)) fail(`секция «${title}» повторяется`);
    found.set(key, newline === -1 ? "" : chunk.slice(newline + 1).trim());
  }
  for (const [key, title] of Object.entries(SECTION_TITLES)) {
    if (!found.get(key as SectionKey)) fail(`нет секции «${title}»`);
  }
  return Object.fromEntries(found) as Record<SectionKey, string>;
}

function listItems(text: string, title: string, fail: (message: string) => never): string[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.some((line) => !line.startsWith("- "))) fail(`«${title}» — только пункты списка «- »`);
  if (lines.length !== LIST_LENGTH) fail(`«${title}» — ровно ${LIST_LENGTH} пункта`);
  return lines.map((line) => line.slice(2).trim());
}

function singleParagraph(text: string, title: string, fail: (message: string) => never): string {
  const [only, ...rest] = paragraphs(text);
  if (!only || rest.length > 0) fail(`«${title}» — ровно один абзац`);
  return only;
}

export function parseArcanum(source: string, file: string): Arcanum {
  const fail = (message: string): never => {
    throw new ArcanumFormatError(`${file}: ${message}`);
  };
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source.replace(/\r\n/g, "\n").trim());
  if (!match) return fail("нет шапки между строками ---");
  const header = readHeader(match[1] ?? "", fail);
  const sections = readSections(match[2] ?? "", fail);

  const prose = (key: SectionKey) => paragraphs(sections[key]);
  const [resource, distortion] = LIST_SECTIONS.map((key) => listItems(sections[key], SECTION_TITLES[key], fail)) as [string[], string[]];
  const [action, question] = SINGLE_SECTIONS.map((key) => singleParagraph(sections[key], SECTION_TITLES[key], fail)) as [string, string];

  return {
    ...header,
    essence: prose("essence"),
    personality: prose("personality"),
    center: prose("center"),
    task: prose("task"),
    resource,
    distortion,
    action,
    question,
  };
}
```

Run: `pnpm vitest run --project content packages/content/src/arcana.test.ts` — Expected: PASS.

- [ ] **Step 5: Падающие тесты проверки**

`packages/content/src/check.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { parseArcanum } from "./arcana";
import { checkArcana, findStopPhrases } from "./check";
import { sampleArcanumSource } from "./testing";

const entry = (number: number, slug: string, file = `${String(number).padStart(2, "0")}-${slug}.md`, essence?: string) => ({
  file,
  arcanum: parseArcanum(sampleArcanumSource({ number, slug, essence }), file),
});

describe("findStopPhrases", () => {
  test("finds forbidden phrases regardless of case and ё/е", () => {
    expect(findStopPhrases("Вас Ждёт удача, а ещё — порча.")).toEqual(["вас ждет", "порча"]);
  });

  test("returns nothing for a calm text", () => {
    expect(findStopPhrases("Возможно, вам стоит присмотреться к этому.")).toEqual([]);
  });
});

describe("checkArcana", () => {
  test("accepts a complete, consistent set", () => {
    expect(checkArcana([entry(1, "mag"), entry(2, "zhrica")], 2)).toEqual([]);
  });

  test("reports a wrong count, a gap and a duplicate number", () => {
    const errors = checkArcana([entry(1, "mag"), entry(1, "mag-dva"), entry(3, "tri")], 3);
    expect(errors).toContain("номер 2 отсутствует");
    expect(errors).toContain("номер 1 встречается 2 раза");
  });

  test("reports a missing file count", () => {
    expect(checkArcana([entry(1, "mag")], 2)).toContain("файлов арканов 1, нужно 2");
  });

  test("reports a file name that does not match the header", () => {
    expect(checkArcana([entry(1, "mag", "01-maga.md")], 1)).toEqual(["01-maga.md: имя файла должно быть 01-mag.md"]);
  });

  test("reports stop phrases with the file name", () => {
    expect(checkArcana([entry(1, "mag", undefined, "Вам суждено стать магом.")], 1)).toEqual(["01-mag.md: запрещённые обороты — вам суждено"]);
  });
});
```

Run: `pnpm vitest run --project content packages/content/src/check.test.ts` — Expected: FAIL, `./check` не найден.

- [ ] **Step 6: Проверка**

`packages/content/src/check.ts`:

```ts
import { ARCANA_COUNT } from "@oracle/core";
import type { Arcanum } from "./arcana";

// Обороты, которые превращают трактовку в предсказание, диагноз или запугивание. Сравнение — без регистра, «ё» = «е»
export const STOP_PHRASES = [
  "вас ждет",
  "вам суждено",
  "суждено вам",
  "неизбежно",
  "обязательно случится",
  "гарантирует",
  "гарантированно",
  "карма накажет",
  "кармический долг",
  "расплата",
  "порча",
  "сглаз",
  "проклят",
  "венец безбрачия",
  "диагноз",
  "болезнь",
] as const;

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, "е");

export function findStopPhrases(text: string): string[] {
  const haystack = normalize(text);
  return STOP_PHRASES.filter((phrase) => haystack.includes(phrase));
}

const arcanumText = (a: Arcanum) =>
  [a.name, ...a.keywords, ...a.essence, ...a.personality, ...a.center, ...a.task, ...a.resource, ...a.distortion, a.action, a.question].join("\n");

export function checkArcana(entries: readonly { file: string; arcanum: Arcanum }[], expectedCount: number = ARCANA_COUNT): string[] {
  const errors: string[] = [];
  if (entries.length !== expectedCount) errors.push(`файлов арканов ${entries.length}, нужно ${expectedCount}`);

  for (let number = 1; number <= expectedCount; number += 1) {
    const count = entries.filter((entry) => entry.arcanum.number === number).length;
    if (count === 0) errors.push(`номер ${number} отсутствует`);
    if (count > 1) errors.push(`номер ${number} встречается ${count} раза`);
  }

  for (const { file, arcanum } of entries) {
    const expectedFile = `${String(arcanum.number).padStart(2, "0")}-${arcanum.slug}.md`;
    if (file !== expectedFile) errors.push(`${file}: имя файла должно быть ${expectedFile}`);
    const stops = findStopPhrases(arcanumText(arcanum));
    if (stops.length > 0) errors.push(`${file}: запрещённые обороты — ${stops.join(", ")}`);
  }
  return errors;
}
```

Run: `pnpm vitest run --project content packages/content/src/check.test.ts` — Expected: PASS.

- [ ] **Step 7: Сборка JSON и загрузка**

`packages/content/scripts/build-arcana.mjs`:

```js
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Скрипт только собирает сырые тексты; разбор и проверки — в src/arcana.ts и src/check.ts
export function collectArcana(dir) {
  const sources = {};
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".md")).sort()) {
    sources[name.replace(/\.md$/, "")] = readFileSync(join(dir, name), "utf8").replace(/\r\n/g, "\n").trim();
  }
  return sources;
}

if (import.meta.main) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const output = join(root, "src", "generated", "arcana.json");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(collectArcana(join(root, "arcana")), null, 2)}\n`, "utf8");
  console.log(`arcana.json written: ${output}`);
}
```

`packages/content/scripts/build-arcana.d.mts`:

```ts
export function collectArcana(dir: string): Record<string, string>;
```

`packages/content/src/index.ts`:

```ts
import { parseArcanum, type Arcanum } from "./arcana";
import raw from "./generated/arcana.json";

export { ArcanumFormatError, parseArcanum, SECTION_TITLES, type Arcanum } from "./arcana";
export { checkArcana, findStopPhrases, STOP_PHRASES } from "./check";

export function loadArcana(sources: Readonly<Record<string, string>>): { file: string; arcanum: Arcanum }[] {
  return Object.keys(sources)
    .sort()
    .map((name) => ({ file: `${name}.md`, arcanum: parseArcanum(sources[name] ?? "", `${name}.md`) }));
}

// Собранные тексты: pnpm content:build → src/generated/arcana.json
export const ARCANA: readonly Arcanum[] = loadArcana(raw as Record<string, string>)
  .map((entry) => entry.arcanum)
  .sort((a, b) => a.number - b.number);

export function arcanumByNumber(number: number): Arcanum {
  const arcanum = ARCANA.find((item) => item.number === number);
  if (!arcanum) throw new Error(`Аркан ${number} не найден — выполните pnpm content:build`);
  return arcanum;
}

export function arcanumBySlug(slug: string): Arcanum | undefined {
  return ARCANA.find((item) => item.slug === slug);
}
```

`packages/content/src/build.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { collectArcana } from "../scripts/build-arcana.mjs";
import raw from "./generated/arcana.json";
import { loadArcana } from "./index";
import { sampleArcanumSource } from "./testing";

describe("collectArcana", () => {
  test("reads only markdown files, sorted, with normalized line endings", () => {
    const dir = mkdtempSync(join(tmpdir(), "arcana-"));
    writeFileSync(join(dir, "02-b.md"), "two\r\n");
    writeFileSync(join(dir, "01-a.md"), "one");
    writeFileSync(join(dir, "notes.txt"), "skip");

    expect(collectArcana(dir)).toEqual({ "01-a": "one", "02-b": "two" });
  });

  test("the committed arcana.json matches the markdown files — run pnpm content:build after editing texts", () => {
    const dir = fileURLToPath(new URL("../arcana", import.meta.url));
    expect(raw).toEqual(collectArcana(dir));
  });
});

describe("loadArcana", () => {
  test("parses every source and keeps the file name for error messages", () => {
    const entries = loadArcana({ "11-sila": sampleArcanumSource() });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.file).toBe("11-sila.md");
    expect(entries[0]?.arcanum.name).toBe("Сила");
  });
});
```

Run: `pnpm content:build && pnpm vitest run --project content` — Expected: PASS; `arcana.json` остаётся `{}` (текстов ещё нет).

- [ ] **Step 8: Типы и весь набор тестов**

Run: `pnpm typecheck && pnpm test`
Expected: PASS. Если `tsc` ругается на импорт `.mjs` из теста — проверить, что `scripts/*.d.mts` включён в `tsconfig.json` пакета (Step 1).

- [ ] **Step 9: Коммит**

```bash
git add packages/content package.json vitest.config.ts apps/web/package.json apps/web/next.config.ts pnpm-lock.yaml
git commit -m "feat(content): arcana content package with parser, checks and JSON build"
```
