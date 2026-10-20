// Как получены packages/core/src/natal/reference-charts.json (запускается вручную, в тестах и CI не участвует).
// Нужен Node 24 и пакет sweph в отдельной временной папке:  mkdir tmp && cd tmp && npm init -y && npm install sweph
// затем скопировать сюда этот файл, запустить `node natal-reference.mjs` и перенести значения в reference-charts.json
// (округлить до 7 знаков, оставить блок sources). Запросы идут на ssd.jpl.nasa.gov; Horizons отдаёт строки по возрастанию времени.
// Эталонные значения для проверки расчёта натальной карты.
// JPL Horizons (https://ssd.jpl.nasa.gov/api/horizons.api): геоцентрическая кажущаяся эклиптическая долгота даты (ObsEcLon, QUANTITIES=31)
// Swiss Ephemeris (npm sweph 2.10.03, режим Moshier без файлов): планеты, средний узел, куспиды домов, асцендент, МС
import sweph from "sweph";
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const CASES = [
  { id: "moscow-1990-sample", label: "Москва, образец плана: 7 марта 1990, 12:00 по Москве", utc: "1990-03-07T09:00:00Z", latitude: 55.7558, longitude: 37.6173 },
  { id: "greenwich-j2000", label: "Гринвич, 1 января 2000, 12:00 UTC (J2000)", utc: "2000-01-01T12:00:00Z", latitude: 51.4779, longitude: 0 },
  { id: "new-york-1969", label: "Нью-Йорк, 20 июля 1969, 20:17 UTC", utc: "1969-07-20T20:17:00Z", latitude: 40.7128, longitude: -74.006 },
  { id: "sydney-1985", label: "Сидней, 25 декабря 1985, 03:30 UTC (южное полушарие)", utc: "1985-12-25T03:30:00Z", latitude: -33.8688, longitude: 151.2093 },
  { id: "murmansk-1990", label: "Мурманск, 7 марта 1990, 09:00 UTC (за полярным кругом, дома Порфирия)", utc: "1990-03-07T09:00:00Z", latitude: 68.9585, longitude: 33.0827 },
  { id: "reykjavik-1975", label: "Рейкьявик, 21 июня 1975, 12:00 UTC (64°, предел Плацидуса)", utc: "1975-06-21T12:00:00Z", latitude: 64.1466, longitude: -21.9426 },
  { id: "quito-1999", label: "Кито, 9 сентября 1999, 09:09 UTC (экватор)", utc: "1999-09-09T09:09:00Z", latitude: -0.1807, longitude: -78.4678 },
  { id: "london-1900", label: "Лондон, 1 января 1900, 12:00 UTC (начало допустимых дат)", utc: "1900-01-01T12:00:00Z", latitude: 51.5074, longitude: -0.1278 },
  { id: "moscow-1905", label: "Москва, 5 мая 1905, 08:00 UTC", utc: "1905-05-05T08:00:00Z", latitude: 55.7558, longitude: 37.6173 },
  { id: "moscow-2024-ingress", label: "Москва, 20 марта 2024, 06:00 UTC (сразу после вхождения Солнца в Овен)", utc: "2024-03-20T06:00:00Z", latitude: 55.7558, longitude: 37.6173 },
  { id: "tokyo-2023", label: "Токио, 14 октября 2023, 18:00 UTC", utc: "2023-10-14T18:00:00Z", latitude: 35.6762, longitude: 139.6503 },
  { id: "cape-town-1960", label: "Кейптаун, 29 февраля 1960, 00:00 UTC (високосный день)", utc: "1960-02-29T00:00:00Z", latitude: -33.9249, longitude: 18.4241 },
  { id: "moscow-1980-mercury-retro", label: "Москва, 15 апреля 1980, 12:00 UTC", utc: "1980-04-15T12:00:00Z", latitude: 55.7558, longitude: 37.6173 },
  { id: "singapore-2010", label: "Сингапур, 10 октября 2010, 02:00 UTC", utc: "2010-10-10T02:00:00Z", latitude: 1.3521, longitude: 103.8198 },
];

