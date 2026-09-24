# Задача 1 — Монорепо, CI и дата рождения в `packages/core`

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.ts`, `.editorconfig`, `.gitattributes`
- Modify: `.gitignore` (заменить целиком)
- Create: `.github/workflows/ci.yml`
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.ts`
- Create: `packages/core/src/birth-date.ts`, `packages/core/src/birth-date.test.ts`, `packages/core/src/index.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `type BirthDate = { readonly year: number; readonly month: number; readonly day: number }`
  - `MIN_BIRTH_YEAR = 1900`
  - `parseBirthDate(value: unknown, today: Date): BirthDate | null` — принимает только `YYYY-MM-DD` (так отдаёт `<input type="date">`), настоящую календарную дату, год ≥ 1900, не позже завтрашнего дня по UTC
  - `toIsoDate(date: BirthDate): string` — `"1990-03-07"`
  - `formatBirthDateRu(date: BirthDate): string` — `"7 марта 1990"`

## Зачем

Дата рождения — общий вход для всех практик (спецификация 3: «дата вводится один раз и переиспользуется»). В плане 1 её сохраняет «Мой портрет», в плане 2 из неё считается матрица. Проверка даты должна жить в одном месте, без зависимостей, чтобы её одинаково использовали сайт, база и будущие калькуляторы.

## Шаги

- [ ] **Шаг 1. Ветка.**

```bash
cd /c/dev/oracle
git checkout -b feat/foundation
```

- [ ] **Шаг 2. Корневые файлы.** Создать:

`package.json`:

```json
{
  "name": "oracle",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@12.4.1",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "pnpm -r --parallel typecheck",
    "dev:db": "node packages/db/scripts/dev-db.mjs",
    "dev:web": "pnpm --filter @oracle/web dev",
    "test:e2e": "playwright test -c e2e/playwright.config.ts"
  },
  "devDependencies": {
    "@playwright/test": "1.63.0",
    "@types/node": "26.5.1",
    "@vitest/coverage-v8": "5.0.0",
    "typescript": "6.0.3",
    "vitest": "5.0.0"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
allowBuilds:
  esbuild: true
minimumReleaseAgeExclude:
  - zod@4.6.5
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true
  }
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // "apps/*" добавляется в задаче 3 вместе с первым приложением
    projects: ["packages/*"],
    coverage: {
      provider: "v8",
      include: ["packages/core/src/**/*.ts", "packages/db/src/**/*.ts", "apps/web/src/server/**/*.ts", "apps/web/src/lib/**/*.{ts,tsx}"],
      exclude: ["**/*.test.ts", "**/index.ts", "**/testing.ts", "**/client.ts"],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});
```

`.editorconfig`:

```ini
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
```

`.gitattributes`:

```
* text=auto eol=lf
```

`.gitignore` (заменить целиком):

```
node_modules/
.next/
coverage/
dist/
.env
.env.*
!.env.example
!.env.development.example
*.log
.dev-db/
.dev-db-*/
test-results/
playwright-report/
next-env.d.ts
e2e/test-results/
e2e/playwright-report/
```

`.github/workflows/ci.yml`:

```yaml
name: ci
on:
  push:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test:coverage
```

- [ ] **Шаг 3. Пакет `core`.** Создать:

`packages/core/package.json`:

```json
{
  "name": "@oracle/core",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc -p tsconfig.json" }
}
```

`packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["src"]
}
```

`packages/core/vitest.config.ts`:

```ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: { name: "core", environment: "node" },
});
```

- [ ] **Шаг 4. Тест (RED).** `packages/core/src/birth-date.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { formatBirthDateRu, MIN_BIRTH_YEAR, parseBirthDate, toIsoDate } from "./birth-date";

const TODAY = new Date("2026-09-24T10:00:00Z");

