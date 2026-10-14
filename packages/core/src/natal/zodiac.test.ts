import { describe, expect, test } from "vitest";
import { angularDistance, normalizeDegrees, signOf } from "./zodiac";

describe("signOf", () => {
  test("puts 0° at the start of Aries and 30° at the start of Taurus", () => {
    expect(signOf(0)).toMatchObject({ sign: "aries", index: 0, degree: 0 });
    expect(signOf(29.999).sign).toBe("aries");
    expect(signOf(30)).toMatchObject({ sign: "taurus", index: 1, degree: 0 });
  });

  test("wraps negative and full-circle values", () => {
    expect(signOf(-1)).toMatchObject({ sign: "pisces" });
    expect(signOf(-1).degree).toBeCloseTo(29, 9);
    expect(signOf(360).sign).toBe("aries");
    expect(signOf(725).sign).toBe("aries");
  });
});

describe("angularDistance", () => {
  test("takes the short way around the circle", () => {
    expect(angularDistance(350, 10)).toBe(20);
    expect(angularDistance(10, 350)).toBe(20);
    expect(angularDistance(0, 180)).toBe(180);
    expect(angularDistance(90, 90)).toBe(0);
  });
});

test("normalizeDegrees keeps the value in 0…360", () => {
  expect(normalizeDegrees(-30)).toBe(330);
  expect(normalizeDegrees(360)).toBe(0);
});
