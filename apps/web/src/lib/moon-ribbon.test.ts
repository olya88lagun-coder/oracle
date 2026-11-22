import { PHASES } from "@oracle/core/moon";
import { lunarDay } from "@oracle/core/moon";
import { describe, expect, test } from "vitest";
import { moonRibbonData } from "./moon-ribbon";

const NOW = new Date("2026-11-22T09:00:00Z");

describe("moonRibbonData", () => {
  test("returns the phase, sign, lunar day with progress in [0, 1] and an engraving path", () => {
    const data = moonRibbonData(NOW);
    expect(data.date).toBe("2026-11-22");
    expect(PHASES).toContain(data.phase);
    expect(data.illumination).toBeGreaterThanOrEqual(0);
    expect(data.illumination).toBeLessThanOrEqual(1);
    expect(data.signName).toMatch(/^в /);
    expect(data.lunarDay.number).toBeGreaterThanOrEqual(1);
    expect(data.lunarDay.progress).toBeGreaterThanOrEqual(0);
    expect(data.lunarDay.progress).toBeLessThanOrEqual(1);
    expect(data.discImage).toMatch(/^\/luna\/phases\/[A-Za-z]+-160\.webp$/);
  });

  test("progress is 0 at the start of a lunar day and close to 1 at its end", () => {
    const day = lunarDay(NOW);
    expect(moonRibbonData(day.startsAt).lunarDay.progress).toBe(0);
    expect(moonRibbonData(new Date(day.endsAt.getTime() - 1)).lunarDay.progress).toBeGreaterThan(0.999);
  });
});
