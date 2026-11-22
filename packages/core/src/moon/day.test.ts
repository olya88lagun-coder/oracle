import { describe, expect, test } from "vitest";
import { dayStart, lunarDay, lunarDayFromRises, moonRises, moonSets, moscowDayStart, type Place } from "./day";

const HOUR = 3_600_000;
const T0 = new Date("2026-11-09T07:02:00Z"); // новолуние
// Восходы каждые 24 ч 50 мин; первый — через час после новолуния
const risesEvery = (count: number, stepMs = 24.8333 * HOUR) => Array.from({ length: count }, (_, i) => new Date(T0.getTime() + HOUR + i * stepMs));

describe("lunarDayFromRises", () => {
  test("day 1 starts at the new moon and day N from the (N-1)th moonrise after it", () => {
    const rises = risesEvery(6);
    const day = lunarDayFromRises(new Date(rises[2]!.getTime() + 12 * HOUR), T0, rises);
    expect(day.number).toBe(4);
    expect(day.startsAt).toEqual(rises[2]);
    expect(day.endsAt).toEqual(rises[3]);
  });

  test("right after the new moon it is day 1 until the first moonrise, even if the Moon rose just before the new moon", () => {
    const rises = [new Date(T0.getTime() - 20 * HOUR), ...risesEvery(3)];
    const day = lunarDayFromRises(new Date(T0.getTime() + 30 * 60_000), T0, rises);
    expect(day.number).toBe(1);
    expect(day.startsAt).toEqual(T0);
    expect(day.endsAt).toEqual(rises[1]);
  });

  test("a calendar day without a moonrise does not skip a lunar day", () => {
    // Между вторым и третьим восходом 49 часов: календарные сутки без восхода посередине
    const rises = [risesEvery(1)[0]!, new Date(T0.getTime() + 25 * HOUR), new Date(T0.getTime() + 74 * HOUR), new Date(T0.getTime() + 99 * HOUR)];
    const day = lunarDayFromRises(new Date(T0.getTime() + 60 * HOUR), T0, rises);
    expect(day.number).toBe(3);
    const next = lunarDayFromRises(new Date(T0.getTime() + 80 * HOUR), T0, rises);
    expect(next.number).toBe(4);
  });

  test("the number never exceeds 30, however many moonrises there are", () => {
    const rises = risesEvery(35);
    expect(lunarDayFromRises(new Date(rises[34]!.getTime() + HOUR), T0, rises).number).toBe(30);
  });
});

describe("moscowDayStart", () => {
  test("starts the Moscow day at 00:00 UTC+3", () => {
    expect(moscowDayStart(new Date("2026-11-17T09:00:00Z"))).toEqual(new Date("2026-11-16T21:00:00Z"));
  });

  test("21:30 UTC is already the next day in Moscow", () => {
    expect(moscowDayStart(new Date("2026-11-17T21:30:00Z"))).toEqual(new Date("2026-11-17T21:00:00Z"));
  });
});

describe("Moon on 17 Nov 2026 in Moscow", () => {
  const dayStart = moscowDayStart(new Date("2026-11-17T09:00:00Z"));

  test("rises at about 13:53 Moscow time", () => {
    // Сверка: страница arcanika.com/ru/luna-segodnya на 17.11.2026 показывает «восход 13:53, с 13:53 9-е сутки»
    const [rise] = moonRises(dayStart, 1);
    expect(rise).toBeDefined();
    const reference = new Date("2026-11-17T10:53:00Z");
    expect(Math.abs(rise!.getTime() - reference.getTime()) / 60_000).toBeLessThanOrEqual(3);
  });

  test("sets after it rises on the same calendar day", () => {
    const [rise] = moonRises(dayStart, 1);
    const sets = moonSets(dayStart, 1);
    expect(sets.length).toBeGreaterThan(0);
    expect(sets[0]!.getTime()).toBeGreaterThan(rise!.getTime());
  });

  test("lunar day is 8 at noon and 9 at 15:00 Moscow time", () => {
    expect(lunarDay(new Date("2026-11-17T09:00:00Z")).number).toBe(8);
    expect(lunarDay(new Date("2026-11-17T12:00:00Z")).number).toBe(9);
  });

  test("lunar day lasts from one moonrise to the next, about 25 hours", () => {
    const day = lunarDay(new Date("2026-11-17T12:00:00Z"));
    const hours = (day.endsAt.getTime() - day.startsAt.getTime()) / HOUR;
    expect(hours).toBeGreaterThan(23);
    expect(hours).toBeLessThan(27);
    expect(day.startsAt.getTime()).toBeLessThanOrEqual(new Date("2026-11-17T12:00:00Z").getTime());
    expect(day.endsAt.getTime()).toBeGreaterThan(new Date("2026-11-17T12:00:00Z").getTime());
  });
});

describe("lunar month boundary", () => {
  // Новолуние 9 декабря 2026 03:51 по Москве = 00:51 UTC (timeanddate.com)
  test("the day before the next new moon is 29 or 30, and an hour after it is day 1 again", () => {
    const before = lunarDay(new Date("2026-12-08T23:51:00Z")).number;
    expect(before === 29 || before === 30).toBe(true);
    expect(lunarDay(new Date("2026-12-09T01:51:00Z")).number).toBe(1);
  });
});

const NOVOSIBIRSK: Place = { latitude: 54.99, longitude: 82.9, zone: "Asia/Novosibirsk" };
const BERLIN: Place = { latitude: 52.52, longitude: 13.405, zone: "Europe/Berlin" };

describe("dayStart", () => {
  test("for Moscow equals moscowDayStart over 400 days in 2026-2027", () => {
    const first = Date.parse("2026-01-01T00:00:00Z");
    for (let step = 0; step < 400 * 24 / 7; step++) {
      const at = new Date(first + step * 7 * HOUR);
      expect(dayStart(at).getTime(), at.toISOString()).toBe(moscowDayStart(at).getTime());
    }
  });

  test("for Novosibirsk is the local midnight", () => {
    expect(dayStart(new Date("2026-11-22T09:00:00Z"), NOVOSIBIRSK).toISOString()).toBe("2026-11-21T17:00:00.000Z");
  });

  test("on the Berlin spring change a local day starts at local midnight and lasts 23 hours", () => {
    const start = dayStart(new Date("2027-03-28T12:00:00Z"), BERLIN);
    const next = dayStart(new Date("2027-03-29T12:00:00Z"), BERLIN);
    expect(start.toISOString()).toBe("2027-03-27T23:00:00.000Z");
    expect(next.toISOString()).toBe("2027-03-28T22:00:00.000Z");
    expect((next.getTime() - start.getTime()) / HOUR).toBe(23);
  });
});

describe("a Place without utcOffsetMinutes", () => {
  test("moonRises and lunarDay accept it", () => {
    const at = new Date("2026-11-22T09:00:00Z");
    expect(moonRises(at, 2, NOVOSIBIRSK).length).toBeGreaterThan(0);
    const day = lunarDay(at, NOVOSIBIRSK);
    expect(day.number).toBeGreaterThanOrEqual(1);
    expect(day.number).toBeLessThanOrEqual(30);
  });
});
