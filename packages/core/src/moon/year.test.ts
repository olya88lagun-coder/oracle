import { describe, expect, test } from "vitest";
import { moonMonth } from "./month";
import { moonYearEvents, SUPERMOON_KM } from "./year";

const moscowDate = (date: Date) => new Date(date.getTime() + 3 * 3_600_000).toISOString().slice(0, 10);

describe("moonYearEvents", () => {
  const events = moonYearEvents(2026);
  const full = events.filter((event) => event.kind === "full");
  const fresh = events.filter((event) => event.kind === "new");

  test("2026 has 12 new moons and 13 full moons (two in May), in order of time", () => {
    expect(fresh).toHaveLength(12);
    expect(full).toHaveLength(13);
    expect(events.map((event) => event.at.getTime())).toEqual([...events.map((event) => event.at.getTime())].sort((a, b) => a - b));
    expect(full.filter((event) => moscowDate(event.at).startsWith("2026-05"))).toHaveLength(2);
  });

  test("every event of the year agrees with the month calculation of the same Moscow month", () => {
    for (const event of events) {
      const [year, month] = moscowDate(event.at).split("-").map(Number) as [number, number];
      const found = moonMonth(year, month).events.find((item) => item.at.getTime() === event.at.getTime());
      expect(found?.kind, moscowDate(event.at)).toBe(event.kind);
    }
  });

  test("the first and last moments of the year in Moscow belong to their own year", () => {
    for (const event of events) expect(moscowDate(event.at).startsWith("2026")).toBe(true);
  });

  test("distance to the Earth stays between the lunar perigee and apogee, and 24 December 2026 is a supermoon", () => {
    for (const event of events) {
      expect(event.distanceKm).toBeGreaterThan(354_000);
      expect(event.distanceKm).toBeLessThan(407_000);
    }
    const december = full.find((event) => moscowDate(event.at) === "2026-12-24");
    expect(december).toBeDefined();
    expect(december!.distanceKm).toBeLessThan(SUPERMOON_KM);
  });
});
