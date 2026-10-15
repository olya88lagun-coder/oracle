import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

const SCRIPT = fileURLToPath(new URL("../scripts/build-cities.mjs", import.meta.url));
const COMPACT_ROW_COLUMNS = 8;

// Строка geoname из 19 колонок; нужные сборке поля подставляются, остальные пустые
function cityLine(p: { id: string; name: string; latitude: string; longitude: string; country: string; admin1?: string; population?: string; zone?: string }): string {
  const fields = Array.from({ length: 19 }, () => "");
  fields[0] = p.id;
  fields[1] = p.name;
  fields[4] = p.latitude;
  fields[5] = p.longitude;
  fields[8] = p.country;
  fields[10] = p.admin1 ?? "";
  fields[14] = p.population ?? "1000";
  fields[17] = p.zone ?? "Europe/Moscow";
  return fields.join("\t");
}

const MOSCOW = cityLine({ id: "524901", name: "Moscow", latitude: "55.75204", longitude: "37.61781", country: "RU", admin1: "48", population: "10381222" });
const PARIS = cityLine({ id: "2988507", name: "Paris", latitude: "48.85341", longitude: "2.3488", country: "FR", admin1: "11", population: "2138551", zone: "Europe/Paris" });
const ALT_MOSCOW = ["311864", "524901", "ru", "Москва", "1", "", "", "", "", ""].join("\t");
const ADMIN1_MOSCOW = ["RU.48", "Moscow", "Moscow", "524894"].join("\t");

// Строка alternateNamesV2: id записи, id объекта, язык, название, предпочтительное, короткое, разговорное, историческое, с, по
const altLine = (geonameId: string, language: string, name: string, flags: { preferred?: boolean; historic?: boolean; id?: string } = {}) =>
  [flags.id ?? "1", geonameId, language, name, flags.preferred ? "1" : "", "", "", flags.historic ? "1" : "", "", ""].join("	");

const LONDON = cityLine({ id: "2643743", name: "London", latitude: "51.50853", longitude: "-0.12574", country: "GB", admin1: "ENG", population: "8961989", zone: "Europe/London" });
const ADMIN1_ENGLAND = ["GB.ENG", "England", "England", "6269131"].join("	");
// Места от 1000 до 5000 жителей: есть только в cities1000
const SMALL_UZBEK = cityLine({ id: "1001", name: "Kleiner Ort", latitude: "41.3", longitude: "69.2", country: "UZ", population: "3000", zone: "Asia/Tashkent" });
const SMALL_FRENCH = cityLine({ id: "1002", name: "Petit Lieu", latitude: "46.1", longitude: "2.3", country: "FR", population: "3000", zone: "Europe/Paris" });

type Files = { cities5000?: string[]; cities1000?: string[]; alt?: string[]; admin1?: string[]; world?: string[] };

let workDir = "";
beforeEach(() => {
  workDir = mkdtempSync(path.join(tmpdir(), "geo-build-"));
});
afterEach(() => rmSync(workDir, { recursive: true, force: true }));

// Папка дампа с минимальным набором файлов; пустая строка в конце — как перевод строки в конце настоящих файлов
function writeDump(files: Files): string {
  const dump = path.join(workDir, "dump");
  const write = (relative: string, lines: string[]) => {
    mkdirSync(path.dirname(path.join(dump, relative)), { recursive: true });
    writeFileSync(path.join(dump, relative), `${lines.join("\n")}\n`);
  };
  write("cities5000/cities5000.txt", files.cities5000 ?? [MOSCOW, PARIS]);
  write("cities1000/cities1000.txt", files.cities1000 ?? [MOSCOW, PARIS]);
  for (const country of ["RU", "BY", "KZ", "UA"]) write(`alt-${country}/${country}.txt`, country === "RU" ? (files.alt ?? [ALT_MOSCOW]) : []);
  write("admin1CodesASCII.txt", files.admin1 ?? [ADMIN1_MOSCOW]);
  if (files.world) write("alt-world/alternateNamesV2.txt", files.world);
  return dump;
}

function runBuild(dump: string, ...extra: string[]) {
  const output = path.join(workDir, "out", "cities.json");
  const result = spawnSync(process.execPath, [SCRIPT, dump, "--out", output, ...extra], { encoding: "utf8" });
  return { status: result.status, stderr: result.stderr, stdout: result.stdout, output };
}

