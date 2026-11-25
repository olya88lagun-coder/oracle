import { describe, expect, test } from "vitest";
import {
  lunarDayPath,
  lunarDayPathOfDate,
  lunarDayPaths,
  lunarDayPathsForSitemap,
  MONTH_GENITIVE_SLUGS,
  parseDaySlug,
  parseMonthSlug,
  SITEMAP_DAY_RADIUS,
} from "./lunar-calendar-paths";

const slugOf = (path: string) => path.split("/").pop()!;

describe("addresses of single dates", () => {
  test("a date reads like a search query", () => {
    expect(lunarDayPath(2026, 11, 24)).toBe("/lunnyy-kalendar/24-noyabrya-2026");
    expect(lunarDayPath(2027, 3, 1)).toBe("/lunnyy-kalendar/1-marta-2027");
  });

  test("every month and its first and last day survive a round trip", () => {
    expect(MONTH_GENITIVE_SLUGS).toHaveLength(12);
    for (let month = 1; month <= 12; month++) {
      const last = new Date(Date.UTC(2027, month, 0)).getUTCDate();
      for (const day of [1, last]) expect(parseDaySlug(slugOf(lunarDayPath(2027, month, day))), `${month}/${day}`).toEqual({ year: 2027, month, day });
    }
  });

  test("only the exact slug is a date: mixed, padded, impossible and malformed slugs are not", () => {
    for (const slug of ["31-noyabrya-2026", "0-noyabrya-2026", "024-noyabrya-2026", "24-noyabr-2026", "noyabr-2026", "24-Noyabrya-2026", "24-noyabrya-26", "29-fevralya-2027", "24-noyabrya-2026-"]) expect(parseDaySlug(slug), slug).toBeNull();
    expect(parseDaySlug("29-fevralya-2028")).toEqual({ year: 2028, month: 2, day: 29 });
  });

  test("a date slug is never a month slug", () => {
    expect(parseMonthSlug("24-noyabrya-2026")).toBeNull();
    expect(parseMonthSlug("noyabr-2026")).toEqual({ year: 2026, month: 11 });
  });

  test("a date in ISO form gets the same address", () => {
    expect(lunarDayPathOfDate("2026-11-24")).toBe("/lunnyy-kalendar/24-noyabrya-2026");
    expect(lunarDayPathOfDate("2027-01-05")).toBe("/lunnyy-kalendar/5-yanvarya-2027");
  });

  test("the window lists every day of its 15 months once", () => {
    const paths = lunarDayPaths(new Date("2026-11-17T09:00:00Z"));
    expect(paths).toHaveLength(457);
    expect(new Set(paths).size).toBe(457);
    expect(paths[0]).toBe("/lunnyy-kalendar/1-oktyabrya-2026");
    expect(paths.at(-1)).toBe("/lunnyy-kalendar/31-dekabrya-2027");
    expect(paths).toContain("/lunnyy-kalendar/31-dekabrya-2026");
    expect(paths).toContain("/lunnyy-kalendar/1-yanvarya-2027");
  });

  test("the sitemap keeps only nearby days inside the month window", () => {
    const now = new Date("2026-11-17T09:00:00Z");
    const paths = lunarDayPathsForSitemap(now);
    expect(paths).toHaveLength(SITEMAP_DAY_RADIUS * 2 + 1);
    expect(paths[0]).toBe("/lunnyy-kalendar/18-oktyabrya-2026");
    expect(paths.at(-1)).toBe("/lunnyy-kalendar/17-dekabrya-2026");
    expect(paths).toContain("/lunnyy-kalendar/17-noyabrya-2026");
    expect(paths).not.toContain("/lunnyy-kalendar/1-yanvarya-2027");
    expect(paths.every((path) => lunarDayPaths(now).includes(path))).toBe(true);
  });
});
