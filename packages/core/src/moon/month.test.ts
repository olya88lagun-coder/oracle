import { describe, expect, test } from "vitest";
import { daysInMonth, moonMonth } from "./month";

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
