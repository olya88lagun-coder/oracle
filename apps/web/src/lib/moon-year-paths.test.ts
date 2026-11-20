import { describe, expect, test } from "vitest";
import { moonYearPaths, parseYearSlug, PHASES_PATH, yearMoonPath, yearWindow } from "./moon-year-paths";

describe("moon year paths", () => {
  test("builds and parses the slugs of both kinds", () => {
    expect(yearMoonPath("new", 2027)).toBe("/luna/novoluniya-2027");
    expect(yearMoonPath("full", 2027)).toBe("/luna/polnoluniya-2027");
    expect(parseYearSlug("novoluniya-2027")).toEqual({ kind: "new", year: 2027 });
    expect(parseYearSlug("polnoluniya-2026")).toEqual({ kind: "full", year: 2026 });
  });

  test("anything but the exact slug is not a year page", () => {
    for (const slug of ["novoluniya-27", "Novoluniya-2027", "novoluniya-2027 ", "novoluniya-20270", "fazy-luny", "luna-2027"]) expect(parseYearSlug(slug), slug).toBeNull();
  });

  test("the window is the previous, the current and the next year in Moscow", () => {
    expect(yearWindow(new Date("2026-11-20T09:00:00Z"))).toEqual([2025, 2026, 2027]);
    expect(yearWindow(new Date("2026-12-31T21:30:00Z"))).toEqual([2026, 2027, 2028]);
  });

  test("the sitemap list holds the phases page and two pages for every year of the window", () => {
    const paths = moonYearPaths(new Date("2026-11-20T09:00:00Z"));
    expect(paths).toHaveLength(7);
    expect(paths[0]).toBe(PHASES_PATH);
    expect(paths).toContain("/luna/polnoluniya-2025");
    expect(paths).toContain("/luna/novoluniya-2027");
  });
});
