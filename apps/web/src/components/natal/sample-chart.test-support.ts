import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BODIES, computeNatalChart, findAspects, signOf, type BodyId, type ChartPoint, type Cusps, type NatalChart } from "@oracle/core/natal";
import { CITIES, type City } from "@oracle/geo";
import { planCalculation } from "@/lib/natal-calc";
import type { NatalInput } from "@/lib/natal-input";
import { buildBirthMoment, type ZoneChoice } from "@/lib/natal-moment";

// Общие данные для тестов компонентов калькулятора (не входит в бандл страницы: файл .test-support.ts).
// Образец — Москва, 7 марта 1990, 12:00 из принятого макета (docs/design/mockups/natal, файлы только для чтения).

export const MOCKUP_DIR = fileURLToPath(new URL("../../../../../docs/design/mockups/natal/", import.meta.url));
export const readMockup = (name: string): string => readFileSync(`${MOCKUP_DIR}${name}`, "utf8");

type Contract = {
  sample_points: { id: string; longitude: number; degrees: string; house: number; retrograde: boolean }[];
  cusps: number[];
};
const contract = JSON.parse(readMockup("visual-contract.json")) as Contract;

const SAMPLE_ASCENDANT = 104.13;
const SAMPLE_MIDHEAVEN = 335.64;
const chartId = (id: string): ChartPoint["id"] => (id === "node" ? "northNode" : (id as BodyId));

// «16°32′» → 16 + 32/60 (подпись градусов в рисунке считалась по неокруглённой долготе, поэтому берём её из контракта)
const degreesOf = (text: string): number => {
  const match = /^(\d+)°(\d{2})′$/.exec(text);
  if (!match) throw new Error(`не разобрать ${text}`);
  return Number(match[1]) + Number(match[2]) / 60;
};

// Карта из округлённых чисел принятого образца: колесо по ней совпадает с natal-wheel.svg (со временем) и natal-wheel-no-time.svg (без)
export function sampleChart(withTime: boolean): NatalChart {
  const points: ChartPoint[] = contract.sample_points.map((sample) => ({
    id: chartId(sample.id),
    longitude: sample.longitude,
    sign: signOf(sample.longitude).sign,
    degree: degreesOf(sample.degrees),
    retrograde: sample.retrograde,
    house: withTime ? sample.house : null,
  }));
  const longitudes = Object.fromEntries(BODIES.map((body) => [body, points.find((point) => point.id === body)?.longitude ?? Number.NaN])) as Record<BodyId, number>;
  const aspectBodies = withTime ? BODIES : BODIES.filter((body) => body !== "moon");
  return {
    points,
    ascendant: withTime ? { longitude: SAMPLE_ASCENDANT, ...signOf(SAMPLE_ASCENDANT) } : null,
    midheaven: withTime ? { longitude: SAMPLE_MIDHEAVEN, ...signOf(SAMPLE_MIDHEAVEN) } : null,
    houses: withTime ? { system: "placidus", cusps: contract.cusps as Cusps } : null,
    aspects: findAspects(longitudes, aspectBodies),
    uncertainSigns: withTime ? [] : ["moon"],
    timeKnown: withTime,
  };
}

export const SAMPLE_BIRTH = { city: "Москва", date: "1990-03-07", time: "12:00" } as const;

export function cityNamed(name: string, country = "Россия"): City {
  const found = CITIES.find((candidate) => candidate.name === name && candidate.country === country);
  if (!found) throw new Error(`В базе городов нет «${name}»`);
  return found;
}

// Настоящий расчёт ядра для города из базы
export function realCalculation(city: string, date: string, time: string | null, choice: ZoneChoice | null = null) {
  const input: NatalInput = { date, time, city: cityNamed(city) };
  const outcome = planCalculation(input, choice, { buildBirthMoment, computeNatalChart });
  return { input, outcome };
}

export function realChart(city: string, date: string, time: string | null): NatalChart {
  const { outcome } = realCalculation(city, date, time);
  if (outcome.kind !== "chart") throw new Error("Для этого времени нужен выбор");
  return outcome.chart;
}
