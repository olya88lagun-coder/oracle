import { describe, expect, test } from "vitest";
import { moscowDate } from "./lunar-calendar-paths";
import { moscowMinutes } from "./moon-stage";
import { zoneDate, zoneMinutes } from "./moon-zone";

describe("zoneDate", () => {
  test("changes the date at the Novosibirsk local midnight", () => {
    expect(zoneDate(new Date("2026-11-22T16:59:00Z"), "Asia/Novosibirsk")).toBe("2026-11-22");
    expect(zoneDate(new Date("2026-11-22T17:30:00Z"), "Asia/Novosibirsk")).toBe("2026-11-23");
  });

  test("for Moscow equals moscowDate", () => {
    for (const iso of ["2026-11-22T20:59:00Z", "2026-11-22T21:01:00Z", "2027-03-14T00:30:00Z"]) expect(zoneDate(new Date(iso), "Europe/Moscow")).toBe(moscowDate(new Date(iso)));
  });
});

describe("zoneMinutes", () => {
  test("is 0 at the local midnight and 1439 a minute before the next one", () => {
    expect(zoneMinutes(Date.parse("2026-11-22T17:00:00Z"), "Asia/Novosibirsk")).toBe(0);
    expect(zoneMinutes(Date.parse("2026-11-23T16:59:00Z"), "Asia/Novosibirsk")).toBe(1439);
  });

  test("for Moscow equals moscowMinutes", () => {
    for (const iso of ["2026-11-22T20:59:00Z", "2026-11-22T21:01:00Z", "2026-11-22T09:17:00Z"]) expect(zoneMinutes(Date.parse(iso), "Europe/Moscow")).toBe(moscowMinutes(Date.parse(iso)));
  });
});
