import { expect, test } from "vitest";
import { calculateLifeThread, foldToNine, personalYearOf } from "./life-thread";

const TODAY = new Date("2026-11-18T12:00:00Z");
const BIRTH = { year: 1990, month: 7, day: 15 };

test("foldToNine folds by digit sum to 1–9 and keeps no master numbers", () => {
  expect([9, 10, 19, 11, 22, 33, 99].map(foldToNine)).toEqual([9, 1, 1, 2, 4, 6, 9]);
});

test("personal years of 15.07.1990 match the checked values: 2017→5, 2020→8, 2026→5, 2029→8, 2030→9, 2031→1", () => {
  expect([2017, 2020, 2026, 2029, 2030, 2031].map((year) => personalYearOf(BIRTH, year))).toEqual([5, 8, 5, 8, 9, 1]);
});

test("each next personal year is the previous one plus one in the nine-year cycle", () => {
  for (let year = 2000; year < 2100; year++) expect(personalYearOf(BIRTH, year + 1)).toBe((personalYearOf(BIRTH, year) % 9) + 1);
});

test("four periods of 15.07.1990: values 4, 7, 2, 8; boundaries 2021, 2030, 2039; the last has no end", () => {
  const thread = calculateLifeThread("1990-07-15", TODAY);
  expect(thread?.lifePath).toBe(5);
  expect(thread?.periods).toEqual([
    { index: 1, value: 4, fromYear: 1990, toYear: 2021 },
    { index: 2, value: 7, fromYear: 2021, toYear: 2030 },
    { index: 3, value: 2, fromYear: 2030, toYear: 2039 },
    { index: 4, value: 8, fromYear: 2039, toYear: null },
  ]);
});

test("years run from the birth year to max(birth + 90, now + 9); the current year starts on the birthday", () => {
  const thread = calculateLifeThread("1990-07-15", TODAY);
  expect(thread?.years[0]?.year).toBe(1990);
  expect(thread?.years.at(-1)?.year).toBe(2080);
  expect(thread?.currentYear).toBe(2026);
  const year = thread?.years.find((item) => item.year === 2026);
  expect(year).toMatchObject({ value: 5, start: "2026-07-15", end: "2027-07-14" });
});

test("the personal year switches exactly on the birthday", () => {
  expect(calculateLifeThread("1990-07-15", new Date("2026-07-14T12:00:00Z"))?.currentYear).toBe(2025);
  expect(calculateLifeThread("1990-07-15", new Date("2026-07-15T00:00:00Z"))?.currentYear).toBe(2026);
});

test("born on 29 February: in a non-leap year the year starts on 1 March and ends on 28 February", () => {
  const thread = calculateLifeThread("1992-02-29", TODAY);
  expect(thread?.years.find((item) => item.year === 2027)).toMatchObject({ start: "2027-03-01", end: "2028-02-28" });
  expect(thread?.years.find((item) => item.year === 2028)).toMatchObject({ start: "2028-02-29" });
});

test("born in 1900: the range ends at now + 9 and the last period is open", () => {
  const thread = calculateLifeThread("1900-01-01", TODAY);
  expect(thread?.years.at(-1)?.year).toBe(2035);
  expect(thread?.periods.at(-1)?.toYear).toBeNull();
});

test("an impossible date, a future date and a non-string give null", () => {
  expect(calculateLifeThread("1990-02-31", TODAY)).toBeNull();
  expect(calculateLifeThread("2030-01-01", TODAY)).toBeNull();
  expect(calculateLifeThread(undefined as never, TODAY)).toBeNull();
});
