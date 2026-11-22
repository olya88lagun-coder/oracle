import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { MOSCOW, type Place } from "./day";
import { daysInMonth, moonMonth } from "./month";
import { BASELINE_MONTHS, plainMonth } from "./month.test-support";

const minutes = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60_000;
// Эталон: timeanddate.com/moon/phases/russia/moscow?year=2026, время по Москве (UTC+3), сверено 17.11.2026
const msk = (iso: string) => new Date(`${iso}+03:00`);

describe("daysInMonth", () => {
  test("knows 28, 29, 30 and 31 day months", () => {
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });
});

describe("moonMonth(2026, 11)", () => {
  const started = Date.now();
  const november = moonMonth(2026, 11);
  const elapsed = Date.now() - started;

  test("is calculated in under two seconds", () => {
    expect(elapsed).toBeLessThan(2000);
  });

  test("has 30 days, from Sunday 1 November to Monday 30 November", () => {
    expect(november.days).toHaveLength(30);
    expect(november.days[0]).toMatchObject({ date: "2026-11-01", day: 1, weekday: 6 });
    expect(november.days[29]).toMatchObject({ date: "2026-11-30", day: 30, weekday: 0 });
    expect(november.days[16]!.date).toBe("2026-11-17");
  });

  test("lists the four phase events of the month in order, matching the reference to two minutes", () => {
    expect(november.events.map((event) => event.kind)).toEqual(["lastQuarter", "new", "firstQuarter", "full"]);
    const reference = [msk("2026-11-01T23:28:00"), msk("2026-11-09T10:02:00"), msk("2026-11-17T14:47:00"), msk("2026-11-24T17:53:00")];
    november.events.forEach((event, index) => expect(minutes(event.at, reference[index]!)).toBeLessThanOrEqual(2));
  });

  test("takes the Moon on 17 November at noon: first quarter, half lit, in Aquarius", () => {
    const day = november.days[16]!;
    expect(day.snapshot.phase).toBe("firstQuarter");
    expect(day.snapshot.illumination).toBeGreaterThan(0.47);
    expect(day.snapshot.illumination).toBeLessThan(0.52);
    expect(day.snapshot.sign).toBe("aquarius");
    expect(day.snapshot.at).toEqual(msk("2026-11-17T12:00:00"));
  });

  test("lunar day 8 turns into 9 at the moonrise at 13:53 inside 17 November", () => {
    const day = november.days[16]!;
    expect(day.lunarDay.number).toBe(8);
    expect(day.lunarDay.changeTo).toBe(9);
    expect(minutes(day.lunarDay.changeAt!, msk("2026-11-17T13:53:00"))).toBeLessThanOrEqual(3);
  });

  test("the new moon on 9 November restarts the lunar days at 1 at that moment", () => {
    const day = november.days[8]!;
    expect(day.lunarDay.changeTo).toBe(1);
    expect(minutes(day.lunarDay.changeAt!, msk("2026-11-09T10:02:00"))).toBeLessThanOrEqual(3);
  });

  test("a lunar day changes in almost every calendar day, and the rest have no change", () => {
    const quiet = november.days.filter((day) => day.lunarDay.changeAt === null);
    expect(quiet.length).toBeLessThanOrEqual(3);
    for (const day of quiet) expect(day.lunarDay.changeTo).toBeNull();
    for (const day of november.days) expect(day.lunarDay.number).toBeGreaterThanOrEqual(1);
    for (const day of november.days) expect(day.lunarDay.number).toBeLessThanOrEqual(30);
  });

  test("moonrise and moonset on 17 November are 13:53 and 23:39 Moscow time", () => {
    const day = november.days[16]!;
    expect(minutes(day.rise!, msk("2026-11-17T13:53:00"))).toBeLessThanOrEqual(3);
    expect(minutes(day.set!, msk("2026-11-17T23:39:00"))).toBeLessThanOrEqual(3);
  });

  test("sign runs fill the month without gaps or overlaps, with 11 to 15 runs", () => {
    const runs = november.signRuns;
    expect(runs[0]!.from).toEqual(msk("2026-11-01T00:00:00"));
    expect(runs[runs.length - 1]!.to).toEqual(msk("2026-12-01T00:00:00"));
    runs.forEach((run, index) => {
      if (index > 0) expect(run.from).toEqual(runs[index - 1]!.to);
      if (index > 0) expect(run.sign).not.toBe(runs[index - 1]!.sign);
      expect(run.to.getTime()).toBeGreaterThan(run.from.getTime());
    });
    expect(runs.length).toBeGreaterThanOrEqual(11);
    expect(runs.length).toBeLessThanOrEqual(15);
  });
});

