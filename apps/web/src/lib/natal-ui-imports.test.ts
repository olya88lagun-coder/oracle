import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

// Страница калькулятора не должна тянуть в бандл ни базу городов (~4 МБ, @oracle/geo), ни расчёт карты (@oracle/core/natal, астрономическая библиотека).
// Из @oracle/geo в браузерный код можно только тип City и лёгкий адрес @oracle/geo/query (нормализация запроса).
// @oracle/core/natal подгружает динамически один NatalCalculator, а значением из него пользуется только natal-moment.ts (его тоже грузят динамически).

const LIB_DIR = fileURLToPath(new URL("./", import.meta.url));
const COMPONENTS_DIR = fileURLToPath(new URL("../components/natal/", import.meta.url));

type ImportRecord = { specifier: string; typeOnly: boolean };

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// Статические import и re-export с адресом модуля (typeOnly — `import type …` / `export type … from`), а также импорты без имён
function staticImports(source: string): ImportRecord[] {
  const code = stripComments(source);
  const records: ImportRecord[] = [];
  for (const match of code.matchAll(/^\s*(?:import|export)\s+(type\s+)?([^;"']*?)\s*from\s*["']([^"']+)["']/gm)) {
    // `import { type A, type B } from …` целиком из типов тоже стирается при сборке
    const names = match[2] ?? "";
    const allInlineTypes = /^\{[^}]*\}$/.test(names.trim()) && names.replace(/[{}]/g, "").split(",").every((part) => part.trim() === "" || part.trim().startsWith("type "));
    records.push({ specifier: match[3] as string, typeOnly: match[1] !== undefined || allInlineTypes });
  }
  for (const match of code.matchAll(/^\s*import\s*["']([^"']+)["']/gm)) records.push({ specifier: match[1] as string, typeOnly: false });
  return records;
}

const dynamicImports = (source: string): string[] => [...stripComments(source).matchAll(/\bimport\s*\(\s*["']([^"']+)["']/g)].map((match) => match[1] as string);

const isTestFile = (name: string) => /\.test\.tsx?$/.test(name) || /\.test-support\.tsx?$/.test(name);

function clientSources(): { path: string; name: string; source: string }[] {
  const files = [
    ...readdirSync(COMPONENTS_DIR).map((name) => ({ dir: COMPONENTS_DIR, name })),
    ...readdirSync(LIB_DIR)
      .filter((name) => /^natal-.*\.tsx?$/.test(name))
      .map((name) => ({ dir: LIB_DIR, name })),
  ];
  return files
    .filter(({ name }) => /\.tsx?$/.test(name) && !isTestFile(name))
    .map(({ dir, name }) => ({ path: `${dir}${name}`, name, source: readFileSync(`${dir}${name}`, "utf8") }));
}

describe("which modules of the calculator may reach the city base and the chart core", () => {
  const sources = clientSources();

  test("scans the calculator components and the natal-*.ts libraries", () => {
    const names = sources.map((item) => item.name);
    expect(names).toContain("NatalSprite.tsx");
    expect(names).toContain("NatalCalculator.tsx");
    expect(names).toContain("natal-moment.ts");
    expect(names).toContain("natal-cities.ts");
  });

  test("nothing takes a value from the bare @oracle/geo (the 4 MB base); @oracle/geo/query is allowed", () => {
    for (const { name, source } of sources) {
      const offenders = staticImports(source).filter((record) => record.specifier === "@oracle/geo" && !record.typeOnly);
      expect(offenders, name).toEqual([]);
      expect(dynamicImports(source).filter((specifier) => specifier === "@oracle/geo"), name).toEqual([]);
    }
  });

  test("only subpaths of @oracle/geo that are not the base are used, and only @oracle/geo/query", () => {
    for (const { name, source } of sources) {
      const used = [...staticImports(source), ...dynamicImports(source).map((specifier) => ({ specifier, typeOnly: false }))]
        .map((record) => record.specifier)
        .filter((specifier) => specifier.startsWith("@oracle/geo/"));
      expect(used.filter((specifier) => specifier !== "@oracle/geo/query"), name).toEqual([]);
    }
  });

  test("a value from @oracle/core/natal is taken statically only by natal-moment.ts", () => {
    for (const { name, source } of sources) {
      const offenders = staticImports(source).filter((record) => /^@oracle\/core\/natal(?:\/|$)/.test(record.specifier) && !record.typeOnly);
      if (name === "natal-moment.ts") expect(offenders.length, name).toBeGreaterThan(0);
      else expect(offenders, name).toEqual([]);
    }
  });

  test("@oracle/core/natal and natal-moment are imported dynamically only inside NatalCalculator.tsx", () => {
    for (const { name, source } of sources) {
      const dynamic = dynamicImports(source).filter((specifier) => /^@oracle\/core\/natal(?:\/|$)/.test(specifier) || /natal-moment$/.test(specifier));
      if (name === "NatalCalculator.tsx") expect(dynamic.sort(), name).toEqual(["@/lib/natal-moment", "@oracle/core/natal"]);
      else expect(dynamic, name).toEqual([]);
    }
  });

  test("nothing imports natal-moment statically, except as a type", () => {
    for (const { name, source } of sources) {
      const offenders = staticImports(source).filter((record) => /natal-moment$/.test(record.specifier) && !record.typeOnly);
      expect(offenders, name).toEqual([]);
    }
  });

  test("the scanner itself tells the cases apart", () => {
    const source = [
      'import type { City } from "@oracle/geo";',
      'import { type A, type B } from "@oracle/core/natal";',
      'import { computeNatalChart } from "@oracle/core/natal";',
      'import { normalizeQuery } from "@oracle/geo/query";',
      'export type { City } from "@oracle/geo";',
      '// import { hidden } from "@oracle/geo";',
      'const later = import("@oracle/core/natal");',
    ].join("\n");
    expect(staticImports(source)).toEqual([
      { specifier: "@oracle/geo", typeOnly: true },
      { specifier: "@oracle/core/natal", typeOnly: true },
      { specifier: "@oracle/core/natal", typeOnly: false },
      { specifier: "@oracle/geo/query", typeOnly: false },
      { specifier: "@oracle/geo", typeOnly: true },
    ]);
    expect(dynamicImports(source)).toEqual(["@oracle/core/natal"]);
  });
});
