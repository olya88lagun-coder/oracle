import type { ThreadYear } from "@oracle/core";
import { expect, test } from "vitest";
import { clearsHoverOnLeave, curveLevels, labelEvery, nowPillBelow, smoothPath, threadWindow, THREAD_LEVELS, YEAR_NAMES } from "./life-thread-curve";

const years = (from: number, to: number): ThreadYear[] => Array.from({ length: to - from + 1 }, (_, i) => ({ year: from + i, value: 1, start: "", end: "" }));

test("the level scale and the year names are the approved ones", () => {
  expect(THREAD_LEVELS).toEqual({ 1: 0.42, 2: 0.08, 3: 0.5, 4: 0.22, 5: 0.62, 6: 0.4, 7: 0.18, 8: 1, 9: 0.66 });
  expect(Object.values(YEAR_NAMES)).toEqual(["старт", "терпение", "самовыражение", "фундамент", "перемены", "забота", "осмысление", "урожай", "завершение"]);
});

test("curveLevels is smoothed, normalised to 0…1, and year 8 stays the highest point", () => {
  const levels = curveLevels([5, 6, 7, 8, 9, 1, 2, 3, 4, 5]);
  expect(levels).toHaveLength(10);
  expect(Math.min(...levels)).toBe(0);
  expect(Math.max(...levels)).toBe(1);
  expect(levels[3]).toBe(1);
  expect(levels[3]).toBeGreaterThan(levels[2] ?? 1);
  expect(levels[3]).toBeGreaterThan(levels[4] ?? 1);
});

test("curveLevels of a single year has no NaN", () => {
  const levels = curveLevels([8]);
  expect(levels).toHaveLength(1);
  expect(Number.isFinite(levels[0])).toBe(true);
});

test("threadWindow takes nine years each way and is cut at the first year of life", () => {
  expect(threadWindow(years(1990, 2080), 2026, "window").map((y) => y.year)).toEqual(years(2017, 2035).map((y) => y.year));
  const young = threadWindow(years(2023, 2035), 2026, "window");
  expect(young[0]?.year).toBe(2023);
  expect(young.length).toBeLessThan(19);
});

test("threadWindow in all mode returns the whole list", () => {
  expect(threadWindow(years(1990, 2080), 2026, "all")).toHaveLength(91);
});

test("smoothPath: two points give one curve segment, one point gives only a move", () => {
  const two = smoothPath([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
  expect(two.startsWith("M")).toBe(true);
  expect(two.match(/C/g)).toHaveLength(1);
  const one = smoothPath([{ x: 3, y: 4 }]);
  expect(one.startsWith("M")).toBe(true);
  expect(one).not.toContain("C");
});

test("year labels are spaced by the room they have: 44 px per label at least, in steps of 5 years in the whole-life view", () => {
  expect(labelEvery("window", false, 50)).toBe(3);
  expect(labelEvery("window", true, 17)).toBe(4);
  expect(labelEvery("all", false, 10)).toBe(10);
  expect(labelEvery("all", true, 3.8)).toBe(15);
  expect(labelEvery("all", true, 2.5)).toBe(20);
});

test("the «you are here» pill goes below the point, and above it when the point is near the year labels", () => {
  expect(nowPillBelow(200, 292.6)).toBe(true);
  expect(nowPillBelow(280, 292.6)).toBe(false);
});

test("a finger lifted from the chart keeps the tooltip; a mouse leaving the chart clears it", () => {
  expect(clearsHoverOnLeave("mouse")).toBe(true);
  expect(clearsHoverOnLeave("touch")).toBe(false);
  expect(clearsHoverOnLeave("pen")).toBe(false);
});
