import { describe, expect, test } from "vitest";
import { DATE_ERROR } from "./matrix-save";
import { acceptedClockPaths, CLOCK_FAQ, CLOCK_PATH, clockPath, FATE_FAQ, fateOutcome, fatePath, NUMEROLOGY_PATH, PERSONAL_YEAR_FAQ, PERSONAL_YEAR_PATH, personalYearOutcome, personalYearPath, relatedClocks } from "./numerology";

const TODAY = new Date("2026-11-08");

test("addresses of the section and of each fate number", () => {
  expect(NUMEROLOGY_PATH).toBe("/numerologiya");
  expect(fatePath(7)).toBe("/numerologiya/chislo-sudby/7");
  expect(fatePath(11)).toBe("/numerologiya/chislo-sudby/11");
});

test("a valid date gives the fate number, master 11 stays 11", () => {
  expect(fateOutcome("1992-03-14", TODAY)).toEqual({ ok: true, iso: "1992-03-14", result: { sum: 29, steps: [29, 11], value: 11 } });
});

test.each(["", "not-a-date", "2027-01-01", "1991-02-29"])("an empty or wrong date %s gives the site's date error", (iso) => {
  expect(fateOutcome(iso, TODAY)).toEqual({ ok: false, error: DATE_ERROR });
});

test("FAQ explains the formula with the 14.03.1992 example and has unique questions", () => {
  const how = FATE_FAQ.find((item) => item.question === "Как рассчитать число судьбы по дате рождения?");
  expect(how?.answer).toContain("14.03.1992");
  expect(how?.answer).toContain("29");
  expect(how?.answer).toContain("11");
  expect(new Set(FATE_FAQ.map((item) => item.question)).size).toBe(FATE_FAQ.length);
  expect(FATE_FAQ.length).toBeGreaterThanOrEqual(4);
  expect(FATE_FAQ.length).toBeLessThanOrEqual(6);
  for (const item of FATE_FAQ) expect(item.answer.toLowerCase()).not.toContain("карм");
});

describe("personal year 2027", () => {
  test("addresses", () => {
    expect(PERSONAL_YEAR_PATH).toBe("/numerologiya/lichnyy-god-2027");
    expect(personalYearPath(1)).toBe("/numerologiya/lichnyy-god-2027/1");
  });
  test("outcome for a valid and a wrong date", () => {
    expect(personalYearOutcome("1992-03-14", TODAY)).toEqual({ ok: true, iso: "1992-03-14", result: { year: 2027, sum: 19, value: 1 } });
    expect(personalYearOutcome("", TODAY)).toEqual({ ok: false, error: DATE_ERROR });
  });
  test("FAQ separates personal year from the arcanum of 2027", () => {
    const item = PERSONAL_YEAR_FAQ.find((q) => q.question === "Чем личный год отличается от аркана 2027 года?");
    expect(item?.answer).toContain("девятилетн");
    expect(new Set(PERSONAL_YEAR_FAQ.map((q) => q.question)).size).toBe(PERSONAL_YEAR_FAQ.length);
    expect(PERSONAL_YEAR_FAQ.length).toBeGreaterThanOrEqual(4);
    expect(PERSONAL_YEAR_FAQ.length).toBeLessThanOrEqual(6);
  });
});

describe("clock times", () => {
  test("addresses use hh-mm", () => {
    expect(CLOCK_PATH).toBe("/numerologiya/chasy");
    expect(clockPath("11-11")).toBe("/numerologiya/chasy/11-11");
  });
  test("accepted clock paths are a subset of the 37 times", () => {
    expect(acceptedClockPaths().length).toBeLessThanOrEqual(37);
    for (const path of acceptedClockPaths()) expect(path).toMatch(/^\/numerologiya\/chasy\/\d{2}-\d{2}$/);
  });
  test("related times: 2–3 accepted neighbours of the same group, never itself", () => {
    const related = relatedClocks("12-12");
    expect(related.length).toBeGreaterThanOrEqual(2);
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.map((t) => t.slug)).not.toContain("12-12");
    for (const t of related) {
      expect(["repeat", "both"]).toContain(t.kind);
      expect(acceptedClockPaths()).toContain(clockPath(t.slug));
    }
    for (const t of relatedClocks("12-21")) expect(["mirror", "both"]).toContain(t.kind);
    expect(relatedClocks("99-99")).toEqual([]);
  });
  test("FAQ of the hub: unique questions, explains both kinds", () => {
    expect(new Set(CLOCK_FAQ.map((q) => q.question)).size).toBe(CLOCK_FAQ.length);
    expect(CLOCK_FAQ.length).toBeGreaterThanOrEqual(4);
    expect(CLOCK_FAQ.map((q) => q.answer).join(" ")).toContain("зеркальн");
  });
});
