import { describe, expect, test } from "vitest";
import { parseNatalBirth } from "./natal-snapshot";

const NOW = new Date("2026-10-20T00:00:00Z");
const MOSCOW = { birthDate: "1990-03-07", time: "12:00", name: "Москва", latitude: 55.7558, longitude: 37.6173, zone: "Europe/Moscow" };

describe("parseNatalBirth", () => {
  test("turns a valid body into a snapshot with the birth moment in UTC (Moscow was on UTC+3 in March 1990)", () => {
    expect(parseNatalBirth(MOSCOW, NOW)).toEqual({
      snapshot: { date: "1990-03-07", time: "12:00", instant: "1990-03-07T09:00:00.000Z", latitude: 55.7558, longitude: 37.6173, placeName: "Москва" },
    });
  });

  test("needs the birth time", () => {
    expect(parseNatalBirth({ ...MOSCOW, time: null }, NOW)).toBeNull();
    expect(parseNatalBirth({ ...MOSCOW, time: "25:00" }, NOW)).toBeNull();
    expect(parseNatalBirth({ ...MOSCOW, time: undefined }, NOW)).toBeNull();
  });

  test.each([
    ["a latitude beyond 85 degrees", { latitude: 86 }],
    ["an unknown zone", { zone: "Mars/Olympus" }],
    ["an empty place name", { name: " " }],
    ["a future date", { birthDate: "2027-01-01" }],
    ["a date before 1900", { birthDate: "1899-12-31" }],
  ])("rejects %s", (_title, patch) => {
    expect(parseNatalBirth({ ...MOSCOW, ...patch }, NOW)).toBeNull();
  });

  test.each([null, "text", 42, [], undefined])("rejects a body that is not an object: %s", (value) => {
    expect(parseNatalBirth(value, NOW)).toBeNull();
  });

  test("when the clock hour happened twice, the buyer's choice decides: the first by default, the second an hour later", () => {
    const berlin = { ...MOSCOW, birthDate: "1990-09-30", time: "02:30", name: "Берлин", latitude: 52.52, longitude: 13.4, zone: "Europe/Berlin" };
    expect(parseNatalBirth(berlin, NOW)?.snapshot.instant).toBe("1990-09-30T00:30:00.000Z");
    expect(parseNatalBirth({ ...berlin, zoneChoice: "second" }, NOW)?.snapshot.instant).toBe("1990-09-30T01:30:00.000Z");
  });
});
