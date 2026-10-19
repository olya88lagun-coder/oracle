import { describe, expect, test } from "vitest";
import { computeNatalChart } from "./chart";
import reference from "./reference-charts.json";

// Сверка расчёта с независимыми эталонами: NASA/JPL Horizons (эфемериды DE441) и Swiss Ephemeris.
// Значения лежат в reference-charts.json вместе с описанием источников и запросов; они взяты из этих источников, а не из нашего кода.
// Допуски — в градусах; фактические отклонения на момент сверки (19–20 октября 2026) указаны рядом и в docs/natal-accuracy.md.

const SECOND = 1 / 3600;
const wrap = (delta: number): number => ((delta + 540) % 360) - 180;
const gap = (a: number, b: number): number => Math.abs(wrap(a - b));

// Планеты, Солнце, Луна: библиотека astronomy-engine заявляет точность порядка угловой минуты; фактически до ≈ 18″ (Нептун, Венера).
const BODY_TOLERANCE = 30 * SECOND;
// Асцендент, МС и куспиды: сходятся с Swiss Ephemeris до 0,2″ (запас на разницу в обороте Земли и нутации).
const HOUSE_TOLERANCE = 2 * SECOND;
// Средний узел: у нас по формуле Мееуса без нутации, у Swiss с нутацией (≈ ±17″) — разница до 26″.
const NODE_TOLERANCE = 40 * SECOND;
// Два эталона должны согласоваться между собой: иначе непонятно, чему верить
const REFERENCES_AGREE = 5 * SECOND;

type Body = { horizons: number; swiss: number; retrograde: boolean };

describe("reference charts (JPL Horizons and Swiss Ephemeris)", () => {
  test("have provenance, fourteen cases, both hemispheres, a polar case and the earliest allowed date", () => {
    expect(reference.sources.horizons).toMatch(/DE441/);
    expect(reference.sources.swissEphemeris).toMatch(/Swiss Ephemeris/);
    expect(reference.cases).toHaveLength(14);
    expect(reference.cases.some((item) => item.latitude < 0)).toBe(true);
    expect(reference.cases.some((item) => Math.abs(item.latitude) > 66)).toBe(true);
    expect(reference.cases.some((item) => item.utc.startsWith("1900-01-01"))).toBe(true);
  });

  test("the two references agree with each other on every body", () => {
    for (const item of reference.cases) {
      for (const [id, body] of Object.entries(item.bodies as Record<string, Body>)) {
        expect(gap(body.horizons, body.swiss), `${item.id} ${id}`).toBeLessThanOrEqual(REFERENCES_AGREE);
      }
    }
  });

  describe.each(reference.cases)("$label", (item) => {
    const chart = computeNatalChart({ instant: new Date(item.utc), latitude: item.latitude, longitude: item.longitude, timeKnown: true });

    test("every planet is within the tolerance of both references, and the direction of motion agrees", () => {
      for (const point of chart.points) {
        if (point.id === "northNode") continue;
        const body = (item.bodies as Record<string, Body>)[point.id];
        expect(body, point.id).toBeDefined();
        if (!body) continue;
        expect(gap(point.longitude, body.horizons), `${point.id} против Horizons`).toBeLessThanOrEqual(BODY_TOLERANCE);
        expect(gap(point.longitude, body.swiss), `${point.id} против Swiss Ephemeris`).toBeLessThanOrEqual(BODY_TOLERANCE);
        expect(point.retrograde, `${point.id} обратное движение`).toBe(body.retrograde);
      }
    });

    test("the mean lunar node is close to the Swiss mean node and always retrograde", () => {
      const node = chart.points.find((point) => point.id === "northNode");
      expect(node && gap(node.longitude, item.meanNode)).toBeLessThanOrEqual(NODE_TOLERANCE);
      expect(node?.retrograde).toBe(true);
    });

    test("the ascendant, the midheaven and all twelve cusps match, in the same house system", () => {
      expect(chart.houses?.system).toBe(item.houses.system);
      expect(gap(chart.ascendant?.longitude ?? NaN, item.houses.ascendant)).toBeLessThanOrEqual(HOUSE_TOLERANCE);
      expect(gap(chart.midheaven?.longitude ?? NaN, item.houses.midheaven)).toBeLessThanOrEqual(HOUSE_TOLERANCE);
      chart.houses?.cusps.forEach((cusp, index) => {
        expect(gap(cusp, item.houses.cusps[index] ?? NaN), `куспид ${index + 1}`).toBeLessThanOrEqual(HOUSE_TOLERANCE);
      });
    });
  });
});
