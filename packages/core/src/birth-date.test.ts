import { describe, expect, test } from "vitest";
import { formatBirthDateRu, MIN_BIRTH_YEAR, parseBirthDate, toIsoDate } from "./birth-date";

const TODAY = new Date("2026-09-24T10:00:00Z");

describe("parseBirthDate", () => {
  test("reads a date from a date input", () => {
    expect(parseBirthDate("1990-03-07", TODAY)).toEqual({ year: 1990, month: 3, day: 7 });
  });

  test("ignores surrounding spaces", () => {
    expect(parseBirthDate(" 1990-03-07 ", TODAY)).toEqual({ year: 1990, month: 3, day: 7 });
  });

  test("accepts the 29th of February in a leap year only", () => {
    expect(parseBirthDate("2024-02-29", TODAY)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseBirthDate("2023-02-29", TODAY)).toBeNull();
  });

  test.each(["07.03.1990", "1990-3-7", "1990-13-01", "1990-04-31", "", "abc"])("rejects %j", (value) => {
    expect(parseBirthDate(value, TODAY)).toBeNull();
  });

  test("rejects anything that is not a string", () => {
    expect(parseBirthDate(19900307, TODAY)).toBeNull();
    expect(parseBirthDate(null, TODAY)).toBeNull();
  });

  test(`rejects years before ${MIN_BIRTH_YEAR}`, () => {
    expect(parseBirthDate("1899-12-31", TODAY)).toBeNull();
    expect(parseBirthDate("1900-01-01", TODAY)).toEqual({ year: 1900, month: 1, day: 1 });
  });

  test("accepts tomorrow by UTC, because east of UTC it is already today, and rejects later dates", () => {
    expect(parseBirthDate("2026-09-25", TODAY)).toEqual({ year: 2026, month: 9, day: 25 });
    expect(parseBirthDate("2026-09-26", TODAY)).toBeNull();
  });
});

describe("toIsoDate", () => {
  test("pads month and day", () => {
    expect(toIsoDate({ year: 1990, month: 3, day: 7 })).toBe("1990-03-07");
  });

  test("round-trips through parseBirthDate", () => {
    const date = { year: 1985, month: 12, day: 31 };

    expect(parseBirthDate(toIsoDate(date), TODAY)).toEqual(date);
  });
});

describe("formatBirthDateRu", () => {
  test("writes the month in the genitive case", () => {
    expect(formatBirthDateRu({ year: 1990, month: 3, day: 7 })).toBe("7 марта 1990");
    expect(formatBirthDateRu({ year: 2001, month: 5, day: 1 })).toBe("1 мая 2001");
  });
});
