import { afterEach, describe, expect, test, vi } from "vitest";
import type { City } from "@oracle/geo";
import { buildBirthMoment } from "./natal-moment";
import type { NatalInput } from "./natal-input";

const city = (name: string, latitude: number, longitude: number, zone: string): City => ({ id: 1, name, region: "", country: "", latitude, longitude, zone, population: 0 });
const MOSCOW = city("Москва", 55.7558, 37.6173, "Europe/Moscow");
// В базе городов (GeoNames) Мурманск живёт в московской зоне
const MURMANSK = city("Мурманск", 68.9585, 33.0827, "Europe/Moscow");
const SYDNEY = city("Сидней", -33.8688, 151.2093, "Australia/Sydney");

const input = (date: string, time: string | null, place: City = MOSCOW): NatalInput => ({ date, time, city: place });
const iso = (moment: { instant: Date }) => moment.instant.toISOString();

afterEach(() => {
  vi.useRealTimers();
});

describe("buildBirthMoment: ordinary time", () => {
  test("Moscow, 7 March 1990 12:00 is 09:00 UTC", () => {
    const result = buildBirthMoment(input("1990-03-07", "12:00"));
    expect(iso(result.moment)).toBe("1990-03-07T09:00:00.000Z");
    expect(result.clock).toBe("ok");
    expect(result.correctedTime).toBeNull();
    expect(result.moment).toMatchObject({ latitude: 55.7558, longitude: 37.6173, timeKnown: true });
  });

  test("midnight is a real time", () => {
    expect(iso(buildBirthMoment(input("1990-03-07", "00:00")).moment)).toBe("1990-03-06T21:00:00.000Z");
  });

  test("the coordinates come from the city, the offset from its zone (summer Murmansk, southern Sydney)", () => {
    const murmansk = buildBirthMoment(input("2000-07-01", "12:00", MURMANSK));
    expect(iso(murmansk.moment)).toBe("2000-07-01T08:00:00.000Z"); // московское летнее время, UTC+4
    expect(murmansk.moment).toMatchObject({ latitude: 68.9585, longitude: 33.0827 });
    const winter = buildBirthMoment(input("2000-07-15", "12:00", SYDNEY));
    expect(iso(winter.moment)).toBe("2000-07-15T02:00:00.000Z"); // AEST, UTC+10
    expect(winter.moment).toMatchObject({ latitude: -33.8688, longitude: 151.2093, timeKnown: true });
    expect(iso(buildBirthMoment(input("2000-01-15", "12:00", SYDNEY)).moment)).toBe("2000-01-15T01:00:00.000Z"); // AEDT, UTC+11
  });
});

describe("buildBirthMoment: unknown time", () => {
  test("local noon, time not known", () => {
    const result = buildBirthMoment(input("1990-03-07", null));
    expect(iso(result.moment)).toBe("1990-03-07T09:00:00.000Z");
    expect(result.moment.timeKnown).toBe(false);
    expect(result.clock).toBe("ok");
    expect(result.correctedTime).toBeNull();
  });

  test("noon is local to the city's zone", () => {
    expect(iso(buildBirthMoment(input("2000-07-15", null, SYDNEY)).moment)).toBe("2000-07-15T02:00:00.000Z");
  });
});

describe("buildBirthMoment: clocks that skipped or repeated", () => {
  test("a skipped time (Moscow, 1 April 1981 00:30) is reported and corrected to the nearest existing one", () => {
    const result = buildBirthMoment(input("1981-04-01", "00:30"));
    expect(result.clock).toBe("gap");
    expect(result.correctedTime).toBe("01:30");
    expect(iso(result.moment)).toBe("1981-03-31T21:30:00.000Z"); // 01:30 по новому времени, UTC+4
    expect(result.moment.timeKnown).toBe(true);
  });

  test("the choice does not matter for a skipped time", () => {
    expect(buildBirthMoment(input("1981-04-01", "00:30"), "second")).toEqual(buildBirthMoment(input("1981-04-01", "00:30")));
  });

  test("a repeated time (Moscow, 30 September 1990 02:30) is ambiguous; the first occurrence by default", () => {
    const byDefault = buildBirthMoment(input("1990-09-30", "02:30"));
    expect(byDefault.clock).toBe("ambiguous");
    expect(byDefault.correctedTime).toBeNull();
    expect(iso(byDefault.moment)).toBe("1990-09-29T22:30:00.000Z"); // летнее время, UTC+4
    expect(buildBirthMoment(input("1990-09-30", "02:30"), "first")).toEqual(byDefault);
  });

  test("«second» takes the alternative instant, an hour later", () => {
    const first = buildBirthMoment(input("1990-09-30", "02:30"), "first");
    const second = buildBirthMoment(input("1990-09-30", "02:30"), "second");
    expect(second.clock).toBe("ambiguous");
    expect(iso(second.moment)).toBe("1990-09-29T23:30:00.000Z"); // зимнее время, UTC+3
    expect(second.moment.instant.getTime() - first.moment.instant.getTime()).toBe(3_600_000);
  });

  test("the choice is ignored when the time is not ambiguous", () => {
    expect(buildBirthMoment(input("1990-03-07", "12:00"), "second")).toEqual(buildBirthMoment(input("1990-03-07", "12:00")));
  });

  test("a skipped time in the southern hemisphere (Sydney, 5 October 2008 02:30) gets the corrected clock time", () => {
    const result = buildBirthMoment(input("2008-10-05", "02:30", SYDNEY));
    expect(result.clock).toBe("gap");
    expect(result.correctedTime).toBe("03:30");
  });
});

describe("buildBirthMoment: purity", () => {
  test("the result does not depend on the current date", () => {
    const expected = iso(buildBirthMoment(input("1990-03-07", "12:00")).moment);
    for (const now of ["2001-01-01T00:00:00Z", "2026-10-15T12:34:56Z", "2040-07-01T23:59:59Z"]) {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now));
      expect(iso(buildBirthMoment(input("1990-03-07", "12:00")).moment)).toBe(expected);
      expect(buildBirthMoment(input("1981-04-01", "00:30")).correctedTime).toBe("01:30");
      vi.useRealTimers();
    }
  });

  test("the input is not mutated and every call returns a fresh moment", () => {
    const frozen = Object.freeze({ ...input("1990-03-07", "12:00") });
    const first = buildBirthMoment(frozen);
    const second = buildBirthMoment(frozen);
    expect(first.moment.instant).not.toBe(second.moment.instant);
    expect(first).toEqual(second);
  });

  test("a malformed date or time is a programming error (the form validates first)", () => {
    expect(() => buildBirthMoment(input("07.03.1990", "12:00"))).toThrow(RangeError);
    expect(() => buildBirthMoment(input("1990-03-07", "7:5"))).toThrow(RangeError);
  });
});
