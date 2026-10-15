// Сборка packages/geo/data/cities.json из дампов GeoNames (CC BY 4.0, https://www.geonames.org).
// Запуск: node packages/geo/scripts/build-cities.mjs C:\dev\geonames [--out <файл>] [--min-cities <число>]
// Подробности и состав файлов — в packages/geo/README.md.
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

// Страны, для которых берём места от 1000 жителей и русские названия
const RUSSIAN_COUNTRIES = ["RU", "BY", "KZ", "UA"];
const COORDINATE_FACTOR = 10_000; // 4 знака после запятой
// Если городов меньше, дамп обрезан или прочитан не целиком (настоящая сборка даёт около 75 тысяч)
const MIN_CITIES = 60_000;
const CITY_COLUMNS = 19; // строка geoname
const ALTERNATE_NAME_COLUMNS = 10; // строка alternateNames
const ADMIN1_COLUMNS = 4; // строка admin1CodesASCII

// Ошибка разбора дампа: сообщение начинается с имени файла и номера строки
class DumpError extends Error {}

// Параметры: <папка с дампами> [--out <файл>] [--min-cities <число>]
function parseArguments(args) {
  const usage = "Usage: node packages/geo/scripts/build-cities.mjs <folder with the GeoNames files> [--out <file>] [--min-cities <number>]";
  const options = { sourceDir: "", outputFile: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/cities.json"), minCities: MIN_CITIES };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? "";
    if (arg === "--out") options.outputFile = path.resolve(args[(i += 1)] ?? "");
    else if (arg === "--min-cities") options.minCities = Number(args[(i += 1)]);
    else if (options.sourceDir === "") options.sourceDir = arg;
    else throw new DumpError(usage);
  }
  if (options.sourceDir === "" || !Number.isInteger(options.minCities) || options.minCities < 0) throw new DumpError(usage);
  return options;
}

// Строки файла по одной с проверкой числа колонок; пустые строки (например, после последнего перевода строки) пропускаются
async function* readRows(file, expectedColumns, exact) {
  const lines = readline.createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
  let number = 0;
  for await (const line of lines) {
    number += 1;
    if (line === "") continue;
    const fields = line.split("\t");
    const fail = (message) => new DumpError(`${file}:${number}: ${message}`);
    if (exact ? fields.length !== expectedColumns : fields.length < expectedColumns) {
      throw fail(`expected ${exact ? "" : "at least "}${expectedColumns} tab-separated columns, found ${fields.length}`);
    }
    yield { fields, fail };
  }
}

// Число из колонки: пустая или нечисловая строка — ошибка сборки, а не NaN (в JSON он превратился бы в null)
function finiteNumber(text, label, fail) {
  const value = text === "" ? Number.NaN : Number(text);
  if (!Number.isFinite(value)) throw fail(`${label} is not a finite number: "${text}"`);
  return value;
}

// Строки geoname: нужные поля по номеру колонки
function parseCity({ fields: f, fail }) {
  return {
    id: finiteNumber(f[0] ?? "", "geonameid", fail),
    name: f[1] ?? "",
    latitude: finiteNumber(f[4] ?? "", "latitude", fail),
    longitude: finiteNumber(f[5] ?? "", "longitude", fail),
    countryCode: f[8] ?? "",
    admin1Code: f[10] ?? "",
    population: f[14] === "" ? 0 : finiteNumber(f[14] ?? "", "population", fail),
    zone: f[17] ?? "",
  };
}

async function readCities(sourceDir) {
  const byId = new Map();
  for await (const row of readRows(path.join(sourceDir, "cities5000", "cities5000.txt"), CITY_COLUMNS, false)) {
    const city = parseCity(row);
    byId.set(city.id, city);
  }
  const fromWorld = byId.size;
  for await (const row of readRows(path.join(sourceDir, "cities1000", "cities1000.txt"), CITY_COLUMNS, false)) {
    const city = parseCity(row);
    if (RUSSIAN_COUNTRIES.includes(city.countryCode) && !byId.has(city.id)) byId.set(city.id, city);
  }
  return { byId, fromWorld };
}

async function readAdmin1(sourceDir) {
  const byCode = new Map();
  for await (const { fields, fail } of readRows(path.join(sourceDir, "admin1CodesASCII.txt"), ADMIN1_COLUMNS, true)) {
    const [code, name, , geonameId] = fields;
    if (code) byCode.set(code, { name: name ?? "", id: finiteNumber(geonameId ?? "", "geonameid", fail) });
  }
  return byCode;
}

// В нескольких русских названиях GeoNames стоит знак ударения (U+0301): он мешает поиску по началу слова
const stripStress = (text) => text.replaceAll("\u0301", "");

