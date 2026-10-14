import { describe, expect, test } from "vitest";
import { BODIES, eclipticLongitude, isRetrograde, meanLunarNode } from "./bodies";
import { angularDistance } from "./zodiac";

describe("eclipticLongitude", () => {
  test("puts the Sun at 0° at the 2024 March equinox and 90° at the June solstice", () => {
    expect(angularDistance(eclipticLongitude("sun", new Date("2024-03-20T03:06:00Z")), 0)).toBeLessThan(0.02);
    expect(angularDistance(eclipticLongitude("sun", new Date("2024-06-20T20:51:00Z")), 90)).toBeLessThan(0.02);
  });

  test("is geocentric: Mars on 1990-03-07 is near 296.85°, not near its heliocentric 265.7°", () => {
    expect(Math.abs(eclipticLongitude("mars", new Date("1990-03-07T09:00:00Z")) - 296.85)).toBeLessThan(0.05);
  });

  test("returns a finite 0…360 value for every body", () => {
    for (const body of BODIES) {
      const value = eclipticLongitude(body, new Date("1990-03-07T09:00:00Z"));
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(360);
    }
  });
});

describe("isRetrograde", () => {
  test("Mercury is retrograde in April 2024 and direct in mid-May", () => {
    expect(isRetrograde("mercury", new Date("2024-04-10T12:00:00Z"))).toBe(true);
    expect(isRetrograde("mercury", new Date("2024-05-15T12:00:00Z"))).toBe(false);
  });

  test("Mars is retrograde in January 2025", () => {
    expect(isRetrograde("mars", new Date("2025-01-15T12:00:00Z"))).toBe(true);
  });

  test("the Sun and the Moon never are", () => {
    expect(isRetrograde("sun", new Date("2024-04-10T12:00:00Z"))).toBe(false);
    expect(isRetrograde("moon", new Date("2024-04-10T12:00:00Z"))).toBe(false);
  });
});

describe("meanLunarNode", () => {
  test("matches the formula constant at J2000 and moves backwards", () => {
    expect(meanLunarNode(new Date("2000-01-01T12:00:00Z"))).toBeCloseTo(125.04452, 3);
    expect(angularDistance(meanLunarNode(new Date("2000-01-31T12:00:00Z")), 125.04452)).toBeCloseTo(1.59, 1);
  });
});