describe("month boundaries", () => {
  test("an event belongs to exactly one month: the new moon of 9 December 03:51 is only in December", () => {
    const november = moonMonth(2026, 11);
    const december = moonMonth(2026, 12);
    const target = msk("2026-12-09T03:51:00");
    expect(november.events.some((event) => minutes(event.at, target) <= 2)).toBe(false);
    expect(december.events.some((event) => minutes(event.at, target) <= 2)).toBe(true);
    const all = [...november.events, ...december.events].map((event) => event.at.getTime());
    expect(new Set(all).size).toBe(all.length);
    expect(december.events.map((event) => event.kind)).toEqual(["lastQuarter", "new", "firstQuarter", "full", "lastQuarter"]);
  });

  test("May 2026 has two full moons, 1 May 20:23 and 31 May 11:45", () => {
    const fulls = moonMonth(2026, 5).events.filter((event) => event.kind === "full");
    expect(fulls).toHaveLength(2);
    expect(minutes(fulls[0]!.at, msk("2026-05-01T20:23:00"))).toBeLessThanOrEqual(2);
    expect(minutes(fulls[1]!.at, msk("2026-05-31T11:45:00"))).toBeLessThanOrEqual(2);
    expect(moonMonth(2026, 5).events).toHaveLength(5);
  });

  test("February 2028 has 29 days and February 2027 has 28, each ending on its last day", () => {
    expect(moonMonth(2028, 2).days).toHaveLength(29);
    expect(moonMonth(2028, 2).days[28]!.date).toBe("2028-02-29");
    expect(moonMonth(2027, 2).days).toHaveLength(28);
    expect(moonMonth(2027, 2).days[27]!.date).toBe("2027-02-28");
  });
});

describe("moonMonth for a Place", () => {
  const NOVOSIBIRSK: Place = { latitude: 54.99, longitude: 82.9, zone: "Asia/Novosibirsk" };
  const BERLIN: Place = { latitude: 52.52, longitude: 13.405, zone: "Europe/Berlin" };
  const MURMANSK: Place = { latitude: 68.97, longitude: 33.09, zone: "Europe/Moscow" };
  const HOUR = 3_600_000;

  test("for Moscow equals the stored baseline for all 15 months", () => {
    const baseline = JSON.parse(readFileSync(new URL("./__fixtures__/moscow-months.json", import.meta.url), "utf8")) as Record<string, unknown>;
    for (const [year, month] of BASELINE_MONTHS) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      expect(plainMonth(moonMonth(year, month)), key).toEqual(baseline[key]);
      expect(plainMonth(moonMonth(year, month, MOSCOW)), key).toEqual(baseline[key]);
    }
  });

  test("Novosibirsk November 2026 starts at local midnight, has local rises and the same full moon moment", () => {
    const month = moonMonth(2026, 11, NOVOSIBIRSK);
    expect(month.range.start.toISOString()).toBe("2026-10-31T17:00:00.000Z");
    expect(month.range.end.toISOString()).toBe("2026-11-30T17:00:00.000Z");
    const first = month.days[0]!;
    if (first.rise) {
      expect(first.rise.getTime()).toBeGreaterThanOrEqual(month.range.start.getTime());
      expect(first.rise.getTime()).toBeLessThan(month.range.start.getTime() + 24 * HOUR);
    }
    expect(month.events).toEqual(moonMonth(2026, 11).events.filter((event) => event.at >= month.range.start && event.at < month.range.end));
  });

  test("Berlin March 2027 cuts the 23-hour day 28 at local midnights", () => {
    const month = moonMonth(2027, 3, BERLIN);
    expect(month.range.start.toISOString()).toBe("2027-02-28T23:00:00.000Z");
    expect(month.days).toHaveLength(31);
    expect(month.days[27]!.snapshot.at.toISOString()).toBe("2027-03-28T10:30:00.000Z"); // середина между 2027-03-27T23:00Z и 2027-03-28T22:00Z
  });

  test("Berlin October 2027 has a 25-hour day 31 with its snapshot inside it", () => {
    const month = moonMonth(2027, 10, BERLIN);
    expect(month.days[30]!.snapshot.at.toISOString()).toBe("2027-10-31T10:30:00.000Z"); // середина между 2027-10-30T22:00Z и 2027-10-31T23:00Z
    expect(month.range.end.toISOString()).toBe("2027-10-31T23:00:00.000Z");
  });

  test("a polar place (Murmansk, December 2026) does not throw, lunar days stay 1..30 and a day without a rise has rise null", () => {
    const month = moonMonth(2026, 12, MURMANSK);
    expect(month.days).toHaveLength(31);
    month.days.forEach((day, index) => {
      expect(day.lunarDay.number).toBeGreaterThanOrEqual(1);
      expect(day.lunarDay.number).toBeLessThanOrEqual(30);
      if (day.rise) {
        const from = month.range.start.getTime() + index * 24 * HOUR;
        expect(day.rise.getTime()).toBeGreaterThanOrEqual(from);
        expect(day.rise.getTime()).toBeLessThan(from + 24 * HOUR);
      }
    });
  });
});
