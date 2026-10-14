import * as Astronomy from "astronomy-engine";
import { describe, expect, test } from "vitest";
import { houseCusps, houseOf } from "./houses";
import { normalizeDegrees } from "./zodiac";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function context(iso: string, longitude: number) {
  const time = Astronomy.MakeTime(new Date(iso));
  return { obliquity: Astronomy.e_tilt(time).tobl * RAD, ramc: normalizeDegrees(Astronomy.SiderealTime(time) * 15 + longitude) };
}

// Прямое восхождение и склонение точки эклиптики
function equatorial(longitude: number, obliquity: number) {
  return {
    rightAscension: normalizeDegrees(Math.atan2(Math.sin(longitude * RAD) * Math.cos(obliquity), Math.cos(longitude * RAD)) * DEG),
    declination: Math.asin(Math.sin(obliquity) * Math.sin(longitude * RAD)) * DEG,
  };
}

const PLACES = [
  { name: "Москва", iso: "1990-03-07T09:00:00Z", latitude: 55.7558, longitude: 37.6173 },
  { name: "Москва, осень", iso: "2005-09-23T00:00:00Z", latitude: 55.7558, longitude: 37.6173 },
  { name: "Сочи, зима", iso: "1978-12-21T17:00:00Z", latitude: 43.5855, longitude: 39.7231 },
  { name: "Новосибирск", iso: "2011-07-01T05:00:00Z", latitude: 55.0084, longitude: 82.9357 },
  { name: "Буэнос-Айрес (юг)", iso: "1990-03-07T09:00:00Z", latitude: -34.6, longitude: -58.38 },
  { name: "65,9° с. ш. (граница Плацидуса)", iso: "2000-06-21T10:00:00Z", latitude: 65.9, longitude: 66.6 },
];

describe("houseCusps (Placidus)", () => {
  test.each(PLACES)("$name: 12 cusps that close the circle, and the Placidus definition holds", ({ iso, latitude, longitude }) => {
    const houses = houseCusps(new Date(iso), latitude, longitude);
    expect(houses.system).toBe("placidus");
    const { obliquity, ramc } = context(iso, longitude);
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const span = normalizeDegrees(houses.cusps[(i + 1) % 12]! - houses.cusps[i]!);
      expect(span).toBeGreaterThan(0);
      expect(span).toBeLessThan(180);
      total += span;
    }
    expect(total).toBeCloseTo(360, 6);

    const semiArc = (cusp: number) => {
      const { declination } = equatorial(cusp, obliquity);
      return Math.acos(-Math.tan(latitude * RAD) * Math.tan(declination * RAD)) * DEG;
    };
    const eastOfMeridian = (cusp: number) => normalizeDegrees(equatorial(cusp, obliquity).rightAscension - ramc);
    // куспиды 11 и 12 — доли дневной полудуги; 2 и 3 — дневная полудуга и доля ночной
    expect(eastOfMeridian(houses.cusps[10])).toBeCloseTo(semiArc(houses.cusps[10]) / 3, 3);
    expect(eastOfMeridian(houses.cusps[11])).toBeCloseTo((semiArc(houses.cusps[11]) * 2) / 3, 3);
    expect(eastOfMeridian(houses.cusps[1])).toBeCloseTo(semiArc(houses.cusps[1]) + (180 - semiArc(houses.cusps[1])) / 3, 3);
    expect(eastOfMeridian(houses.cusps[2])).toBeCloseTo(semiArc(houses.cusps[2]) + ((180 - semiArc(houses.cusps[2])) * 2) / 3, 3);
  });

  test("the 1st and 10th cusps are the ascendant and the midheaven, the 4th and 7th are opposite", () => {
    const { cusps } = houseCusps(new Date("1990-03-07T09:00:00Z"), 55.7558, 37.6173);
    expect(cusps[0]).toBeCloseTo(104.12, 1);
    expect(cusps[9]).toBeCloseTo(335.64, 1);
    expect(normalizeDegrees(cusps[3] - cusps[9])).toBeCloseTo(180, 9);
    expect(normalizeDegrees(cusps[6] - cusps[0])).toBeCloseTo(180, 9);
  });

  test("on the equator cusp 11 sits at right ascension of the midheaven + 30°", () => {
    const iso = "1990-03-07T09:00:00Z";
    const { obliquity, ramc } = context(iso, 0);
    const expected = normalizeDegrees(Math.atan2(Math.sin((ramc + 30) * RAD), Math.cos((ramc + 30) * RAD) * Math.cos(obliquity)) * DEG);
    expect(houseCusps(new Date(iso), 0, 0).cusps[10]).toBeCloseTo(expected, 6);
  });
});

describe("houseCusps beyond latitude 66°", () => {
  test("falls back to Porphyry: the arcs midheaven→ascendant and ascendant→IC are split into thirds", () => {
    const houses = houseCusps(new Date("1990-03-07T09:00:00Z"), 68.9585, 33.0827);
    expect(houses.system).toBe("porphyry");
    const [asc, cusp2, cusp3, ic, , , , , , mc, cusp11, cusp12] = houses.cusps;
    const above = normalizeDegrees(asc - mc) / 3;
    expect(normalizeDegrees(cusp11 - mc)).toBeCloseTo(above, 9);
    expect(normalizeDegrees(cusp12 - mc)).toBeCloseTo(above * 2, 9);
    const below = normalizeDegrees(ic - asc) / 3;
    expect(normalizeDegrees(cusp2 - asc)).toBeCloseTo(below, 9);
    expect(normalizeDegrees(cusp3 - asc)).toBeCloseTo(below * 2, 9);
  });
});

describe("houseOf", () => {
  const houses = houseCusps(new Date("1990-03-07T09:00:00Z"), 55.7558, 37.6173);

  test("takes the house from the cusps, including the wrap through 0°", () => {
    expect(houseOf(houses.cusps[0] + 0.001, houses)).toBe(1);
    expect(houseOf(houses.cusps[0] - 0.001, houses)).toBe(12);
    expect(houseOf(houses.cusps[9] + 0.001, houses)).toBe(10);
    expect(houseOf(houses.cusps[6] + 0.001, houses)).toBe(7);
    expect(houseOf(houses.cusps[10] + 0.001, houses)).toBe(11); // куспида 11 лежит сразу за 0° Овна
  });

  test("regression for the sample chart: Sun 10, Moon 2, Jupiter 12, Pluto 5", () => {
    expect([346.53, 118.12, 90.99, 227.71].map((value) => houseOf(value, houses))).toEqual([10, 2, 12, 5]);
  });
});
