import { expect, test } from "vitest";
import { DATE_ERROR } from "./matrix-save";
import { FATE_FAQ, fateOutcome, fatePath, NUMEROLOGY_PATH } from "./numerology";

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
