import { PHASES } from "@oracle/core/moon";
import { describe, expect, test } from "vitest";
import { buildMoonTile, daysCount } from "./moon-tile";

const NOW = new Date("2026-11-22T09:00:00Z");

describe("buildMoonTile", () => {
  test("returns six week days, yesterday first and today second, each with a known phase", () => {
    const tile = buildMoonTile(NOW);
    expect(tile.week).toHaveLength(6);
    expect(tile.week.map((day) => day.date)).toEqual(["2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26"]);
    expect(tile.week.map((day) => day.isToday)).toEqual([false, true, false, false, false, false]);
    for (const day of tile.week) expect(PHASES).toContain(day.phase);
    expect(tile.dateLabel).toBe("22 ноября");
  });

  test("until counts calendar days in Moscow to the next main phase and words them", () => {
    const tile = buildMoonTile(NOW);
    expect(tile.until).toMatchObject({ kind: "full", days: 2, label: "До полнолуния 2 дня" });
  });

  test("on the day of the event the label says it is today", () => {
    const tile = buildMoonTile(new Date("2026-11-24T10:00:00Z"));
    expect(tile.until).toMatchObject({ kind: "full", days: 0, label: "Полнолуние сегодня" });
  });

  test("carries the facts the tile shows: light, sign, lunar day with symbol and the engraving", () => {
    const tile = buildMoonTile(NOW);
    expect(tile.illumination).toBeGreaterThan(0);
    expect(tile.signName).toMatch(/^в /);
    expect(typeof tile.sign).toBe("string");
    expect(tile.lunarDay.number).toBeGreaterThanOrEqual(1);
    expect(tile.discImage).toMatch(/^\/luna\/phases\/[A-Za-z]+-480\.webp$/);
  });
});

describe("daysCount", () => {
  test("declines 1, 2, 5, 11, 21", () => {
    expect([1, 2, 5, 11, 21].map(daysCount)).toEqual(["1 день", "2 дня", "5 дней", "11 дней", "21 день"]);
  });
});
