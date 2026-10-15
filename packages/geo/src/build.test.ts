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

type Files = { cities5000?: string[]; cities1000?: string[]; alt?: string[]; admin1?: string[] };

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
