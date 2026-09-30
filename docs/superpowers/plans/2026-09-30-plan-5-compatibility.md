# План 5 — Совместимость по двум датам (с PDF)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Открыть практику «Совместимость»: калькулятор по двум датам с арканом пары, сопоставлением двух матриц, приглашением партнёру (общая ссылка без данных) и бесплатным PDF.

**Architecture:** Расчёт — чистая функция в `packages/core` поверх `calculateMatrix`; 22 текста «Союз» — отдельный файл контента с собственной точкой входа (как `lila`). Результат считается и показывается в браузере, даты не пишутся ни в адрес, ни в хранилище браузера, ни на сервер. Единственная передача дат на сервер — `POST /api/compat/pdf` в момент скачивания: сервер строит PDF в памяти и ничего не сохраняет и не логирует; сборщик PDF получает уже готовый расчёт (номера арканов), а не даты.

**Tech Stack:** TypeScript, Next.js 16, pdfkit, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-compatibility-design.md`. Основа — `packages/core/src/matrix.ts`, `packages/content/src/lila*.ts` (образец конвейера текстов), `apps/web/src/server/lila-pdf.ts` и `pdf-common.ts` (образец PDF), `apps/web/src/components/matrix/*` (образец калькулятора). Ветка `feat/compat` от свежего `master`.

## Global Constraints

- Даты рождения не попадают в адрес страницы, `localStorage`/`sessionStorage`, базу, логи и очереди. Разрешена одна передача: тело `POST /api/compat/pdf`, и только по нажатию «Скачать PDF». В PDF дат нет — только арканы.
- Аркан пары — `reduceToArcanum(E₁ + E₂)`; «вы» — первый человек; функция симметрична по аркану пары.
- Язык: «вы», нейтральный род, гипотезы, без предсказаний, без обещаний отношений, без диагнозов и запугивания; тексты проходят `findStopPhrases`.
- Внешние CDN, шрифты и скрипты не подключать (152-ФЗ).
- Мобильные в приоритете: на 375 px без горизонтальной прокрутки, текст не мельче 14 px, зоны нажатия не меньше 44 px; фокус виден; анимации с `prefers-reduced-motion`.
- Тексты интерфейса дословно (и в AGENTS.md): `<h1>` «Совместимость по дате рождения» (один на странице); поля «Ваша дата рождения», «Дата рождения партнёра»; кнопки «Рассчитать совместимость», «Отправить партнёру», «Скачать PDF», «Пересчитать»; отметка «Ссылка скопирована.» (`role="status"`); ошибки — `role="alert"`; блоки «Аркан вашей пары», «Вы и партнёр», «Где вы похожи и где различаетесь».
- Общая ссылка приглашения: `https://tvoy-orakul.ru/sovmestimost?utm_source=share&utm_medium=partner` (адрес сайта — `SITE_URL`); текст «Давай проверим нашу совместимость по дате рождения».
- Цели Метрики: `compat_calculated`, `compat_share`, `compat_pdf`.
- Покрытие ≥ 80 %. Полного двойного ревью не требуется (нет оплаты, данных на сервере и игровой логики); маршрут PDF проходит самопроверку по списку в Task 6.
- Гейты владелицы перед PR: (1) вычитка 22 текстов «Союз»; (2) тексты пояснений и FAQ на странице; (3) строка в политике обработки данных.

## Структура файлов

| Файл | Ответственность |
|---|---|
| `packages/core/src/compatibility.ts` (+ test), `index.ts` | Расчёт пары |
| `packages/content/compat-arcana.md`, `src/compat.ts`, `src/compat-check.ts`, `src/compat-unions.ts` (+ tests), `scripts/build-arcana.mjs`, `package.json` | Тексты «Союз»: разбор, проверки, точка входа `@oracle/content/compat` |
| `apps/web/src/lib/compat.ts` (+ test) | Путь, ссылка приглашения, сводка «похожи/различаетесь» |
| `apps/web/src/components/compat/CompatCalculator.tsx`, `CompatResult.tsx`, `CompatShare.tsx`, `CompatGuide.tsx` | Экран калькулятора |
| `apps/web/src/app/sovmestimost/page.tsx` | Страница |
| `apps/web/src/server/compat-pdf.ts`, `compat-service.ts` (+ tests), `rate-limit.ts` | PDF и разбор запроса |
| `apps/web/src/app/api/compat/pdf/route.ts` | Маршрут PDF |
| `apps/web/src/lib/practices.ts`, `analytics.ts`, `seo.ts`, компоненты матрицы | Связки с сайтом |
| `apps/web/src/app/privacy/page.tsx`, `lib/legal.ts`, `AGENTS.md` | Документы |
| `e2e/compat.spec.ts`, `e2e/portrait.spec.ts`, `e2e/launch.spec.ts` | Сквозные проверки |

---

### Task 1: Ядро — расчёт пары

**Files:**
- Create: `packages/core/src/compatibility.ts`, `packages/core/src/compatibility.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Produces: `KEY_POINTS = ["personality", "center", "task"] as const`, `type KeyPoint`, `type CompatPerson = Readonly<Record<KeyPoint, number>>`, `type Compatibility = { pair: number; people: readonly [CompatPerson, CompatPerson]; sameAtPoint: readonly KeyPoint[]; sharedArcana: readonly number[] }`, `calculateCompatibility(a: BirthDate, b: BirthDate): Compatibility`.

- [ ] **Step 1: Тесты**

`packages/core/src/compatibility.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { calculateCompatibility } from "./compatibility";

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe("calculateCompatibility", () => {
  test("takes the key points of each person and sums the centers into the pair arcanum", () => {
    // 18.11.1988: личность 18, центр 11, задача 10. 01.01.2000: личность 1, центр 8, задача 4
    const result = calculateCompatibility(d(1988, 11, 18), d(2000, 1, 1));
    expect(result.people).toEqual([
      { personality: 18, center: 11, task: 10 },
      { personality: 1, center: 8, task: 4 },
    ]);
    expect(result.pair).toBe(19);
    expect(result.sameAtPoint).toEqual([]);
    expect(result.sharedArcana).toEqual([]);
  });

  test("the pair arcanum does not depend on who is first, but the people keep their order", () => {
    const ab = calculateCompatibility(d(1988, 11, 18), d(2000, 1, 1));
    const ba = calculateCompatibility(d(2000, 1, 1), d(1988, 11, 18));
    expect(ba.pair).toBe(ab.pair);
    expect(ba.people[0]).toEqual(ab.people[1]);
  });

  test("the same date twice matches at every key point and folds 22 as it is", () => {
    const result = calculateCompatibility(d(1988, 11, 18), d(1988, 11, 18));
    expect(result.sameAtPoint).toEqual(["personality", "center", "task"]);
    expect(result.sharedArcana).toEqual([10, 11, 18]);
    expect(result.pair).toBe(22);
  });

  test("lists the shared arcana sorted and without repeats, and every shared arcanum really belongs to both people", () => {
    const dates = [d(1988, 11, 18), d(2000, 1, 1), d(1999, 9, 29), d(1955, 5, 22), d(1990, 10, 10), d(2010, 2, 20)];
    for (const first of dates) {
      for (const second of dates) {
        const { people, sharedArcana } = calculateCompatibility(first, second);
        expect(new Set(sharedArcana).size).toBe(sharedArcana.length);
        expect([...sharedArcana]).toEqual([...sharedArcana].sort((x, y) => x - y));
        for (const arcanum of sharedArcana) {
          expect(Object.values(people[0])).toContain(arcanum);
          expect(Object.values(people[1])).toContain(arcanum);
        }
      }
    }
  });

  test("always gives a pair arcanum from 1 to 22, even for the extreme centers", () => {
    for (const [year, month, day] of [[1900, 1, 1], [2026, 12, 31], [1999, 9, 29], [1955, 5, 22]] as const) {
      const { pair } = calculateCompatibility(d(year, month, day), d(2026, 12, 31));
      expect(pair).toBeGreaterThanOrEqual(1);
      expect(pair).toBeLessThanOrEqual(22);
    }
  });
});
```

(Пример 01.01.2000: A=1, B=1, C=2 (сумма цифр года 2), D=1+1+2=4, E=1+1+2+4=8; 11+8=19.)

Run: `pnpm vitest run packages/core/src/compatibility.test.ts` → FAIL (`Cannot find module`).

- [ ] **Step 2: Реализовать**

`packages/core/src/compatibility.ts`:

```ts
import type { BirthDate } from "./birth-date";
import { calculateMatrix, reduceToArcanum, type Matrix } from "./matrix";

export const KEY_POINTS = ["personality", "center", "task"] as const;
export type KeyPoint = (typeof KEY_POINTS)[number];
// Личность — точка A (день), центр — E, задача — D
export type CompatPerson = Readonly<Record<KeyPoint, number>>;

export type Compatibility = {
  pair: number;
  people: readonly [CompatPerson, CompatPerson];
  sameAtPoint: readonly KeyPoint[];
  sharedArcana: readonly number[];
};

const personOf = (matrix: Matrix): CompatPerson => ({ personality: matrix.A, center: matrix.E, task: matrix.D });

export function calculateCompatibility(a: BirthDate, b: BirthDate): Compatibility {
  const matrixA = calculateMatrix(a);
  const matrixB = calculateMatrix(b);
  const first = personOf(matrixA);
  const second = personOf(matrixB);
  const firstNumbers = new Set(Object.values(first));
  const shared = [...new Set(Object.values(second))].filter((number) => firstNumbers.has(number)).sort((x, y) => x - y);
  return {
    pair: reduceToArcanum(matrixA.E + matrixB.E),
    people: [first, second],
    sameAtPoint: KEY_POINTS.filter((point) => first[point] === second[point]),
    sharedArcana: shared,
  };
}
```

`packages/core/src/index.ts` — `export * from "./compatibility";`

- [ ] **Step 3: Запустить и закоммитить**

Run: `pnpm vitest run packages/core && pnpm --filter @oracle/core typecheck`
Expected: PASS. (Если пример 01.01.2000 даёт не 8/4 — проверить расчёт вручную по `matrix.ts` и поправить ожидание, а не код.)

```bash
git add packages/core
git commit -m "feat(core): compatibility of two birth dates via the matrix"
```

---

### Task 2: Контент — разбор и проверки текстов «Союз»

**Files:**
- Create: `packages/content/src/compat.ts`, `compat-check.ts`, `compat-unions.ts`, `compat.test.ts`, `compat-check.test.ts`
- Modify: `packages/content/scripts/build-arcana.mjs`, `packages/content/package.json`, `packages/content/src/index.ts` (только если там нужен экспорт типа)

**Interfaces:**
- Consumes: `ARCANA_COUNT` (core), `findStopPhrases` (`check.ts`).
- Produces: `type CompatUnion = { number: number; name: string; essence: string; gives: string; attention: string; question: string }`, `parseCompatUnions(source: string): CompatUnion[]`, `checkCompatUnions(unions, arcanaNames): string[]`, `COMPAT_UNIONS`, `compatUnionByNumber(n)` (из `@oracle/content/compat`).

- [ ] **Step 1: Тесты разбора и проверок**

`packages/content/src/compat.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { CompatFormatError, parseCompatUnions } from "./compat";

const ONE = `## 7. Колесница
Суть союза: Вы вместе движетесь к общей цели.
Что даёт: Общий курс и готовность держаться его.
Где стоит присмотреться: К тому, кто из вас задаёт темп.
Вопрос для двоих: Куда мы на самом деле хотим двигаться вместе?
`;

describe("parseCompatUnions", () => {
  test("reads the heading and the four fields", () => {
    expect(parseCompatUnions(ONE)).toEqual([
      { number: 7, name: "Колесница", essence: "Вы вместе движетесь к общей цели.", gives: "Общий курс и готовность держаться его.", attention: "К тому, кто из вас задаёт темп.", question: "Куда мы на самом деле хотим двигаться вместе?" },
    ]);
  });

  test("sorts by number and rejects a missing field, an unknown line, a repeat and text before the first heading", () => {
    const two = `${ONE.replace("7. Колесница", "9. Отшельник")}\n${ONE}`;
    expect(parseCompatUnions(two).map((u) => u.number)).toEqual([7, 9]);
    expect(() => parseCompatUnions(ONE.replace(/Что даёт:.*\n/, ""))).toThrow(CompatFormatError);
    expect(() => parseCompatUnions(`${ONE}Лишняя строка\n`)).toThrow(CompatFormatError);
    expect(() => parseCompatUnions(`${ONE}\n${ONE}`)).toThrow(/повторя/);
    expect(() => parseCompatUnions(`вступление\n${ONE}`)).toThrow(CompatFormatError);
    expect(() => parseCompatUnions(ONE.replace("7.", "23."))).toThrow(/от 1 до 22/);
  });
});
```

`packages/content/src/compat-check.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { checkCompatUnions } from "./compat-check";
import type { CompatUnion } from "./compat";

const names = new Map(Array.from({ length: 22 }, (_, i) => [i + 1, `Аркан ${i + 1}`] as const));
const text = (n: number) => "Слово ".repeat(n).trim();
const union = (number: number, patch: Partial<CompatUnion> = {}): CompatUnion => ({
  number,
  name: `Аркан ${number}`,
  essence: text(30),
  gives: text(20),
  attention: text(20),
  question: `${text(6)}?`,
  ...patch,
});
const full = () => Array.from({ length: 22 }, (_, i) => union(i + 1));

describe("checkCompatUnions", () => {
  test("accepts a full valid set", () => {
    expect(checkCompatUnions(full(), names)).toEqual([]);
  });

  test("reports a missing arcanum, a wrong name, short and long fields, a question without «?» and stop phrases", () => {
    const set = full().slice(1);
    expect(checkCompatUnions(set, names).join("\n")).toMatch(/союзов 21, нужно 22/);
    expect(checkCompatUnions([union(1, { name: "Другое" }), ...full().slice(1)], names).join("\n")).toMatch(/имя аркана/);
    expect(checkCompatUnions([union(1, { essence: "Коротко." }), ...full().slice(1)], names).join("\n")).toMatch(/Суть союза/);
    expect(checkCompatUnions([union(1, { gives: text(200) }), ...full().slice(1)], names).join("\n")).toMatch(/Что даёт/);
    expect(checkCompatUnions([union(1, { question: text(6) }), ...full().slice(1)], names).join("\n")).toMatch(/«\?»/);
    expect(checkCompatUnions([union(1, { attention: `${text(20)} Вас ждёт успех.` }), ...full().slice(1)], names).join("\n")).toMatch(/запрещённые обороты/);
  });
});
```

Run: `pnpm vitest run packages/content/src/compat` → FAIL.

- [ ] **Step 2: Реализовать разбор**

`packages/content/src/compat.ts`:

```ts
import { ARCANA_COUNT } from "@oracle/core";

export type CompatUnion = {
  readonly number: number;
  readonly name: string;
  readonly essence: string;
  readonly gives: string;
  readonly attention: string;
  readonly question: string;
};

export class CompatFormatError extends Error {}

const HEADING = /^(\d+)\.\s+(.+)$/;
const FIELD = /^(Суть союза|Что даёт|Где стоит присмотреться|Вопрос для двоих):\s*(.+)$/;
const FIELDS = ["Суть союза", "Что даёт", "Где стоит присмотреться", "Вопрос для двоих"] as const;

function parseBlock(block: string): CompatUnion {
  const [heading = "", ...lines] = block.split("\n");
  const match = HEADING.exec(heading.trim());
  if (!match) throw new CompatFormatError(`заголовок должен быть «N. Название»: «${heading.trim()}»`);
  const number = Number(match[1]);
  const fail = (message: string): never => {
    throw new CompatFormatError(`союз ${number}: ${message}`);
  };
  if (number < 1 || number > ARCANA_COUNT) fail(`номер должен быть от 1 до ${ARCANA_COUNT}`);
  const fields = new Map<string, string>();
  for (const line of lines.map((item) => item.trim()).filter(Boolean)) {
    const field = FIELD.exec(line);
    if (!field) fail(`неизвестная строка «${line}»`);
    const [, key = "", value = ""] = field!;
    if (fields.has(key)) fail(`поле «${key}» повторяется`);
    fields.set(key, value.trim());
  }
  for (const key of FIELDS) if (!fields.get(key)) fail(`нет поля «${key}»`);
  return {
    number,
    name: match[2]!.trim(),
    essence: fields.get("Суть союза")!,
    gives: fields.get("Что даёт")!,
    attention: fields.get("Где стоит присмотреться")!,
    question: fields.get("Вопрос для двоих")!,
  };
}

export function parseCompatUnions(source: string): CompatUnion[] {
  const [before, ...blocks] = source.replace(/\r\n/g, "\n").split(/^## /m);
  if (before?.trim()) throw new CompatFormatError("текст до первого союза");
  const unions = blocks.map(parseBlock);
  const seen = new Set<number>();
  for (const union of unions) {
    if (seen.has(union.number)) throw new CompatFormatError(`союз ${union.number} повторяется`);
    seen.add(union.number);
  }
  return unions.sort((a, b) => a.number - b.number);
}
```

`packages/content/src/compat-check.ts`:

```ts
import { ARCANA_COUNT } from "@oracle/core";
import { findStopPhrases } from "./check";
import type { CompatUnion } from "./compat";

const ESSENCE_CHARS = { min: 150, max: 500 } as const;
const GIVES_CHARS = { min: 100, max: 400 } as const;
const ATTENTION_CHARS = { min: 100, max: 400 } as const;
const QUESTION_CHARS = { min: 20, max: 240 } as const;

const inRange = (text: string, range: { min: number; max: number }) => text.length >= range.min && text.length <= range.max;

function checkUnion(union: CompatUnion, arcanaNames: ReadonlyMap<number, string>): string[] {
  const errors: string[] = [];
  const at = (message: string) => errors.push(`союз ${union.number}: ${message}`);
  if (arcanaNames.get(union.number) !== union.name) at(`имя аркана должно быть «${arcanaNames.get(union.number)}», в тексте «${union.name}»`);
  if (!inRange(union.essence, ESSENCE_CHARS)) at(`«Суть союза» — от ${ESSENCE_CHARS.min} до ${ESSENCE_CHARS.max} знаков, сейчас ${union.essence.length}`);
  if (!inRange(union.gives, GIVES_CHARS)) at(`«Что даёт» — от ${GIVES_CHARS.min} до ${GIVES_CHARS.max} знаков, сейчас ${union.gives.length}`);
  if (!inRange(union.attention, ATTENTION_CHARS)) at(`«Где стоит присмотреться» — от ${ATTENTION_CHARS.min} до ${ATTENTION_CHARS.max} знаков, сейчас ${union.attention.length}`);
  if (!union.question.endsWith("?")) at("«Вопрос для двоих» должен заканчиваться знаком «?»");
  if (!inRange(union.question, QUESTION_CHARS)) at(`«Вопрос для двоих» — от ${QUESTION_CHARS.min} до ${QUESTION_CHARS.max} знаков`);
  const stops = findStopPhrases([union.name, union.essence, union.gives, union.attention, union.question].join("\n"));
  if (stops.length > 0) at(`запрещённые обороты — ${stops.join(", ")}`);
  return errors;
}

export function checkCompatUnions(unions: readonly CompatUnion[], arcanaNames: ReadonlyMap<number, string>): string[] {
  const errors: string[] = [];
  if (unions.length !== ARCANA_COUNT) errors.push(`союзов ${unions.length}, нужно ${ARCANA_COUNT}`);
  for (let number = 1; number <= ARCANA_COUNT; number += 1) {
    if (!unions.some((union) => union.number === number)) errors.push(`союз ${number} отсутствует`);
  }
  for (const union of unions) errors.push(...checkUnion(union, arcanaNames));
  return errors;
}
```

- [ ] **Step 3: Точка входа и сборка**

`packages/content/src/compat-unions.ts`:

```ts
import raw from "./generated/compat.json";
import { parseCompatUnions, type CompatUnion } from "./compat";

export type { CompatUnion } from "./compat";

// Собранные тексты: pnpm content:build → src/generated/compat.json. Отдельная точка входа, как у Лилы
export const COMPAT_UNIONS: readonly CompatUnion[] = parseCompatUnions(raw.unions);

export function compatUnionByNumber(number: number): CompatUnion {
  const union = COMPAT_UNIONS.find((item) => item.number === number);
  if (!union) throw new Error(`Союз ${number} не найден — выполните pnpm content:build`);
  return union;
}
```

`packages/content/package.json` — в `exports` добавить `"./compat": "./src/compat-unions.ts"`.

`packages/content/scripts/build-arcana.mjs` — по образцу `collectLila`:

```js
export function collectCompat(file) {
  return { unions: readText(file) };
}
// ... в блоке import.meta.main:
write(join(root, "src", "generated", "compat.json"), collectCompat(join(root, "compat-arcana.md")));
```

Сборка не пройдёт, пока нет файла — он появляется в Task 3, поэтому шаги 1–2 запускают только тесты разбора.

- [ ] **Step 4: Запустить и закоммитить**

Run: `pnpm vitest run packages/content/src/compat.test.ts packages/content/src/compat-check.test.ts && pnpm --filter @oracle/content typecheck`
Expected: PASS (typecheck пройдёт после Task 3, когда появится `generated/compat.json`; до этого проверить только тесты).

```bash
git add packages/content
git commit -m "feat(content): parser and checks for the pair (union) texts"
```

---

### Task 3: Контент — 22 текста «Союз» (гейт: вычитка владелицы)

**Files:**
- Create: `packages/content/compat-arcana.md`, `packages/content/src/generated/compat.json` (генерируется)
- Create: `packages/content/src/compat-unions.test.ts`

**Interfaces:**
- Produces: заполненный `COMPAT_UNIONS` (22 записи).

- [ ] **Step 1: Написать 22 текста**

Файл `packages/content/compat-arcana.md` по формату из Task 2: для каждого аркана 1–22 блок `## N. Название` (названия — из `packages/content/arcana/NN-*.md`, точное совпадение) и четыре строки `Суть союза:`, `Что даёт:`, `Где стоит присмотреться:`, `Вопрос для двоих:` (вопрос заканчивается «?»). Длины: суть 150–500 знаков, «Что даёт» и «Где стоит присмотреться» по 100–400, вопрос 20–240. Тон: «вы», гипотезы («может», «часто», «стоит заметить»), нейтральный род, нет предсказаний, сроков, обещаний отношений; опора и точка внимания в каждом. Черновики пишет исполнитель по описаниям арканов (раздел «В отношениях» и «Суть») — не выдумывая значений, которых нет в текстах арканов.

- [ ] **Step 2: Тест полноты**

`packages/content/src/compat-unions.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { ARCANA } from "./arcana";
import { checkCompatUnions } from "./compat-check";
import { COMPAT_UNIONS, compatUnionByNumber } from "./compat-unions";

describe("compat unions", () => {
  test("are all 22, named as the arcana and pass the checks", () => {
    const names = new Map(ARCANA.map((arcanum) => [arcanum.number, arcanum.name] as const));
    expect(checkCompatUnions(COMPAT_UNIONS, names)).toEqual([]);
    expect(compatUnionByNumber(7).name).toBe("Колесница");
  });
});
```

- [ ] **Step 3: Собрать и запустить**

Run: `pnpm content:build && pnpm vitest run packages/content && pnpm --filter @oracle/content typecheck`
Expected: PASS; в выводе `written: …/generated/compat.json`.

- [ ] **Step 4: Коммит и гейт**

```bash
git add packages/content
git commit -m "content: 22 union texts for the pair arcanum (draft for review)"
```

**Гейт владелицы:** файл отправляется на вычитку; правки вносятся в `compat-arcana.md`, затем `pnpm content:build`. Дальше задачи идут параллельно вычитке, но PR открывается только после «Вычитка — да».

---

### Task 4: Логика экрана — ссылка приглашения и сводка

**Files:**
- Create: `apps/web/src/lib/compat.ts`, `apps/web/src/lib/compat.test.ts`
- Modify: `apps/web/src/lib/analytics.ts`, `apps/web/src/lib/analytics.test.ts`

**Interfaces:**
- Consumes: `Compatibility` (core), `SITE_URL` (`lib/site.ts`).
- Produces: `COMPAT_PATH = "/sovmestimost"`, `COMPAT_SHARE_URL`, `COMPAT_SHARE_TEXT`, `compatSummary(compat: Compatibility, nameOf: (n: number) => string): string[]`, `POINT_LABELS`.

- [ ] **Step 1: Цели Метрики**

`apps/web/src/lib/analytics.ts` — в `GOALS` добавить `"compat_calculated", "compat_share", "compat_pdf"`; в `analytics.test.ts` — ожидаемый список (в конец).

- [ ] **Step 2: Тесты**

`apps/web/src/lib/compat.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { COMPAT_PATH, COMPAT_SHARE_TEXT, COMPAT_SHARE_URL, compatSummary, POINT_LABELS } from "./compat";

const nameOf = (n: number) => `Аркан ${n}`;
const person = (personality: number, center: number, task: number) => ({ personality, center, task });

describe("share link", () => {
  test("is the calculator with source marks and carries no dates", () => {
    expect(COMPAT_SHARE_URL).toMatch(new RegExp(`${COMPAT_PATH}\\?utm_source=share&utm_medium=partner$`));
    expect(COMPAT_SHARE_URL).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(COMPAT_SHARE_TEXT).toBe("Давай проверим нашу совместимость по дате рождения");
  });
});

describe("compatSummary", () => {
  test("names each shared key point", () => {
    const text = compatSummary({ pair: 5, people: [person(1, 2, 3), person(1, 2, 9)], sameAtPoint: ["personality", "center"], sharedArcana: [1, 2] }, nameOf).join(" ");
    expect(text).toContain(`${POINT_LABELS.personality.toLowerCase()}`);
    expect(text).toContain("Аркан 2");
  });

  test("mentions shared arcana that sit at different points", () => {
    const text = compatSummary({ pair: 5, people: [person(1, 2, 3), person(3, 8, 9)], sameAtPoint: [], sharedArcana: [3] }, nameOf).join(" ");
    expect(text).toContain("Аркан 3");
    expect(text).toContain("разных точках");
  });

  test("says plainly when nothing matches, without judging", () => {
    const lines = compatSummary({ pair: 5, people: [person(1, 2, 3), person(4, 5, 6)], sameAtPoint: [], sharedArcana: [] }, nameOf);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/не пересекаются/);
    expect(lines[0]).toMatch(/не хорошо и не плохо/);
  });
});
```

Run: `pnpm vitest run apps/web/src/lib/compat.test.ts` → FAIL.

- [ ] **Step 3: Реализовать**

`apps/web/src/lib/compat.ts`:

```ts
import { KEY_POINTS, type Compatibility, type KeyPoint } from "@oracle/core";
import { SITE_URL } from "./site";

export const COMPAT_PATH = "/sovmestimost";
// Ссылка приглашения общая: в ней нет ни дат, ни результата
export const COMPAT_SHARE_URL = `${SITE_URL}${COMPAT_PATH}?utm_source=share&utm_medium=partner`;
export const COMPAT_SHARE_TEXT = "Давай проверим нашу совместимость по дате рождения";

export const POINT_LABELS: Readonly<Record<KeyPoint, string>> = { personality: "Личность", center: "Центр", task: "Задача" };

// Фразы фиксированные: сводка не выносит оценок, а только называет совпадения
export function compatSummary(compat: Compatibility, nameOf: (arcanum: number) => string): string[] {
  const lines: string[] = [];
  for (const point of KEY_POINTS) {
    if (!compat.sameAtPoint.includes(point)) continue;
    const arcanum = compat.people[0][point];
    lines.push(`У вас совпадает ${POINT_LABELS[point].toLowerCase()}: аркан ${arcanum} «${nameOf(arcanum)}».`);
  }
  const elsewhere = compat.sharedArcana.filter((arcanum) => !compat.sameAtPoint.some((point) => compat.people[0][point] === arcanum));
  if (elsewhere.length > 0) {
    lines.push(`Есть общие арканы в разных точках: ${elsewhere.map((arcanum) => `${arcanum} «${nameOf(arcanum)}»`).join(", ")}. Возможно, у вас эта тема проявляется по-разному.`);
  }
  if (lines.length === 0) {
    lines.push("Ваши арканы не пересекаются. Это не хорошо и не плохо: скорее повод узнать друг у друга то, чего нет у вас самих.");
  }
  return lines;
}
```

- [ ] **Step 4: Запустить и закоммитить**

Run: `pnpm vitest run apps/web/src/lib && pnpm --filter @oracle/web typecheck`
Expected: PASS.

```bash
git add apps/web/src/lib
git commit -m "feat(web): compatibility helpers: share link, summary, goals"
```

---

### Task 5: Экран — калькулятор, результат, приглашение, страница

**Files:**
- Create: `apps/web/src/components/compat/CompatCalculator.tsx`, `CompatResult.tsx`, `CompatShare.tsx`, `CompatGuide.tsx`
- Create: `apps/web/src/app/sovmestimost/page.tsx`
- Modify: `apps/web/src/lib/practices.ts` (+ test), `apps/web/src/lib/seo.ts`, `apps/web/src/components/matrix/MatrixCalculator.tsx`, `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: Task 1, 3, 4; `parseBirthDate`, `toIsoDate`, `formatBirthDateRu` (core); `arcanumByNumber`, `arcanumImage`, `arcanumPath`; `loadPortrait`, `currentUser`; `jsonLdScript`, `publicMetadata`.
- Produces: страница `/sovmestimost`; компонент `CompatCalculator` (`{ profileDate: string | null }`); `COMPAT_FAQ`/`compatFaqJsonLd()`.

- [ ] **Step 1: Кнопка «Отправить партнёру»**

`apps/web/src/components/compat/CompatShare.tsx`:

```tsx
"use client";

import { useState } from "react";
import { reachGoal } from "@/lib/analytics";
import { COMPAT_SHARE_TEXT, COMPAT_SHARE_URL } from "@/lib/compat";

export function CompatShare() {
  const [copied, setCopied] = useState(false);

  async function share() {
    reachGoal("compat_share");
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Совместимость по дате рождения", text: COMPAT_SHARE_TEXT, url: COMPAT_SHARE_URL });
        return;
      } catch (error) {
        // Человек закрыл окно «Поделиться» — это не ошибка
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${COMPAT_SHARE_TEXT}: ${COMPAT_SHARE_URL}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button type="button" className="button button--ghost" onClick={() => void share()}>
        Отправить партнёру
      </button>
      {copied && <span role="status">Ссылка скопирована.</span>}
    </>
  );
}
```

- [ ] **Step 2: Результат**

`apps/web/src/components/compat/CompatResult.tsx` (серверный/презентационный, принимает готовый расчёт):

```tsx
import { arcanumByNumber } from "@oracle/content";
import { compatUnionByNumber } from "@oracle/content/compat";
import { KEY_POINTS, type Compatibility } from "@oracle/core";
import Image from "next/image";
import Link from "next/link";
import type { Ref } from "react";
import { arcanumImage, arcanumPath } from "@/lib/arcana-paths";
import { compatSummary, POINT_LABELS } from "@/lib/compat";

type Props = { compat: Compatibility; headingRef?: Ref<HTMLHeadingElement>; actions: React.ReactNode };

const nameOf = (number: number) => arcanumByNumber(number).name;

function Person({ title, person }: { title: string; person: Compatibility["people"][number] }) {
  return (
    <section className="card stack compat-person" aria-label={title}>
      <h3>{title}</h3>
      {KEY_POINTS.map((point) => {
        const arcanum = arcanumByNumber(person[point]);
        return (
          <div key={point} className="stack compat-person__point">
            <p className="eyebrow">{POINT_LABELS[point]}</p>
            <p>
              <Link href={arcanumPath(arcanum)}>
                {arcanum.number} · {arcanum.name}
              </Link>
            </p>
            {arcanum.love.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        );
      })}
    </section>
  );
}

export function CompatResult({ compat, headingRef, actions }: Props) {
  const arcanum = arcanumByNumber(compat.pair);
  const union = compatUnionByNumber(compat.pair);
  return (
    <section className="stack compat-result" aria-labelledby="compat-pair-title">
      <h2 id="compat-pair-title" ref={headingRef} tabIndex={-1}>
        Аркан вашей пары
      </h2>
      <div className="card stack compat-pair">
        <Image className="compat-pair__art" src={arcanumImage(arcanum, "card")} alt="" width={480} height={480} unoptimized />
        <p className="eyebrow">Аркан {arcanum.number}</p>
        <p className="display compat-pair__name">{arcanum.name}</p>
        <p>{union.essence}</p>
        <p>
          <strong>Что даёт: </strong>
          {union.gives}
        </p>
        <p>
          <strong>Где стоит присмотреться: </strong>
          {union.attention}
        </p>
        <p className="lila-turn__question">
          <strong>Вопрос для двоих:</strong> {union.question}
        </p>
      </div>

      <h2>Вы и партнёр</h2>
      <div className="compat-people">
        <Person title="Вы" person={compat.people[0]} />
        <Person title="Партнёр" person={compat.people[1]} />
      </div>

      <section className="card stack" aria-labelledby="compat-summary-title">
        <h2 id="compat-summary-title">Где вы похожи и где различаетесь</h2>
        {compatSummary(compat, nameOf).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>
      <div className="row compat-actions">{actions}</div>
    </section>
  );
}
```

- [ ] **Step 3: Калькулятор**

`apps/web/src/components/compat/CompatCalculator.tsx`:

```tsx
"use client";

import { calculateCompatibility, parseBirthDate, toIsoDate, type Compatibility } from "@oracle/core";
import { useRef, useState, type FormEvent } from "react";
import { reachGoal } from "@/lib/analytics";
import { CompatResult } from "./CompatResult";
import { CompatShare } from "./CompatShare";

const DATE_ERROR = "Проверьте даты: обе должны быть настоящими, не раньше 1900 года и не в будущем.";
const PDF_ERROR = "Не получилось собрать PDF. Попробуйте ещё раз чуть позже.";

type Dates = { a: string; b: string };

// Даты хранятся только в состоянии страницы: ни в адресе, ни в localStorage, ни на сервере (кроме запроса PDF)
export function CompatCalculator({ profileDate }: { profileDate: string | null }) {
  const [a, setA] = useState(profileDate ?? "");
  const [b, setB] = useState("");
  const [dates, setDates] = useState<Dates | null>(null);
  const [compat, setCompat] = useState<Compatibility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const aRef = useRef<HTMLInputElement>(null);
  const bRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Значения читаем из полей: их могли ввести до гидратации
    const rawA = aRef.current?.value ?? a;
    const rawB = bRef.current?.value ?? b;
    setA(rawA);
    setB(rawB);
    const now = new Date();
    const first = parseBirthDate(rawA, now);
    const second = parseBirthDate(rawB, now);
    if (!first || !second) {
      setError(DATE_ERROR);
      setDates(null);
      setCompat(null);
      return;
    }
    setError(null);
    setDates({ a: toIsoDate(first), b: toIsoDate(second) });
    setCompat(calculateCompatibility(first, second));
    reachGoal("compat_calculated");
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: false }));
  }

  async function downloadPdf() {
    if (!dates || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/compat/pdf", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(dates) });
      if (!response.ok) throw new Error(String(response.status));
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "sovmestimost.pdf";
      link.click();
      URL.revokeObjectURL(url);
      reachGoal("compat_pdf");
    } catch {
      setError(PDF_ERROR);
    }
    setBusy(false);
  }

  function reset() {
    setDates(null);
    setCompat(null);
    setB("");
    setError(null);
  }

  return (
    <>
      <form className="card stack compat-form" onSubmit={calculate} noValidate>
        <div className="field">
          <label htmlFor="compat-date-a">Ваша дата рождения</label>
          <input ref={aRef} id="compat-date-a" className="input" type="date" min="1900-01-01" value={a} onChange={(event) => setA(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="compat-date-b">Дата рождения партнёра</label>
          <input ref={bRef} id="compat-date-b" className="input" type="date" min="1900-01-01" value={b} onChange={(event) => setB(event.target.value)} />
        </div>
        <button type="submit" className="button button--lavender">
          Рассчитать совместимость
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <p className="muted">Считается в вашем браузере. Дата партнёра нигде не сохраняется.</p>
      </form>

      {compat && (
        <CompatResult
          compat={compat}
          headingRef={headingRef}
          actions={
            <>
              <button type="button" className="button button--lavender" disabled={busy} onClick={() => void downloadPdf()}>
                Скачать PDF
              </button>
              <CompatShare />
              <button type="button" className="button button--ghost" onClick={reset}>
                Пересчитать
              </button>
            </>
          }
        />
      )}
    </>
  );
}
```

- [ ] **Step 4: Пояснения и FAQ, страница, связки**

`apps/web/src/components/compat/CompatGuide.tsx` — по образцу `components/matrix/MatrixGuide.tsx`: экспорт `COMPAT_FAQ` (массив `{ question, answer }`), `compatFaqJsonLd()` (`FAQPage`, как `matrixFaqJsonLd`) и компонент `CompatGuide` с блоками «Как считается совместимость» и «Частые вопросы». Тексты (на вычитку владелицы):

- Как считается: «Для каждого из вас считается матрица судьбы по дате рождения. Центры двух матриц складываются, и сумма приводится к номеру аркана от 1 до 22 — это аркан вашей пары. Дополнительно мы сопоставляем личность, центр и задачу каждого из вас: где арканы совпадают и где различаются. Это символический способ поговорить об отношениях, а не оценка и не прогноз.»
- «Нужна ли регистрация?» — «Нет. Расчёт делается в браузере. Если вы вошли через VK ID, ваша дата подставится из портрета.»
- «Сохраняются ли даты?» — «Нет. Даты остаются на вашем устройстве. Единственный случай, когда они отправляются на сервер, — кнопка «Скачать PDF»: сервер собирает файл и сразу забывает даты. В самом файле дат нет, только арканы.»
- «Это предсказание, подойдём ли мы друг другу?» — «Нет. Мы не предсказываем судьбу отношений и не оцениваем, «подходите» ли вы. Результат — повод поговорить о сильных сторонах и о том, к чему стоит присмотреться.»
- «Можно ли проверить пару, если мы уже давно вместе или расстались?» — «Можно. Матрица зависит только от дат рождения, а не от статуса отношений.»

`apps/web/src/app/sovmestimost/page.tsx`:

```tsx
import { toIsoDate } from "@oracle/core";
import type { Metadata } from "next";
import { CompatCalculator } from "@/components/compat/CompatCalculator";
import { compatFaqJsonLd, CompatGuide } from "@/components/compat/CompatGuide";
import { COMPAT_PATH } from "@/lib/compat";
import { jsonLdScript, publicMetadata, SITE_PREVIEW_IMAGE } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { getDb } from "@/server/db";
import { loadPortrait } from "@/server/profile-service";
import { currentUser } from "@/server/viewer";

export const metadata: Metadata = publicMetadata({
  title: "Совместимость по дате рождения — расчёт по матрице судьбы онлайн",
  description: "Введите две даты рождения и узнайте аркан вашей пары: как ваши матрицы судьбы разговаривают друг с другом. Бесплатно, без регистрации, даты остаются у вас.",
  path: COMPAT_PATH,
  image: SITE_PREVIEW_IMAGE,
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Совместимость по дате рождения",
  url: `${SITE_URL}${COMPAT_PATH}`,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  inLanguage: "ru",
  offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
};

export default async function CompatibilityPage() {
  const user = await currentUser();
  const portrait = user ? await loadPortrait({ db: getDb(), now: () => new Date() }, user.id) : null;
  const profileDate = portrait?.birthDate ? toIsoDate(portrait.birthDate) : null;
  return (
    <main className="page page--wide stack compat-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(compatFaqJsonLd()) }} />
      <div className="stack">
        <p className="eyebrow eyebrow--line">Практика · совместимость</p>
        <h1 className="display">Совместимость по дате рождения</h1>
        <p className="lead">Две даты — один общий аркан: как ваши матрицы судьбы разговаривают друг с другом. Без предсказаний — как повод для разговора.</p>
      </div>
      <CompatCalculator profileDate={profileDate} />
      <CompatGuide />
    </main>
  );
}
```

Связки:
- `apps/web/src/lib/practices.ts`: тип `slug` дополняется `"compat"`; запись `{ slug: "compat", title: "Совместимость", summary: "Две даты рождения — один общий аркан: как ваши матрицы разговаривают друг с другом.", href: COMPAT_PATH }` между Лилой и Таро; `practices.test.ts` — обновить ожидания (3 открытые, 2 «Скоро»); проверить, что сетка карточек на главной и `.practice-grid` в `globals.css` не ломается от пятой карточки (на 375 и 1280 px).
- `apps/web/src/lib/seo.ts`: `PUBLIC_PATHS` — добавить `COMPAT_PATH` (из `./compat`); `seo.test.ts` — тест, что `/sovmestimost` публичный.
- `MatrixCalculator.tsx`: под блоком действий результата ссылка «Проверить совместимость с партнёром» → `COMPAT_PATH` (`className="touch-link"`).
- `globals.css`: минимальные стили `.compat-people` (одна колонка на телефоне, две от 900 px), `.compat-pair__art` (ширина не больше 320 px, скругление как у карточек арканов), `.compat-actions` (перенос, зазор 12 px).

- [ ] **Step 5: Тесты и проверка**

`apps/web/src/components/compat/compat-guide.test.ts`: FAQ показан и отдаётся в разметке те же вопросы (как `blog.test.ts` для матрицы); тексты проходят `findStopPhrases`.

Run: `pnpm typecheck && pnpm vitest run apps/web`; вручную: `pnpm dev:web`, открыть `/sovmestimost`, ввести две даты — результат, «Отправить партнёру», «Пересчитать»; на 375 px нет горизонтальной прокрутки.
Expected: PASS.

```bash
git add apps/web
git commit -m "feat(web): compatibility calculator, result, share link and the page"
```

---

### Task 6: PDF — построитель, разбор запроса, маршрут

**Files:**
- Create: `apps/web/src/server/compat-pdf.ts`, `compat-pdf.test.ts`, `compat-service.ts`, `compat-service.test.ts`
- Create: `apps/web/src/app/api/compat/pdf/route.ts`
- Modify: `apps/web/src/server/rate-limit.ts`

**Interfaces:**
- Consumes: `Compatibility`, `calculateCompatibility`, `parseBirthDate` (core); `arcanumByNumber` (content); `compatUnionByNumber`; `compatSummary`; `pdf-common.ts` (`createPdfDoc`, `registerPdfFonts`, `paintPagesLight`, `newPage`, `ensureSpace`, `drawFooters`, `PDF_*`); `pdfAssetsDir`, `pdfArcanumImagePath`; `isSameOrigin`, `getEnv`, `clientKeyFromHeaders`.
- Produces: `buildCompatPdf(input: { compat: Compatibility; madeAt: Date; assetsDir: string }): Promise<Buffer>` — **без дат рождения**; `createCompatPdf(body: unknown, now: Date, assetsDir: string): Promise<{ ok: true; pdf: Buffer } | { ok: false; error: "invalid" }>`; `compatPdfLimiter`.

- [ ] **Step 1: Тесты**

`apps/web/src/server/compat-pdf.test.ts`:

```ts
import { calculateCompatibility } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { buildCompatPdf } from "./compat-pdf";
import { pdfAssetsDir } from "./pdf-assets";

describe("buildCompatPdf", () => {
  test("builds a PDF from the finished calculation", async () => {
    const compat = calculateCompatibility({ year: 1988, month: 11, day: 18 }, { year: 2000, month: 1, day: 1 });
    const pdf = await buildCompatPdf({ compat, madeAt: new Date("2026-10-05T10:00:00Z"), assetsDir: pdfAssetsDir() });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5_000);
  });

  test("works for every pair arcanum, including the same date twice", async () => {
    const same = calculateCompatibility({ year: 1988, month: 11, day: 18 }, { year: 1988, month: 11, day: 18 });
    expect((await buildCompatPdf({ compat: same, madeAt: new Date(), assetsDir: pdfAssetsDir() })).length).toBeGreaterThan(5_000);
  });
});
```

`apps/web/src/server/compat-service.test.ts`:

```ts
import { describe, expect, test, vi } from "vitest";
import { createCompatPdf } from "./compat-service";
import { pdfAssetsDir } from "./pdf-assets";

const NOW = new Date("2026-10-05T10:00:00Z");

describe("createCompatPdf", () => {
  test("returns a PDF for two valid dates", async () => {
    const result = await createCompatPdf({ a: "1988-11-18", b: "2000-01-01" }, NOW, pdfAssetsDir());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  test.each([
    [null],
    ["текст"],
    [{}],
    [{ a: "1988-11-18" }],
    [{ a: "1988-11-18", b: "не дата" }],
    [{ a: "1899-12-31", b: "2000-01-01" }],
    [{ a: "2999-01-01", b: "2000-01-01" }],
    [{ a: 19881118, b: "2000-01-01" }],
  ])("rejects %j without building anything", async (body) => {
    expect(await createCompatPdf(body, NOW, pdfAssetsDir())).toEqual({ ok: false, error: "invalid" });
  });

  test("does not write the dates to the log when it fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(createCompatPdf({ a: "1988-11-18", b: "2000-01-01" }, NOW, "/no/such/dir")).rejects.toThrow();
    expect(JSON.stringify([...error.mock.calls, ...warn.mock.calls])).not.toMatch(/1988|2000-01-01/);
    error.mockRestore();
    warn.mockRestore();
  });
});
```

Run: `pnpm vitest run apps/web/src/server/compat` → FAIL.

- [ ] **Step 2: Построитель PDF**

`apps/web/src/server/compat-pdf.ts` (по образцу `lila-pdf.ts`; обложка — как у разбора: иллюстрация аркана пары):

```ts
import { arcanumByNumber } from "@oracle/content";
import { compatUnionByNumber } from "@oracle/content/compat";
import { KEY_POINTS, type Compatibility } from "@oracle/core";
import { compatSummary, POINT_LABELS } from "@/lib/compat";
import { DISCLAIMER } from "@/lib/legal";
import { pdfArcanumImagePath } from "./pdf-assets";
import {
  createPdfDoc,
  drawFooters,
  ensureSpace,
  newPage,
  paintPagesLight,
  PDF_COLORS as COLORS,
  PDF_CONTENT_WIDTH as CONTENT_WIDTH,
  PDF_MARGIN as MARGIN,
  PDF_PAGE as PAGE,
  registerPdfFonts,
  type PdfDoc,
} from "./pdf-common";

// В сборщик приходит готовый расчёт (номера арканов): дат рождения здесь нет и в файл они не попадают
export type CompatPdfInput = { compat: Compatibility; madeAt: Date; assetsDir: string };

const COVER_SIDE = 80;
const COVER_ART = 300;
const COVER_ART_TOP = 96;
const dateLabel = (date: Date) => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Moscow" }).format(date);

function drawCover(doc: PdfDoc, input: CompatPdfInput) {
  const arcanum = arcanumByNumber(input.compat.pair);
  const width = PAGE.width - 2 * COVER_SIDE;
  const artX = (PAGE.width - COVER_ART) / 2;
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.coverBg);
  doc.image(pdfArcanumImagePath(input.assetsDir, arcanum), artX, COVER_ART_TOP, { width: COVER_ART, height: COVER_ART });
  doc.rect(artX, COVER_ART_TOP, COVER_ART, COVER_ART).lineWidth(0.8).stroke(COLORS.gold);
  doc.font("bodyBold").fontSize(8.5).fillColor(COLORS.gold);
  doc.text(`СОВМЕСТИМОСТЬ · ${dateLabel(input.madeAt)}`, COVER_SIDE, COVER_ART_TOP + COVER_ART + 44, { width, align: "center", characterSpacing: 1.6 });
  doc.font("display").fontSize(32).fillColor(COLORS.coverInk);
  doc.text(`Аркан вашей пары — ${arcanum.name}`, COVER_SIDE, doc.y + 16, { width, align: "center", lineGap: 4 });
  doc.font("body").fontSize(12).fillColor(COLORS.coverSoft);
  doc.text("Материал для разговора и размышления, а не прогноз и не оценка отношений.", COVER_SIDE, doc.y + 16, { width, align: "center", lineGap: 4 });
  // Без нулевого нижнего поля подпись у края страницы уходит на новую страницу
  doc.page.margins.bottom = 0;
  doc.font("bodyBold").fontSize(9).fillColor(COLORS.gold);
  doc.text("tvoy-orakul.ru", COVER_SIDE, PAGE.height - 72, { width, align: "center", characterSpacing: 1.2 });
}

function drawUnion(doc: PdfDoc, compat: Compatibility) {
  const union = compatUnionByNumber(compat.pair);
  doc.font("display").fontSize(24).fillColor(COLORS.ink).text("Ваш союз", MARGIN.left, MARGIN.top, { width: CONTENT_WIDTH });
  doc.moveDown(0.8);
  const block = (title: string, text: string) => {
    ensureSpace(doc, 90);
    doc.font("bodyBold").fontSize(9.5).fillColor(COLORS.accent).text(title.toUpperCase(), MARGIN.left, doc.y, { width: CONTENT_WIDTH, characterSpacing: 1 });
    doc.font("body").fontSize(11).fillColor(COLORS.ink).text(text, MARGIN.left, doc.y + 4, { width: CONTENT_WIDTH, lineGap: 3.5, paragraphGap: 9 });
    doc.y += 12;
  };
  block("Суть союза", union.essence);
  block("Что даёт", union.gives);
  block("Где стоит присмотреться", union.attention);
  block("Вопрос для двоих", union.question);
}

function drawPeople(doc: PdfDoc, compat: Compatibility) {
  newPage(doc);
  doc.font("display").fontSize(24).fillColor(COLORS.ink).text("Вы и партнёр", MARGIN.left, MARGIN.top, { width: CONTENT_WIDTH });
  doc.moveDown(0.8);
  for (const [index, person] of compat.people.entries()) {
    ensureSpace(doc, 120);
    doc.font("bodyBold").fontSize(12).fillColor(COLORS.accent).text(index === 0 ? "Вы" : "Партнёр", MARGIN.left, doc.y, { width: CONTENT_WIDTH });
    for (const point of KEY_POINTS) {
      const arcanum = arcanumByNumber(person[point]);
      ensureSpace(doc, 60);
      doc.font("body").fontSize(11).fillColor(COLORS.ink).text(`${POINT_LABELS[point]}: аркан ${arcanum.number} «${arcanum.name}»`, MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH });
    }
    doc.y += 14;
  }
  ensureSpace(doc, 80);
  doc.font("display").fontSize(18).fillColor(COLORS.ink).text("Где вы похожи и где различаетесь", MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH });
  for (const line of compatSummary(compat, (number) => arcanumByNumber(number).name)) {
    ensureSpace(doc, 40);
    doc.font("body").fontSize(11).fillColor(COLORS.ink).text(line, MARGIN.left, doc.y + 6, { width: CONTENT_WIDTH, lineGap: 3 });
  }
}

export function buildCompatPdf(input: CompatPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = createPdfDoc({ Title: "Совместимость по дате рождения", Subject: `Аркан пары ${input.compat.pair}` });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      registerPdfFonts(doc, input.assetsDir);
      drawCover(doc, input);
      paintPagesLight(doc);
      newPage(doc);
      drawUnion(doc, input.compat);
      drawPeople(doc, input.compat);
      ensureSpace(doc, 80);
      doc.moveTo(MARGIN.left, doc.y).lineTo(PAGE.width - MARGIN.right, doc.y).lineWidth(0.5).stroke(COLORS.line);
      doc.font("body").fontSize(9).fillColor(COLORS.muted).text(DISCLAIMER, MARGIN.left, doc.y + 10, { width: CONTENT_WIDTH, lineGap: 2 });
      drawFooters(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
```

- [ ] **Step 3: Разбор запроса**

`apps/web/src/server/compat-service.ts`:

```ts
import { calculateCompatibility, parseBirthDate } from "@oracle/core";
import { buildCompatPdf } from "./compat-pdf";

// Даты живут только внутри этой функции: дальше идёт готовый расчёт. Ни логов, ни записи на диск
export async function createCompatPdf(body: unknown, now: Date, assetsDir: string): Promise<{ ok: true; pdf: Buffer } | { ok: false; error: "invalid" }> {
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const first = parseBirthDate(record.a, now);
  const second = parseBirthDate(record.b, now);
  if (!first || !second) return { ok: false, error: "invalid" };
  const pdf = await buildCompatPdf({ compat: calculateCompatibility(first, second), madeAt: now, assetsDir });
  return { ok: true, pdf };
}
```

- [ ] **Step 4: Лимит и маршрут**

`apps/web/src/server/rate-limit.ts` — рядом с `reportPdfLimiter`:

```ts
const COMPAT_PDFS_PER_MINUTE = 6;
// PDF совместимости доступен без входа, поэтому ключ — адрес клиента; сборка занимает процессор, лимит строгий
export const compatPdfLimiter = createRateLimiter({ limit: COMPAT_PDFS_PER_MINUTE, windowMs: MINUTE_MS });
```

`apps/web/src/app/api/compat/pdf/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/server/env";
import { createCompatPdf } from "@/server/compat-service";
import { isSameOrigin } from "@/server/http";
import { pdfAssetsDir } from "@/server/pdf-assets";
import { clientKeyFromHeaders, compatPdfLimiter } from "@/server/rate-limit";

const MAX_BODY_BYTES = 1024;
const NO_STORE = { "cache-control": "no-store" };
const FILENAME = "sovmestimost.pdf";

// Даты приходят в теле запроса и не логируются и не сохраняются: сервер собирает файл и забывает их
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request, getEnv().APP_URL)) return NextResponse.json({ ok: false, error: "bad_origin" }, { status: 403, headers: NO_STORE });
  if (!compatPdfLimiter.allow(clientKeyFromHeaders(request.headers))) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: NO_STORE });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413, headers: NO_STORE });
  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413, headers: NO_STORE });
  const body: unknown = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  })();

  try {
    const result = await createCompatPdf(body, new Date(), pdfAssetsDir());
    if (!result.ok) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400, headers: NO_STORE });
    return new NextResponse(new Uint8Array(result.pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${FILENAME}"`,
        "content-length": String(result.pdf.length),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    // В лог — только факт сбоя: даты и тело запроса туда не попадают
    console.error("compat pdf failed");
    return NextResponse.json({ ok: false, error: "pdf_failed" }, { status: 500, headers: NO_STORE });
  }
}
```

Проверить, что `isSameOrigin` и `clientKeyFromHeaders` экспортируются из перечисленных модулей (`server/http.ts`, `server/rate-limit.ts`); при иных путях поправить импорты.

- [ ] **Step 5: Запустить и самопроверка**

Run: `pnpm vitest run apps/web/src/server && pnpm --filter @oracle/web typecheck`
Expected: PASS.

Самопроверка маршрута (записать в описание PR): origin проверяется до любых действий; лимит по IP; тело ≤ 1 КБ; обе даты через `parseBirthDate`; в логах и ответах дат нет; кэширование запрещено; `content-disposition` фиксированный; ошибка сборки — 500 без деталей; в базу и очереди ничего не пишется (в модуле нет импортов `@oracle/db` и `queue`).

```bash
git add apps/web/src
git commit -m "feat(web): compatibility PDF built in memory without storing the dates"
```

---

### Task 7: Документы и правила для агентов

**Files:**
- Modify: `apps/web/src/app/privacy/page.tsx`, `apps/web/src/lib/legal.ts`, `AGENTS.md`

- [ ] **Step 1: Политика**

`apps/web/src/app/privacy/page.tsx`, раздел 2 «Какие данные обрабатываются» — новый пункт после пункта про IP-адрес:

```tsx
          <li>
            при скачивании PDF в калькуляторе совместимости — две даты рождения (ваша и партнёра), которые передаются на сервер только на время сборки файла и не сохраняются;
          </li>
```

и в разделе 3 «Зачем» — пункт «сборка PDF-файла совместимости по вашему запросу». `LEGAL_VERSIONS.privacy` → следующая версия (`2026-10-v1` или по факту даты), `LEGAL_DATES.privacy` → дата PR. В `legal.test.ts` проверка формата версии уже общая — оставить зелёной.

**Гейт владелицы:** формулировка пункта политики.

- [ ] **Step 2: AGENTS.md**

Таблица: `| Совместимость | apps/web/src/app/sovmestimost/page.tsx, apps/web/src/components/compat/ |`, `| Тексты «Союз» (совместимость) | packages/content/compat-arcana.md (после правки — pnpm content:build) |`. «Должно остаться на месте»: строка «Совместимость — тексты и роли дословно: `<h1>` «Совместимость по дате рождения» (один на странице); поля «Ваша дата рождения», «Дата рождения партнёра»; кнопки «Рассчитать совместимость», «Отправить партнёру», «Скачать PDF», «Пересчитать»; отметка «Ссылка скопирована.» — `role="status"`, ошибки — `role="alert"`; блоки «Аркан вашей пары», «Вы и партнёр», «Где вы похожи и где различаетесь»; даты не попадают в адрес страницы и в хранилище браузера, на сервер уходят только запросом «Скачать PDF». Метки практик: «Открыто» — матрица, Лила, совместимость; «Скоро» — таро, натальная карта.» Раздел «Не трогать» и списки метаданных не менять.

- [ ] **Step 3: Проверка и коммит**

Run: `pnpm vitest run apps/web/src/lib/legal.test.ts && pnpm typecheck`

```bash
git add AGENTS.md apps/web/src
git commit -m "docs: privacy and agent rules for the compatibility practice"
```

---

### Task 8: Сквозные тесты

**Files:**
- Create: `e2e/compat.spec.ts`
- Modify: `e2e/portrait.spec.ts`, `e2e/launch.spec.ts` (счётчики и список практик), другие e2e, где считаются карточки практик (найти поиском по «Скоро»)

- [ ] **Step 1: Сценарии**

`e2e/compat.spec.ts`:

```ts
import { expect, test, type Page } from "@playwright/test";

// Нужен только dev:web: страница публичная, вход не требуется
async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function calculate(page: Page, first = "1988-11-18", second = "2000-01-01") {
  await page.goto("/sovmestimost");
  await page.getByLabel("Ваша дата рождения").fill(first);
  await page.getByLabel("Дата рождения партнёра").fill(second);
  await page.getByRole("button", { name: "Рассчитать совместимость" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Аркан вашей пары" })).toBeVisible();
}

test("two dates give the pair arcanum, the two people and the summary, and the dates stay out of the address", async ({ page }) => {
  await calculate(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Совместимость по дате рождения");
  await expect(page.getByRole("heading", { level: 2, name: "Вы и партнёр" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Где вы похожи и где различаетесь" })).toBeVisible();
  expect(page.url()).not.toMatch(/1988|2000|dat/);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toMatch(/1988|2000-01-01/);
  await noHorizontalScroll(page);
});

test("a wrong date shows an alert and no result", async ({ page }) => {
  await page.goto("/sovmestimost");
  await page.getByLabel("Ваша дата рождения").fill("1988-11-18");
  await page.getByRole("button", { name: "Рассчитать совместимость" }).click();
  await expect(page.getByRole("alert")).toContainText("Проверьте даты");
  await expect(page.getByRole("heading", { level: 2, name: "Аркан вашей пары" })).toHaveCount(0);
});

test("the invitation copies a link without dates when the system share dialog is not available", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (text: string) => ((window as unknown as { __copied: string }).__copied = text) }, configurable: true });
  });
  await calculate(page);
  await page.getByRole("button", { name: "Отправить партнёру" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Ссылка скопирована." })).toBeVisible();
  const copied = await page.evaluate(() => (window as unknown as { __copied: string }).__copied);
  expect(copied).toContain("/sovmestimost?utm_source=share&utm_medium=partner");
  expect(copied).not.toMatch(/1988|2000/);
});

test("the PDF downloads and is a real PDF; «Пересчитать» clears the result", async ({ page }) => {
  await calculate(page);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Скачать PDF" }).click()]);
  expect(download.suggestedFilename()).toBe("sovmestimost.pdf");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  expect(Buffer.concat(chunks).subarray(0, 5).toString()).toBe("%PDF-");
  await page.getByRole("button", { name: "Пересчитать" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Аркан вашей пары" })).toHaveCount(0);
});

test("the PDF endpoint refuses foreign origins and bad dates", async ({ page }) => {
  await page.goto("/sovmestimost");
  const origin = new URL(page.url()).origin;
  expect((await page.request.post("/api/compat/pdf", { data: { a: "1988-11-18", b: "2000-01-01" }, headers: { origin: "https://evil.example" } })).status()).toBe(403);
  expect((await page.request.post("/api/compat/pdf", { data: { a: "нет", b: "2000-01-01" }, headers: { origin } })).status()).toBe(400);
});
```

- [ ] **Step 2: Обновить счётчики практик**

Найти в `e2e/` проверки «Открыто/Скоро» и списка практик (`grep -rn "Скоро\|Открыто" e2e`); после появления карточки «Совместимость» открытых практик 3, «Скоро» 2. Обновить ожидания и проверить главную на 375 и 1280 px (сетка не ломается).

- [ ] **Step 3: Запустить**

Run: `pnpm test:e2e` (нужны `dev:db`, `dev:web`, `dev:worker`, `.env.development.local` с `PAYMENTS=fake`, `PAID_REPORTS=on`, `PAID_LILA=on`).
Expected: PASS, включая существующие сценарии.

```bash
git add e2e
git commit -m "test(e2e): compatibility calculator, invitation link and PDF"
```

---

### Task 9: Выкладка и SEO-следствия

- [ ] **Step 1: Готовность к PR**

`pnpm install && pnpm typecheck && pnpm test && pnpm test:coverage && pnpm test:e2e` — зелёные; вычитаны 22 текста, пояснения с FAQ и строка политики (гейты Task 3, 5, 7). PR на английском, тело: что делает, проверки, самопроверка маршрута PDF. Мерж — только по «да» владелицы.

- [ ] **Step 2: После деплоя**

Проверить на боевом сайте: `/sovmestimost` открывается (200), в `sitemap.xml` появился адрес, карточка на главной с меткой «Открыто», результат считается, PDF скачивается и открывается, в подвале и на странице нет обрывов. Владелица: отправить `/sovmestimost` в переобход Яндекс.Вебмастера и Search Console, при желании — пост в соцсети (пакет постов №2 — отдельной задачей контента, ветка `content/social`).

- [ ] **Step 3: Готово, когда**

Практика открыта, e2e зелёные, цели `compat_calculated`, `compat_share`, `compat_pdf` видны в Метрике после первых использований.

---

## Self-review плана 5

- **Покрытие спецификации:** разделы 1 и 2 — Task 1, 4, 5; раздел 3 (контент) — Task 2, 3; раздел 4 (PDF) — Task 6; раздел 5 (приватность, политика) — Task 5 (нет хранения), 6 (нет дат в логах), 7; раздел 6 (главная, SEO, цели) — Task 4, 5, 8, 9; раздел 7 (тексты интерфейса) — Global Constraints, Task 5, 7; раздел 8 (проверки) — Task 1–8; раздел 9 (не входит) — не реализуется; раздел 10 (порядок) — совпадает с порядком задач.
- **Замена по ходу плана:** в спецификации «Вы и партнёр» показывает «В отношениях» для каждого аркана — реализовано выводом всех абзацев раздела `love` из существующих текстов; если на телефоне экран получится слишком длинным, свернуть абзацы в `<details>` (решение при просмотре в Task 5, без нового текста).
- **Не проверено при написании:** точные пути экспорта `isSameOrigin`/`clientKeyFromHeaders` и сетка карточек практик на главной при пяти карточках — Task 6 Step 4 и Task 5 Step 4 требуют проверить; значение «01.01.2000 → личность 1, центр 8, задача 4» — Task 1 Step 3 требует сверить с кодом расчёта.
- **Типы:** `Compatibility`, `KeyPoint`, `KEY_POINTS`, `CompatPerson` (Task 1) используются в Task 4–6 с теми же именами; `COMPAT_SHARE_URL`/`COMPAT_SHARE_TEXT`/`COMPAT_PATH` (Task 4) — в Task 5, 8; `createCompatPdf`/`buildCompatPdf` (Task 6) — в тестах и маршруте с теми же сигнатурами.
