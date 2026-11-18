import { expect, test } from "vitest";
import { calculateLifeThread, foldToNine, personalMonthsOf, personalYearOf } from "./life-thread";

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

const monthsFor = (value: string, year: number) => {
  const thread = calculateLifeThread(value, TODAY);
  const item = thread?.years.find((entry) => entry.year === year);
  if (!thread || !item) throw new Error("no thread year");
  const next = thread.years.find((entry) => entry.year === year + 1);
  return { months: personalMonthsOf(thread.birth, item), next };
};

const dayAfter = (isoDate: string): string => new Date(Date.parse(isoDate) + 86_400_000).toISOString().slice(0, 10);

// Цепочка без дыр: start следующего = end предыдущего + день, 12-й кончается перед следующим личным годом
const expectChain = (value: string, year: number) => {
  const { months, next } = monthsFor(value, year);
  expect(months).toHaveLength(12);
  expect(months.map((item) => item.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  for (let i = 1; i < 12; i++) expect(months[i]?.start).toBe(dayAfter(months[i - 1]?.end ?? ""));
  expect(dayAfter(months[11]?.end ?? "")).toBe(next?.start);
};

test("personal months of 15.07.1990 in 2026 (value 5): 12 segments, first 3, second 4, last ends 2027-07-14", () => {
  const { months } = monthsFor("1990-07-15", 2026);
  expect(months[0]).toEqual({ index: 1, value: 3, start: "2026-07-15", end: "2026-08-14" });
  expect(months[1]).toMatchObject({ value: 4, start: "2026-08-15" });
  expect(months[11]?.end).toBe("2027-07-14");
  expectChain("1990-07-15", 2026);
});

test("personal months of 31.01.1991 in 2026: February segment starts on the 28th, March on the 31st, no gaps", () => {
  const { months } = monthsFor("1991-01-31", 2026);
  expect(months[1]?.start).toBe("2026-02-28");
  expect(months[2]?.start).toBe("2026-03-31");
  expectChain("1991-01-31", 2026);
});

test("personal months of 29.02.1992: 2027 starts on 1 March, the chain holds in leap and non-leap years", () => {
  expect(monthsFor("1992-02-29", 2027).months[0]?.start).toBe("2027-03-01");
  for (const year of [2026, 2027, 2028]) expectChain("1992-02-29", year);
});

test("29.02 birth, non-leap year: segments start on the 1st of 12 distinct calendar months, the last ends on 28 February", () => {
  const { months } = monthsFor("1992-02-29", 2027);
  expect(months.map((item) => item.start.slice(5))).toEqual(["03-01", "04-01", "05-01", "06-01", "07-01", "08-01", "09-01", "10-01", "11-01", "12-01", "01-01", "02-01"]);
  expect(new Set(months.map((item) => item.start.slice(5, 7))).size).toBe(12);
  expect(months[11]?.end).toBe("2028-02-28");
});

test("personal months chain holds for 30th and 1st births across years", () => {
  for (const value of ["1990-01-30", "1990-12-31", "1990-01-01"]) for (const year of [2026, 2027, 2028]) expectChain(value, year);
});
