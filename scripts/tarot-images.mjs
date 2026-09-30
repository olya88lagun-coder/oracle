// Картинки таро: скачивает сканы колоды Райдер–Уэйт (Памела Колман Смит, 1909) с Викисклада, проверяет лицензию
// и делает три размера webp в apps/web/public/taro. Запуск: node scripts/tarot-images.mjs [--only slug,slug]
// Node 24 читает манифест колоды напрямую из .ts (типы вырезаются при загрузке)
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { TAROT_DECK, tarotFileName } from "../packages/content/src/tarot-deck.ts";

const API = "https://commons.wikimedia.org/w/api.php";
const OUT = "apps/web/public/taro";
const SOURCES = "packages/content/tarot-sources.json";
const SIZES = [
  { suffix: "", height: 960 },
  { suffix: "-480", height: 480 },
  { suffix: "-160", height: 160 },
];
const PUBLIC_DOMAIN = /^(pd|public domain|cc0)/i;
const PAUSE_MS = 400;
const HEADERS = { "user-agent": "oracle-tarot-images/1.0 (https://tvoy-orakul.ru; administrator contact via site)" };

const MAJOR_FILES = {
  shut: "RWS_Tarot_00_Fool.jpg",
  mag: "RWS_Tarot_01_Magician.jpg",
  "verkhovnaya-zhrica": "RWS_Tarot_02_High_Priestess.jpg",
  imperatrica: "RWS_Tarot_03_Empress.jpg",
  imperator: "RWS_Tarot_04_Emperor.jpg",
  ierofant: "RWS_Tarot_05_Hierophant.jpg",
  vlyublennye: "RWS_Tarot_06_Lovers.jpg",
  kolesnica: "RWS_Tarot_07_Chariot.jpg",
  sila: "RWS_Tarot_08_Strength.jpg",
  otshelnik: "RWS_Tarot_09_Hermit.jpg",
  "koleso-fortuny": "RWS_Tarot_10_Wheel_of_Fortune.jpg",
  spravedlivost: "RWS_Tarot_11_Justice.jpg",
  poveshennyj: "RWS_Tarot_12_Hanged_Man.jpg",
  smert: "RWS_Tarot_13_Death.jpg",
  umerennost: "RWS_Tarot_14_Temperance.jpg",
  dyavol: "RWS_Tarot_15_Devil.jpg",
  bashnya: "RWS_Tarot_16_Tower.jpg",
  zvezda: "RWS_Tarot_17_Star.jpg",
  luna: "RWS_Tarot_18_Moon.jpg",
  solnce: "RWS_Tarot_19_Sun.jpg",
  sud: "RWS_Tarot_20_Judgement.jpg",
  mir: "RWS_Tarot_21_World.jpg",
};
const MINOR_PREFIX = { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pents" };

export function commonsFile(card) {
  if (card.suit === "major") return MAJOR_FILES[card.slug];
  return `${MINOR_PREFIX[card.suit]}${String(card.rank).padStart(2, "0")}.jpg`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function commonsInfo(file) {
  const url = `${API}?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&titles=${encodeURIComponent(`File:${file}`)}`;
  const data = await (await fetch(url, { headers: HEADERS })).json();
  const meta = Object.values(data.query.pages)[0]?.imageinfo?.[0];
  if (!meta) throw new Error(`Нет файла на Викискладе: ${file}`);
  const license = meta.extmetadata?.LicenseShortName?.value ?? "";
  // Любая лицензия, кроме общественного достояния, останавливает работу: такие картинки сюда не попадают
  if (!PUBLIC_DOMAIN.test(license)) throw new Error(`Лицензия ${file}: «${license}» — не общественное достояние, остановка`);
  return { url: meta.url, license, author: (meta.extmetadata?.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim() };
}

async function download(url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, { headers: HEADERS });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    // Викисклад просит подождать при частых запросах
    await sleep(PAUSE_MS * attempt * 4);
  }
  throw new Error(`Не удалось скачать ${url}`);
}

async function run() {
  const only = process.argv.includes("--only") ? new Set(process.argv[process.argv.indexOf("--only") + 1].split(",")) : null;
  mkdirSync(OUT, { recursive: true });
  const sources = {};
  for (const card of TAROT_DECK) {
    if (only && !only.has(card.slug)) continue;
    const file = commonsFile(card);
    const info = await commonsInfo(file);
    const original = await download(info.url);
    for (const { suffix, height } of SIZES) {
      // Без увеличения: маленький скан остаётся в своём размере
      await sharp(original).resize({ height, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`${OUT}/${tarotFileName(card)}${suffix}.webp`);
    }
    sources[card.slug] = { file, url: info.url, license: info.license, author: info.author, checkedAt: new Date().toISOString().slice(0, 10) };
    console.log(`${tarotFileName(card)}  ${info.license}`);
    await sleep(PAUSE_MS);
  }
  if (!only) writeFileSync(SOURCES, `${JSON.stringify(sources, null, 2)}\n`, "utf8");
}

if (import.meta.main) await run();
