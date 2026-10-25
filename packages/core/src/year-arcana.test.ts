import { describe, expect, test } from "vitest";
import { calculateYearArcana } from "./year-arcana";

describe("approved centre-based calendar arcana for 2027", () => {
  test.each([
    ["1992-03-14", 13, 10, 5],
    ["1990-11-29", 10, 6, 16],
    // Raw day 27 must enter the annual sum, not the matrix day arcanum 9.
    ["1992-01-27", 8, 12, 20],
    ["2000-01-01", 8, 13, 21],
  ])("%s has centre %i, annual sum %i and final arcanum %i", (iso, center, annual, arcanum) => {
    expect(calculateYearArcana(iso, new Date("2026-10-25"))).toEqual({ center, annual, arcanum, year: 2027 });
  });
  test.each(["", "1899-12-31", "2027-01-01", "1991-02-29", "1992-13-01", "not-a-date"])("rejects %s", (iso) => {
    expect(calculateYearArcana(iso, new Date("2026-10-25"))).toBeNull();
  });
  test("accepts leap day and preserves the 22nd arcanum", () => {
    expect(calculateYearArcana("2000-02-29", new Date("2026-10-25"))).not.toBeNull();
    expect(calculateYearArcana("1990-01-02", new Date("2026-10-25"))?.arcanum).toBe(22);
    const results = Array.from({ length: 28 }, (_, i) => calculateYearArcana(`1992-02-${String(i + 1).padStart(2, "0")}`, new Date("2026-10-25"))!);
    expect(results.every((result) => result.arcanum >= 1 && result.arcanum <= 22)).toBe(true);
  });
  test("birth year participates through the existing centre", () => {
    expect(calculateYearArcana("1992-03-14", new Date("2026-10-25"))?.arcanum).not.toBe(calculateYearArcana("1990-03-14", new Date("2026-10-25"))?.arcanum);
  });
});
