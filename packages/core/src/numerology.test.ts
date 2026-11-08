import { describe, expect, test } from "vitest";
import { calculateFateNumber, calculatePersonalYear, CLOCK_TIMES, clockBySlug, FATE_NUMBERS } from "./numerology";

const TODAY = new Date("2026-11-08");

describe("fate number: digit sum of the whole date, stopping at 11, 22 and 33", () => {
  test.each([
    ["1992-03-14", 29, 11],
    ["1990-11-29", 32, 5],
    ["1990-01-02", 22, 22],
    ["1980-09-15", 33, 33],
    ["2000-01-01", 4, 4],
  ])("%s: sum %i, value %i", (iso, sum, value) => {
    expect(calculateFateNumber(iso, TODAY)).toMatchObject({ sum, value });
  });

  test("sum 47 stops at master 11, not 2", () => {
    expect(calculateFateNumber("1999-09-28", TODAY)).toEqual({ sum: 47, steps: [47, 11], value: 11 });
  });

  test("every value is one of the twelve fate numbers", () => {
    expect(FATE_NUMBERS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
    for (let d = 1; d <= 28; d++) {
      const v = calculateFateNumber(`1987-06-${String(d).padStart(2, "0")}`, TODAY)!.value;
      expect(FATE_NUMBERS).toContain(v);
    }
  });
});

test.each(["", "2027-01-01", "1991-02-29", "1992-13-01", "not-a-date"])("rejects %s", (iso) => {
  expect(calculateFateNumber(iso, TODAY)).toBeNull();
  expect(calculatePersonalYear(iso, TODAY)).toBeNull();
});

describe("personal year 2027: day and month digits plus 2, 0, 2, 7, reduced to 1–9", () => {
  test.each([
    ["1992-03-14", 19, 1],
    ["1990-11-29", 24, 6],
  ])("%s: sum %i, value %i", (iso, sum, value) => {
    expect(calculatePersonalYear(iso, TODAY)).toEqual({ year: 2027, sum, value });
  });

  test("ignores birth year and never keeps masters", () => {
    expect(calculatePersonalYear("1990-03-14", TODAY)?.value).toBe(1);
    for (let d = 1; d <= 28; d++) {
      for (let m = 1; m <= 12; m++) {
        const v = calculatePersonalYear(`1990-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, TODAY)!.value;
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(9);
      }
    }
  });
});

describe("clock times", () => {
  test("37 times: 24 repeats, 16 mirrors, three overlaps", () => {
    expect(CLOCK_TIMES).toHaveLength(37);
    expect(new Set(CLOCK_TIMES.map((t) => t.slug)).size).toBe(37);
    expect(CLOCK_TIMES.filter((t) => t.kind === "both").map((t) => t.slug)).toEqual(["00-00", "11-11", "22-22"]);
    expect(clockBySlug("12-21")).toMatchObject({ label: "12:21", hours: 12, minutes: 21, kind: "mirror" });
    expect(clockBySlug("23-23")?.kind).toBe("repeat");
    expect(CLOCK_TIMES.every((t) => t.minutes < 60 && t.hours < 24)).toBe(true);
  });

  test("sorted by time of day", () => {
    const minutes = CLOCK_TIMES.map((t) => t.hours * 60 + t.minutes);
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
  });

  test.each(["1111", "11:11", "11-1", "24-24"])("no clock time for %s", (slug) => {
    expect(clockBySlug(slug)).toBeUndefined();
  });
});
