// Сборка packages/geo/data/cities.json из дампов GeoNames (CC BY 4.0, https://www.geonames.org).
// Запуск: node packages/geo/scripts/build-cities.mjs C:\dev\geonames
// Подробности и состав файлов — в packages/geo/README.md.
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

// Страны, для которых берём места от 1000 жителей и русские названия
const RUSSIAN_COUNTRIES = ["RU", "BY", "KZ", "UA"];
const COORDINATE_FACTOR = 10_000; // 4 знака после запятой

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("Usage: node packages/geo/scripts/build-cities.mjs <folder with the GeoNames files>");
  process.exit(1);
}
const outputFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/cities.json");

async function* readLines(file) {
  const lines = readline.createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of lines) if (line !== "") yield line;
}

// Строки geoname: нужные поля по номеру колонки
function parseCity(line) {
  const f = line.split("\t");
  return {
    id: Number(f[0]),
    name: f[1] ?? "",
    latitude: Number(f[4]),
    longitude: Number(f[5]),
    countryCode: f[8] ?? "",
    admin1Code: f[10] ?? "",
    population: Number(f[14] ?? 0) || 0,
    zone: f[17] ?? "",
  };
}

async function readCities() {
  const byId = new Map();
  for await (const line of readLines(path.join(sourceDir, "cities5000", "cities5000.txt"))) {
    const city = parseCity(line);
    byId.set(city.id, city);
  }
  const fromWorld = byId.size;
  for await (const line of readLines(path.join(sourceDir, "cities1000", "cities1000.txt"))) {
    const city = parseCity(line);
    if (RUSSIAN_COUNTRIES.includes(city.countryCode) && !byId.has(city.id)) byId.set(city.id, city);
  }
  return { byId, fromWorld };
}

async function readAdmin1() {
  const byCode = new Map();
  for await (const line of readLines(path.join(sourceDir, "admin1CodesASCII.txt"))) {
    const [code, name, , geonameId] = line.split("\t");
    if (code) byCode.set(code, { name: name ?? "", id: Number(geonameId) });
  }
  return byCode;
}

// В нескольких русских названиях GeoNames стоит знак ударения (U+0301): он мешает поиску по началу слова
const stripStress = (text) => text.replaceAll("́", "");

// Русские названия нужных объектов: не исторические, предпочтительное, иначе первое по порядку в файле
async function readRussianNames(wantedIds) {
  const picked = new Map();
  for (const country of RUSSIAN_COUNTRIES) {
    for await (const line of readLines(path.join(sourceDir, `alt-${country}`, `${country}.txt`))) {
      const f = line.split("\t");
      if (f[2] !== "ru" || f[7] === "1") continue;
      const id = Number(f[1]);
      if (!wantedIds.has(id)) continue;
      const preferred = f[4] === "1";
      const current = picked.get(id);
      if (!current || (preferred && !current.preferred)) picked.set(id, { name: stripStress(f[3] ?? ""), preferred });
    }
  }
  return new Map([...picked].map(([id, value]) => [id, value.name]));
}

const stats = { fromWorld: 0, total: 0, emptyZone: 0, noRussianName: 0, noRegion: 0, countryFallback: 0 };

const { byId, fromWorld } = await readCities();
stats.fromWorld = fromWorld;
const admin1 = await readAdmin1();

const regionKey = (city) => `${city.countryCode}.${city.admin1Code}`;
const wanted = new Set();
for (const city of byId.values()) {
  if (!RUSSIAN_COUNTRIES.includes(city.countryCode)) continue;
  wanted.add(city.id);
  const region = admin1.get(regionKey(city));
  if (region) wanted.add(region.id);
}
const russian = await readRussianNames(wanted);

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