const BODIES = [
  ["sun", "10", sweph.constants.SE_SUN],
  ["moon", "301", sweph.constants.SE_MOON],
  ["mercury", "199", sweph.constants.SE_MERCURY],
  ["venus", "299", sweph.constants.SE_VENUS],
  ["mars", "499", sweph.constants.SE_MARS],
  ["jupiter", "599", sweph.constants.SE_JUPITER],
  ["saturn", "699", sweph.constants.SE_SATURN],
  ["uranus", "799", sweph.constants.SE_URANUS],
  ["neptune", "899", sweph.constants.SE_NEPTUNE],
  ["pluto", "999", sweph.constants.SE_PLUTO],
];

const jd = (utc) => Date.parse(utc) / 86_400_000 + 2440587.5;
const jds = CASES.map((c) => jd(c.utc));

async function horizons(command) {
  const params = new URLSearchParams({
    format: "text",
    COMMAND: `'${command}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    TLIST: `'${jds.map((value) => value.toFixed(8)).join(" ")}'`,
    QUANTITIES: "'31'",
    ANG_FORMAT: "'DEG'",
    CSV_FORMAT: "'YES'",
  });
  // Запрос через curl: встроенный fetch Node 24 получает ECONNRESET от этого сервера
  const text = execFileSync("curl", ["-s", "--max-time", "90", "--retry", "3", `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`], { encoding: "utf8", maxBuffer: 10_000_000 });
  const block = text.split("$$SOE")[1]?.split("$$EOE")[0];
  if (!block) throw new Error(`Horizons ${command}: ${text.slice(0, 300)}`);
  const rows = block.trim().split("\n").map((line) => line.split(",").map((cell) => cell.trim()));
  if (rows.length !== CASES.length) throw new Error(`Horizons ${command}: ${rows.length} строк вместо ${CASES.length}`);
  // Столбцы: дата, два пустых флага, ObsEcLon, ObsEcLat. Horizons отдаёт строки по возрастанию времени, а не в порядке TLIST
  const order = jds.map((value, index) => [value, index]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([, index]) => index);
  const byCase = [];
  rows.forEach((row, position) => (byCase[order[position]] = Number(row[3])));
  return byCase;
}

const flags = sweph.constants.SEFLG_MOSEPH | sweph.constants.SEFLG_SPEED;
const norm = (x) => ((x % 360) + 360) % 360;

const horizonsByBody = {};
for (const [id, command] of BODIES) horizonsByBody[id] = await horizons(command);

const out = [];
for (const [index, item] of CASES.entries()) {
  const date = jds[index];
  const bodies = {};
  for (const [id, , number] of BODIES) {
    const r = sweph.calc_ut(date, number, flags);
    if (r.flag < 0) throw new Error(r.error);
    bodies[id] = { horizons: horizonsByBody[id][index], swiss: norm(r.data[0]), retrograde: r.data[3] < 0 };
  }
  const node = sweph.calc_ut(date, sweph.constants.SE_MEAN_NODE, flags);
  const system = Math.abs(item.latitude) > 66 ? "O" : "P";
  const houses = sweph.houses_ex(date, 0, item.latitude, item.longitude, system);
  if (houses.flag < 0) throw new Error(`houses: ${houses.error}`);
  out.push({
    ...item,
    julianDayUt: date,
    bodies,
    meanNode: norm(node.data[0]),
    houses: { system: system === "P" ? "placidus" : "porphyry", cusps: houses.data.houses.map(norm), ascendant: norm(houses.data.points[0]), midheaven: norm(houses.data.points[1]) },
  });
}
writeFileSync("reference-raw.json", JSON.stringify({ retrieved: new Date().toISOString().slice(0, 10), swissEphemeris: sweph.version(), cases: out }, null, 2));
console.log(`cases: ${out.length}, swiss ${sweph.version()}`);
for (const row of out.slice(0, 2)) console.log(row.id, row.bodies.sun, row.houses.ascendant, row.houses.cusps.length);
