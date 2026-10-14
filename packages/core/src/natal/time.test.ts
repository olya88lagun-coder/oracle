import { describe, expect, test } from "vitest";
import { isValidZone, localToUtc, utcOffsetMinutes } from "./time";

const at = (year: number, month: number, day: number, hour: number, minute: number) => ({ year, month, day, hour, minute });

describe("localToUtc", () => {
  test("converts an ordinary moment with the historical offset", () => {
    expect(localToUtc("Europe/Moscow", at(1990, 3, 7, 12, 0))).toEqual({ kind: "ok", utc: new Date("1990-03-07T09:00:00Z") });
    expect(localToUtc("Europe/Moscow", at(2012, 7, 1, 12, 0))).toEqual({ kind: "ok", utc: new Date("2012-07-01T08:00:00Z") });
    expect(localToUtc("Europe/Moscow", at(2015, 1, 1, 12, 0))).toEqual({ kind: "ok", utc: new Date("2015-01-01T09:00:00Z") });
  });

  test("follows the zone changes of one city (Novosibirsk +7 in 2011, +6 since 2014)", () => {
    expect(localToUtc("Asia/Novosibirsk", at(2011, 7, 1, 12, 0))).toEqual({ kind: "ok", utc: new Date("2011-07-01T05:00:00Z") });
    expect(localToUtc("Asia/Novosibirsk", at(2015, 1, 1, 12, 0))).toEqual({ kind: "ok", utc: new Date("2015-01-01T06:00:00Z") });
  });

  test("reports a time that never existed and moves it forward by the gap", () => {
    // 01.04.1981 в Москве часы с 00:00 перевели на 01:00: 00:30 не было
    const result = localToUtc("Europe/Moscow", at(1981, 4, 1, 0, 30));
    expect(result.kind).toBe("gap");
    expect(result.utc.toISOString()).toBe("1981-03-31T21:30:00.000Z"); // = 01:30 по новому времени
  });

  test("reports a time that happened twice and offers both instants", () => {
    // 30.09.1990 в Москве часы с 03:00 перевели на 02:00: 02:30 было дважды
    const result = localToUtc("Europe/Moscow", at(1990, 9, 30, 2, 30));
    expect(result.kind).toBe("ambiguous");
    if (result.kind !== "ambiguous") return;
    expect(result.utc.toISOString()).toBe("1990-09-29T22:30:00.000Z");
    expect(result.alternative.toISOString()).toBe("1990-09-29T23:30:00.000Z");
  });
});

test("utcOffsetMinutes gives the historical offset", () => {
  expect(utcOffsetMinutes("Europe/Moscow", Date.UTC(1985, 6, 1))).toBe(240);
  expect(utcOffsetMinutes("Europe/Moscow", Date.UTC(1975, 5, 1))).toBe(180);
});

test("isValidZone accepts IANA names and rejects anything else", () => {
  expect(isValidZone("Europe/Moscow")).toBe(true);
  expect(isValidZone("Not/AZone")).toBe(false);
  expect(isValidZone("")).toBe(false);
});