describe("parseBirthDate", () => {
  test("reads a date from a date input", () => {
    expect(parseBirthDate("1990-03-07", TODAY)).toEqual({ year: 1990, month: 3, day: 7 });
  });

  test("ignores surrounding spaces", () => {
    expect(parseBirthDate(" 1990-03-07 ", TODAY)).toEqual({ year: 1990, month: 3, day: 7 });
  });

  test("accepts the 29th of February in a leap year only", () => {
    expect(parseBirthDate("2024-02-29", TODAY)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseBirthDate("2023-02-29", TODAY)).toBeNull();
  });

  test.each(["07.03.1990", "1990-3-7", "1990-13-01", "1990-04-31", "", "abc"])("rejects %j", (value) => {
    expect(parseBirthDate(value, TODAY)).toBeNull();
  });

  test("rejects anything that is not a string", () => {
    expect(parseBirthDate(19900307, TODAY)).toBeNull();
    expect(parseBirthDate(null, TODAY)).toBeNull();
  });

  test(`rejects years before ${MIN_BIRTH_YEAR}`, () => {
    expect(parseBirthDate("1899-12-31", TODAY)).toBeNull();
    expect(parseBirthDate("1900-01-01", TODAY)).toEqual({ year: 1900, month: 1, day: 1 });
  });

  test("accepts tomorrow by UTC, because east of UTC it is already today, and rejects later dates", () => {
    expect(parseBirthDate("2026-09-25", TODAY)).toEqual({ year: 2026, month: 9, day: 25 });
    expect(parseBirthDate("2026-09-26", TODAY)).toBeNull();
  });
});

describe("toIsoDate", () => {
  test("pads month and day", () => {
    expect(toIsoDate({ year: 1990, month: 3, day: 7 })).toBe("1990-03-07");
  });

  test("round-trips through parseBirthDate", () => {
    const date = { year: 1985, month: 12, day: 31 };

    expect(parseBirthDate(toIsoDate(date), TODAY)).toEqual(date);
  });
});

describe("formatBirthDateRu", () => {
  test("writes the month in the genitive case", () => {
    expect(formatBirthDateRu({ year: 1990, month: 3, day: 7 })).toBe("7 марта 1990");
    expect(formatBirthDateRu({ year: 2001, month: 5, day: 1 })).toBe("1 мая 2001");
  });
});
```

Запуск:

```bash
export PATH="/c/Users/olya8/AppData/Roaming/npm:$PATH"
pnpm install
pnpm vitest run packages/core/src/birth-date.test.ts
```

Ожидается FAIL: `Failed to resolve import "./birth-date"`.

- [ ] **Шаг 5. Реализация.** `packages/core/src/birth-date.ts`:

```ts
export type BirthDate = { readonly year: number; readonly month: number; readonly day: number };

export const MIN_BIRTH_YEAR = 1900;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;
const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

// Формат `<input type="date">`. Завтрашняя по UTC дата допустима: восточнее UTC она уже наступила
export function parseBirthDate(value: unknown, today: Date): BirthDate | null {
  if (typeof value !== "string") return null;
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  const isCalendarDate = probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
  if (!isCalendarDate || year < MIN_BIRTH_YEAR) return null;
  const latest = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) + DAY_MS;
  if (probe.getTime() > latest) return null;
  return { year, month, day };
}

export function toIsoDate(date: BirthDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

export function formatBirthDateRu(date: BirthDate): string {
  return `${date.day} ${MONTHS_GENITIVE[date.month - 1]} ${date.year}`;
}
```

`packages/core/src/index.ts`:

```ts
export * from "./birth-date";
```

- [ ] **Шаг 6. GREEN.**

```bash
pnpm vitest run packages/core/src/birth-date.test.ts
pnpm typecheck
```

Ожидается: все тесты PASS, `typecheck` без ошибок.

- [ ] **Шаг 7. Коммит.**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json vitest.config.ts .editorconfig .gitattributes .gitignore .github/workflows/ci.yml packages/core
git commit -m "feat(core): monorepo scaffold and birth date parsing"
```