describe("build-cities.mjs", () => {
  test("builds a valid fixture (an empty trailing line is fine)", () => {
    const run = runBuild(writeDump({}), "--min-cities", "2");

    expect(run.status).toBe(0);
    const data = JSON.parse(readFileSync(run.output, "utf8")) as { rows: unknown[][] };
    expect(data.rows).toHaveLength(2);
    expect(data.rows[0]).toHaveLength(COMPACT_ROW_COLUMNS);
    expect(data.rows[0]?.[1]).toBe("Москва");
  });

  describe("with alt-world/alternateNamesV2.txt", () => {
    const WORLD_FILES: Files = {
      cities5000: [MOSCOW, LONDON],
      cities1000: [MOSCOW, LONDON, SMALL_UZBEK, SMALL_FRENCH],
      admin1: [ADMIN1_MOSCOW, ADMIN1_ENGLAND],
      world: [
        altLine("2643743", "en", "London", { preferred: true }),
        altLine("2643743", "ru", "Лондиний", { historic: true, preferred: true }),
        altLine("2643743", "ru", "Лондон"),
        altLine("2643743", "ru", "Ландан", { preferred: true }),
        altLine("6269131", "ru", "Англия"),
        altLine("1001", "ru", "Малый Ор́т"),
      ],
    };
    const cityByName = (output: string) => {
      const data = JSON.parse(readFileSync(output, "utf8")) as { regions: string[]; rows: [number, string, number, ...unknown[]][] };
      return { data, find: (id: number) => data.rows.find((row) => row[0] === id) };
    };

    test("takes Russian names from it for a city outside the former USSR, ignoring historic rows, and for regions", () => {
      const run = runBuild(writeDump(WORLD_FILES), "--min-cities", "1");

      expect(run.status).toBe(0);
      const { data, find } = cityByName(run.output);
      // Предпочтительное название выигрывает у первого; историческое (хотя и «предпочтительное») не берётся
      expect(find(2643743)?.[1]).toBe("Ландан");
      expect(data.regions[find(2643743)?.[2] ?? -1]).toBe("Англия");
    });

    test("is the only source: the per-country files are not read and a place without a Russian row keeps the GeoNames name", () => {
      const run = runBuild(writeDump(WORLD_FILES), "--min-cities", "1");

      const { find } = cityByName(run.output);
      expect(find(524901)?.[1]).toBe("Moscow"); // в alt-RU есть «Москва», но alt-world главнее
    });

    test("removes the stress mark from a Russian name", () => {
      const run = runBuild(writeDump(WORLD_FILES), "--min-cities", "1");

      expect(cityByName(run.output).find(1001)?.[1]).toBe("Малый Орт");
    });

    test("keeps a 1000-5000 place of a former USSR country and drops a similar place elsewhere", () => {
      const run = runBuild(writeDump(WORLD_FILES), "--min-cities", "1");

      const { find } = cityByName(run.output);
      expect(find(1001)).toBeDefined();
      expect(find(1002)).toBeUndefined();
      expect(find(2643743)).toBeDefined();
    });

    // В GeoNames латинские транслитерации иногда помечены языком ru и стоят в файле раньше кириллицы
    test("takes only Cyrillic Russian names: a Latin ru row with a lower id does not beat the Cyrillic one", () => {
      const run = runBuild(
        writeDump({
          ...WORLD_FILES,
          world: [
            altLine("2643743", "ru", "Londonn", { id: "10", preferred: true }),
            altLine("2643743", "ru", "Лондон", { id: "11" }),
            altLine("6269131", "ru", "Angliya", { id: "12", preferred: true }),
            altLine("6269131", "ru", "Англия", { id: "13" }),
          ],
        }),
        "--min-cities",
        "1",
      );

      const { data, find } = cityByName(run.output);
      expect(find(2643743)?.[1]).toBe("Лондон");
      expect(data.regions[find(2643743)?.[2] ?? -1]).toBe("Англия");
    });

    test("keeps the GeoNames name for a place and a region whose only ru rows are Latin", () => {
      const run = runBuild(writeDump({ ...WORLD_FILES, world: [altLine("2643743", "ru", "Londonn", { preferred: true }), altLine("6269131", "ru", "Angliya")] }), "--min-cities", "1");

      const { data, find } = cityByName(run.output);
      expect(find(2643743)?.[1]).toBe("London");
      expect(data.regions[find(2643743)?.[2] ?? -1]).toBe("England");
    });

    test("fails loudly on a malformed 9-column row and writes nothing", () => {
      const malformed = ["1", "2643743", "ru", "Лондон", "1", "", "", "", ""].join("	");
      const run = runBuild(writeDump({ ...WORLD_FILES, world: [...(WORLD_FILES.world ?? []), malformed] }), "--min-cities", "1");

      expect(run.status).toBe(1);
      expect(run.stderr).toContain(`alternateNamesV2.txt:${(WORLD_FILES.world?.length ?? 0) + 1}`);
      expect(run.stderr).toContain("10 tab-separated columns");
      expect(existsSync(run.output)).toBe(false);
    });

    test("fails loudly on an unparsable geonameid in a Russian row", () => {
      const run = runBuild(writeDump({ ...WORLD_FILES, world: [altLine("x", "ru", "Что-то")] }), "--min-cities", "1");

      expect(run.status).toBe(1);
      expect(run.stderr).toContain("alternateNamesV2.txt:1");
      expect(run.stderr).toContain("geonameid");
      expect(existsSync(run.output)).toBe(false);
    });
  });

  test("the per-country files follow the same Cyrillic-only rule", () => {
    const alt = [["1", "524901", "ru", "Moskva", "1", "", "", "", "", ""].join("	"), ALT_MOSCOW];
    const run = runBuild(writeDump({ alt }), "--min-cities", "1");

    expect(run.status).toBe(0);
    const names = (JSON.parse(readFileSync(run.output, "utf8")) as { rows: [number, string][] }).rows.map((row) => row[1]);
    expect(names).toContain("Москва");
    expect(names).not.toContain("Moskva");
  });

  test("without alt-world falls back to the per-country files: Russian names only for RU/BY/KZ/UA", () => {
    const run = runBuild(writeDump({ cities5000: [MOSCOW, LONDON], cities1000: [MOSCOW, LONDON], admin1: [ADMIN1_MOSCOW, ADMIN1_ENGLAND] }), "--min-cities", "1");

    expect(run.status).toBe(0);
    const names = (JSON.parse(readFileSync(run.output, "utf8")) as { rows: [number, string][] }).rows.map((row) => row[1]);
    expect(names).toEqual(["Москва", "London"]);
  });

  test.each([
    ["unparsable latitude", { cities5000: [MOSCOW, cityLine({ id: "1", name: "Bad", latitude: "north", longitude: "1", country: "FR" })] }, "cities5000.txt:2", "latitude"],
    ["unparsable longitude", { cities5000: [MOSCOW, cityLine({ id: "1", name: "Bad", latitude: "1", longitude: "", country: "FR" })] }, "cities5000.txt:2", "longitude"],
    ["unparsable id", { cities1000: [MOSCOW, PARIS, cityLine({ id: "abc", name: "Bad", latitude: "1", longitude: "1", country: "RU" })] }, "cities1000.txt:3", "geonameid"],
    ["unparsable population", { cities5000: [cityLine({ id: "1", name: "Bad", latitude: "1", longitude: "1", country: "FR", population: "many" })] }, "cities5000.txt:1", "population"],
    ["a city row with too few columns", { cities5000: [MOSCOW, "524901\tMoscow\tMoscow"] }, "cities5000.txt:2", "at least 19"],
    ["an alternate-name row with the wrong column count", { alt: [ALT_MOSCOW, "311865\t524901\tru"] }, "RU.txt:2", "10 tab-separated columns"],
    ["an admin1 row with the wrong column count", { admin1: [ADMIN1_MOSCOW, "RU.49\tSomewhere"] }, "admin1CodesASCII.txt:2", "4 tab-separated columns"],
    ["an admin1 row with an unparsable id", { admin1: ["RU.48\tMoscow\tMoscow\tx"] }, "admin1CodesASCII.txt:1", "geonameid"],
  ] as [string, Files, string, string][])("fails loudly on %s and writes nothing", (_label, files, where, problem) => {
    const run = runBuild(writeDump(files), "--min-cities", "1");

    expect(run.status).toBe(1);
    expect(run.stderr).toContain(where);
    expect(run.stderr).toContain(problem);
    expect(existsSync(run.output)).toBe(false);
  });

  test("fails when fewer cities than the floor were built (a truncated dump) and writes nothing", () => {
    const run = runBuild(writeDump({}));

    expect(run.status).toBe(1);
    expect(run.stderr).toContain("fewer than the minimum of 60000");
    expect(existsSync(run.output)).toBe(false);
  });
});
