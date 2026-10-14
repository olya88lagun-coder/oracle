import { describe, expect, test } from "vitest";
import { computeNatalChart } from "./chart";

const MOSCOW = { latitude: 55.7558, longitude: 37.6173 };
const find = (chart: ReturnType<typeof computeNatalChart>, id: string) => chart.points.find((point) => point.id === id)!;

describe("computeNatalChart", () => {
  test("Moscow, 7 March 1990 12:00 MSK: Sun in Pisces, Moon in Cancer, Jupiter in Cancer, retrograde Pluto in Scorpio, Placidus houses", () => {
    const chart = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), ...MOSCOW, timeKnown: true });
    expect(find(chart, "sun")).toMatchObject({ sign: "pisces", retrograde: false });
    expect(find(chart, "sun").degree).toBeCloseTo(16.5, 0);
    expect(find(chart, "moon").sign).toBe("cancer");
    expect(find(chart, "jupiter").sign).toBe("cancer");
    expect(find(chart, "pluto")).toMatchObject({ sign: "scorpio", retrograde: true });
    expect(chart.ascendant).not.toBeNull();
    expect(chart.midheaven?.sign).toBe("pisces");
    expect(chart.houses?.system).toBe("placidus");
    expect(find(chart, "sun").house).toBe(10); // регрессия: при Плацидусе Солнце в 10-м, Луна во 2-м, Юпитер в 12-м
    expect(find(chart, "moon").house).toBe(2);
    expect(find(chart, "jupiter").house).toBe(12);
    expect(chart.points.every((point) => point.house !== null && point.house >= 1 && point.house <= 12)).toBe(true);
    expect(find(chart, "northNode").retrograde).toBe(true);
  });

  test("without a birth time there is no ascendant, midheaven or houses, and signs changed within the day are listed", () => {
    const chart = computeNatalChart({ instant: new Date("2024-03-20T09:00:00Z"), ...MOSCOW, timeKnown: false });
    expect(chart.ascendant).toBeNull();
    expect(chart.midheaven).toBeNull();
    expect(chart.houses).toBeNull();
    expect(chart.points.every((point) => point.house === null)).toBe(true);
    expect(chart.uncertainSigns).toContain("sun"); // 20 марта 2024 Солнце перешло из Рыб в Овен
  });

  test("with a known time nothing is reported as uncertain", () => {
    expect(computeNatalChart({ instant: new Date("2024-03-20T09:00:00Z"), ...MOSCOW, timeKnown: true }).uncertainSigns).toEqual([]);
  });

  test("beyond 66° N the houses are Porphyry, otherwise Placidus", () => {
    expect(computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), latitude: 68.9585, longitude: 33.0827, timeKnown: true }).houses?.system).toBe("porphyry");
    expect(computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), ...MOSCOW, timeKnown: true }).houses?.system).toBe("placidus");
  });

  test("works at the polar circle, west of 180° and in the Southern Hemisphere", () => {
    for (const place of [
      { latitude: 68.9585, longitude: 33.0827 },
      { latitude: 66.15, longitude: -169.8 },
      { latitude: -34.6, longitude: -58.38 },
    ]) {
      const chart = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), ...place, timeKnown: true });
      expect(Number.isFinite(chart.ascendant!.longitude)).toBe(true);
      expect(chart.houses!.cusps.every(Number.isFinite)).toBe(true);
      expect(chart.points.every((point) => Number.isFinite(point.longitude))).toBe(true);
    }
  });

  test("rejects an invalid moment and impossible coordinates", () => {
    expect(() => computeNatalChart({ instant: new Date(NaN), latitude: 0, longitude: 0, timeKnown: true })).toThrow(RangeError);
    expect(() => computeNatalChart({ instant: new Date(), latitude: 91, longitude: 0, timeKnown: true })).toThrow(RangeError);
    expect(() => computeNatalChart({ instant: new Date(), latitude: 0, longitude: 181, timeKnown: true })).toThrow(RangeError);
    expect(() => computeNatalChart({ instant: new Date(), latitude: Number.NaN, longitude: 0, timeKnown: true })).toThrow(RangeError);
  });
});
