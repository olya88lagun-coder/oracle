import { describe, expect, test } from "vitest";
import { dayPath, DAYS_PATH, moonYearPaths, parseDay, parseYearSlug, PHASES_PATH, yearMoonPath, yearWindow } from "./moon-year-paths";

describe("moon year paths", () => {
  test("builds and parses the slugs of all five kinds", () => {
    expect(yearMoonPath("new", 2027)).toBe("/luna/novoluniya-2027");
    expect(yearMoonPath("full", 2027)).toBe("/luna/polnoluniya-2027");
    expect(yearMoonPath("eclipse", 2027)).toBe("/luna/zatmeniya-2027");
    expect(yearMoonPath("mercury", 2026)).toBe("/luna/retrograd-merkuriya-2026");
    expect(yearMoonPath("venus", 2026)).toBe("/luna/retrograd-venery-2026");
    expect(parseYearSlug("novoluniya-2027")).toEqual({ kind: "new", year: 2027 });
    expect(parseYearSlug("polnoluniya-2026")).toEqual({ kind: "full", year: 2026 });
    expect(parseYearSlug("zatmeniya-2026")).toEqual({ kind: "eclipse", year: 2026 });
    expect(parseYearSlug("retrograd-merkuriya-2026")).toEqual({ kind: "mercury", year: 2026 });
    expect(parseYearSlug("retrograd-venery-2027")).toEqual({ kind: "venus", year: 2027 });
  });

  test("anything but the exact slug is not a year page", () => {
    for (const slug of ["novoluniya-27", "Novoluniya-2027", "novoluniya-2027 ", "novoluniya-20270", "fazy-luny", "luna-2027", "retrograd-marsa-2026", "retrograd-2026", "sutki-2026"]) expect(parseYearSlug(slug), slug).toBeNull();
  });

  test("the window is the previous, the current and the next year in Moscow", () => {
    expect(yearWindow(new Date("2026-11-20T09:00:00Z"))).toEqual([2025, 2026, 2027]);
    expect(yearWindow(new Date("2026-12-31T21:30:00Z"))).toEqual([2026, 2027, 2028]);
  });

  test("the lunar days are 1…30 with no leading zeros, spaces or signs", () => {
    expect(dayPath(8)).toBe("/luna/sutki/8");
    expect(parseDay("1")).toBe(1);
    expect(parseDay("30")).toBe(30);
    for (const value of ["0", "31", "01", "-1", "8 ", "", "abc", "1.5", "100"]) expect(parseDay(value), value).toBeNull();
  });

  test("the sitemap list holds the phases page, the days hub with 30 days and five pages for every year of the window", () => {
    const paths = moonYearPaths(new Date("2026-11-20T09:00:00Z"));
    expect(paths).toHaveLength(1 + 1 + 30 + 15);
    expect(paths[0]).toBe(PHASES_PATH);
    expect(paths).toContain(DAYS_PATH);
    expect(paths).toContain("/luna/sutki/30");
    expect(paths).toContain("/luna/polnoluniya-2025");
    expect(paths).toContain("/luna/zatmeniya-2027");
    expect(paths).toContain("/luna/retrograd-venery-2026");
    expect(new Set(paths).size).toBe(paths.length);
  });
});