// Русские названия нужных объектов: не исторические, предпочтительное, иначе первое по порядку в файле
async function readRussianNames(sourceDir, wantedIds) {
  const picked = new Map();
  for (const country of RUSSIAN_COUNTRIES) {
    for await (const { fields: f, fail } of readRows(path.join(sourceDir, `alt-${country}`, `${country}.txt`), ALTERNATE_NAME_COLUMNS, true)) {
      if (f[2] !== "ru" || f[7] === "1") continue;
      const id = finiteNumber(f[1] ?? "", "geonameid", fail);
      if (!wantedIds.has(id)) continue;
      const preferred = f[4] === "1";
      const current = picked.get(id);
      if (!current || (preferred && !current.preferred)) picked.set(id, { name: stripStress(f[3] ?? ""), preferred });
    }
  }
  return new Map([...picked].map(([id, value]) => [id, value.name]));
}

async function build({ sourceDir, outputFile, minCities }) {
  const stats = { fromWorld: 0, total: 0, emptyZone: 0, noRussianName: 0, noRegion: 0, countryFallback: 0 };

  const { byId, fromWorld } = await readCities(sourceDir);
  stats.fromWorld = fromWorld;
  const admin1 = await readAdmin1(sourceDir);

  const regionKey = (city) => `${city.countryCode}.${city.admin1Code}`;
  const wanted = new Set();
  for (const city of byId.values()) {
    if (!RUSSIAN_COUNTRIES.includes(city.countryCode)) continue;
    wanted.add(city.id);
    const region = admin1.get(regionKey(city));
    if (region) wanted.add(region.id);
  }
  const russian = await readRussianNames(sourceDir, wanted);

  const countryNames = new Intl.DisplayNames(["ru"], { type: "region" });
  const kept = [];
  for (const city of byId.values()) {
    if (city.zone === "") {
      stats.emptyZone += 1;
      continue;
    }
    const isRussianSet = RUSSIAN_COUNTRIES.includes(city.countryCode);
    const region = admin1.get(regionKey(city));
    let name = city.name;
    let regionName = region?.name ?? "";
    if (isRussianSet) {
      const russianName = russian.get(city.id);
      if (russianName) name = russianName;
      else stats.noRussianName += 1;
      regionName = (region && russian.get(region.id)) || regionName;
    }
    if (regionName === "") stats.noRegion += 1;
    const country = countryNames.of(city.countryCode) ?? city.countryCode;
    if (country === city.countryCode) stats.countryFallback += 1;
    kept.push({ ...city, name, regionName, country });
  }
  stats.total = kept.length;
  if (kept.length < minCities) {
    throw new DumpError(`Only ${kept.length} cities were built, fewer than the minimum of ${minCities}: the dump looks truncated or incomplete. Nothing was written.`);
  }

  // Порядок строк: население по убыванию, при равенстве — по id
  kept.sort((a, b) => b.population - a.population || a.id - b.id);

  const zones = [];
  const countries = [];
  const regions = [];
  const indexer = (list) => {
    const positions = new Map();
    return (value) => {
      let position = positions.get(value);
      if (position === undefined) {
        position = list.length;
        list.push(value);
        positions.set(value, position);
      }
      return position;
    };
  };
  const zoneIndex = indexer(zones);
  const countryIndex = indexer(countries);
  const regionIndex = indexer(regions);
  const round = (value) => Math.round(value * COORDINATE_FACTOR) / COORDINATE_FACTOR;

  const rows = kept.map((city) => [city.id, city.name, regionIndex(city.regionName), countryIndex(city.country), round(city.latitude), round(city.longitude), zoneIndex(city.zone), city.population]);

  // Одна строка на город — аккуратные диффы при пересборке
  const json = `{"zones":${JSON.stringify(zones)},"countries":${JSON.stringify(countries)},"regions":${JSON.stringify(regions)},"rows":[\n${rows.map((row) => JSON.stringify(row)).join(",\n")}\n]}\n`;
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, json, "utf8");
  const { size } = await stat(outputFile);

  console.log(`Cities written: ${stats.total} (from cities5000: ${stats.fromWorld}, added from cities1000 for ${RUSSIAN_COUNTRIES.join("/")}: ${stats.total + stats.emptyZone - stats.fromWorld})`);
  console.log(`Without a Russian name (RU/BY/KZ/UA, GeoNames name kept): ${stats.noRussianName}`);
  console.log(`Without a region: ${stats.noRegion}`);
  console.log(`Dropped for an empty time zone: ${stats.emptyZone}${stats.emptyZone > 0 ? " (WARNING)" : ""}`);
  console.log(`Country name fell back to the code: ${stats.countryFallback}`);
  console.log(`Distinct zones: ${zones.length}, countries: ${countries.length}, regions: ${regions.length}`);
  console.log(`File: ${outputFile}, ${(size / 1024 / 1024).toFixed(2)} MB`);
}

try {
  await build(parseArguments(process.argv.slice(2)));
} catch (error) {
  console.error(`build-cities failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
