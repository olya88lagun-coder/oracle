import { calculateMatrix, parseBirthDate } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { HERO_EXAMPLE_DATE, nextHero, rollDelay, rollValue } from "./matrix-hero";

const TODAY = new Date("2026-11-17T12:00:00Z");

describe("rollValue", () => {
  test("starts on the old arcanum and ends exactly on the new one", () => {
    expect(rollValue(7, 19, 0)).toBe(7);
    expect(rollValue(7, 19, 1)).toBe(19);
    expect(rollValue(5, 5, 1)).toBe(5);
    expect(rollValue(22, 1, 1)).toBe(1);
  });

  test("clamps progress outside 0..1", () => {
    expect(rollValue(7, 19, -0.5)).toBe(7);
    expect(rollValue(7, 19, 2)).toBe(19);
  });

  test("never leaves the arcana range 1..22 for any pair and progress", () => {
    for (let from = 1; from <= 22; from++) {
      for (let to = 1; to <= 22; to++) {
        for (let step = 0; step <= 10; step++) {
          const value = rollValue(from, to, step / 10);
          expect(Number.isInteger(value) && value >= 1 && value <= 22, `${from}->${to} at ${step / 10}: ${value}`).toBe(true);
        }
      }
    }
  });
});

describe("rollDelay", () => {
  test("is a non-decreasing wave that stays under 400 ms", () => {
    expect(rollDelay(0)).toBe(0);
    for (let index = 1; index <= 40; index++) expect(rollDelay(index)).toBeGreaterThanOrEqual(rollDelay(index - 1));
    expect(rollDelay(40)).toBeLessThanOrEqual(400);
  });
});

describe("nextHero", () => {
  test("shows the example on a fictional date until a real date arrives", () => {
    const hero = nextHero("", TODAY, null);
    expect(hero.kind).toBe("example");
    expect(hero.iso).toBe(HERO_EXAMPLE_DATE);
    expect(hero.caption).toBe("Пример · вымышленная дата");
  });

  test("turns a valid date into the visitor's matrix with a dated caption", () => {
    const hero = nextHero("1990-03-07", TODAY, null);
    expect(hero.kind).toBe("date");
    expect(hero.caption).toBe("Ваша матрица · 7 марта 1990");
    expect(hero.matrix).toEqual(calculateMatrix(parseBirthDate("1990-03-07", TODAY)!));
    expect([hero.matrix.A, hero.matrix.E, hero.matrix.D]).toEqual([7, 4, 11]);
  });

  test("keeps the previous state for an empty or impossible date", () => {
    const previous = nextHero("1990-03-07", TODAY, null);
    expect(nextHero("1850-01-01", TODAY, previous)).toBe(previous);
    expect(nextHero("", TODAY, previous)).toBe(previous);
  });
});
