import type { Aspect } from "./aspects";
import type { BodyId } from "./bodies";
import type { NatalChart } from "./chart";
import type { SignId } from "./zodiac";

// Главы платного разбора натальной карты: порядок задаёт и оглавление, и порядок страницы разбора
export const NATAL_CHAPTER_IDS = ["core", "mind", "love", "action", "work", "growth", "depth", "aspects", "scenario"] as const;
export type NatalChapterId = (typeof NATAL_CHAPTER_IDS)[number];

export const NATAL_CHAPTER_TITLES: Readonly<Record<NatalChapterId, string>> = {
  core: "Ядро",
  mind: "Мышление и общение",
  love: "Любовь и ценности",
  action: "Энергия и действие",
  work: "Дело и деньги",
  growth: "Рост и испытания",
  depth: "Глубокие слои",
  aspects: "Главные аспекты",
  scenario: "Ваш сценарий",
};

export type ChapterPoint = { body: BodyId | "ascendant"; sign: SignId; house: number | null };
// points — положения, о которых глава; houses — дома, чьё описание глава добавляет сверх домов своих точек
export type NatalChapterOutline = { id: NatalChapterId; title: string; points: ChapterPoint[]; houses: number[] };

const BODIES_OF: Readonly<Record<NatalChapterId, readonly (BodyId | "ascendant")[]>> = {
  core: ["sun", "moon", "ascendant"],
  mind: ["mercury"],
  love: ["venus"],
  action: ["mars"],
  work: [],
  growth: ["jupiter", "saturn"],
  depth: ["uranus", "neptune", "pluto"],
  aspects: [],
  scenario: [],
};
const HOUSES_OF: Readonly<Record<NatalChapterId, readonly number[]>> = { core: [], mind: [], love: [7], action: [], work: [2, 6, 10], growth: [], depth: [], aspects: [], scenario: [] };

function pointOf(chart: NatalChart, body: BodyId | "ascendant"): ChapterPoint {
  if (body === "ascendant") {
    if (!chart.ascendant) throw new RangeError("Нужно время рождения");
    return { body, sign: chart.ascendant.sign, house: null };
  }
  const point = chart.points.find((item) => item.id === body);
  if (!point) throw new RangeError(`Нет тела ${body}`);
  return { body, sign: point.sign, house: point.house };
}

// Разбор строится по домам и асцеденту, поэтому без времени рождения он невозможен
export function natalChapterOutline(chart: NatalChart): NatalChapterOutline[] {
  if (!chart.timeKnown || !chart.ascendant || !chart.houses) throw new RangeError("Нужно время рождения");
  return NATAL_CHAPTER_IDS.map((id) => ({ id, title: NATAL_CHAPTER_TITLES[id], points: BODIES_OF[id].map((body) => pointOf(chart, body)), houses: [...HOUSES_OF[id]] }));
}

const MAIN_ASPECTS = 7;

// Аспекты карты идут от самых точных: берём первые
export function mainAspects(chart: NatalChart, limit: number = MAIN_ASPECTS): Aspect[] {
  return chart.aspects.slice(0, limit);
}
