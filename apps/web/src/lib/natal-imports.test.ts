import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

// В браузер не должны попасть ни ядро расчёта (~47 КБ gzip), ни база городов (~4 МБ): модули калькулятора, которые грузятся сразу,
// импортируют из @oracle/core/natal и @oracle/geo только типы. Значение из ядра берёт лишь natal-moment.ts — его UI грузит динамически.
const PACKAGE_PATTERN = /^@oracle\/(?:core|geo)(?:\/|$)/;

type ImportRecord = { specifier: string; typeOnly: boolean };

// Все статические import и re-export с адресом модуля; typeOnly — если это `import type …` / `export type … from`
function findImports(source: string): ImportRecord[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const records: ImportRecord[] = [];
  for (const match of code.matchAll(/^\s*(import|export)\s+(type\s+)?([^;"']*?)\s*from\s*["']([^"']+)["']/gm)) {
    records.push({ specifier: match[4] as string, typeOnly: match[2] !== undefined });
  }
  for (const match of code.matchAll(/^\s*import\s*["']([^"']+)["']/gm)) records.push({ specifier: match[1] as string, typeOnly: false });
  return records;
}

const read = (name: string) => readFileSync(fileURLToPath(new URL(`./${name}`, import.meta.url)), "utf8");
const dynamicImports = (source: string) => [...source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']/g)].map((match) => match[1] as string);

describe("findImports", () => {
  test("tells type-only imports from value imports, including multi-line ones", () => {
    const source = [
      'import type { City } from "@oracle/geo";',
      "import {",
      "  localToUtc,",
      '} from "@oracle/core/natal";',
      'import { type BirthMoment } from "@oracle/core/natal";',
      'export * from "@oracle/geo";',
      'export type { City } from "@oracle/geo";',
      '// import { nothing } from "@oracle/core/natal";',
      'import "@oracle/geo";',
    ].join("\n");
    expect(findImports(source)).toEqual([
      { specifier: "@oracle/geo", typeOnly: true },
      { specifier: "@oracle/core/natal", typeOnly: false },
      { specifier: "@oracle/core/natal", typeOnly: false },
      { specifier: "@oracle/geo", typeOnly: false },
      { specifier: "@oracle/geo", typeOnly: true },
      { specifier: "@oracle/geo", typeOnly: false },
    ]);
  });
});

// natal-wheel.ts добавляется в список вместе с самим модулем
const EAGER_MODULES = ["natal-copy.ts", "natal-input.ts"];

describe("modules loaded together with the page import only types from the core and the city base", () => {
  test.each(EAGER_MODULES)("%s: no value import from @oracle/core or @oracle/geo", (name) => {
    const source = read(name);
    const offenders = findImports(source).filter((record) => PACKAGE_PATTERN.test(record.specifier) && !record.typeOnly);
    expect(offenders).toEqual([]);
    expect(dynamicImports(source).filter((specifier) => PACKAGE_PATTERN.test(specifier))).toEqual([]);
  });
});
