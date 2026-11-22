import { readFileSync } from "node:fs";
import type { Place } from "@oracle/core/moon";
import { describe, expect, test } from "vitest";
import { buildMonthPage, isInWindow, lightCurve, MONTH_NAMES, monthFaq, monthWindow, ribbonSegments } from "./lunar-calendar";
import { MONTH_BASELINE_MONTHS, MONTH_BASELINE_NOW, plainMonthPage } from "./lunar-calendar.test-support";
import { LUNAR_CALENDAR_PATH, lunarMonthPath, MONTH_SLUGS, moscowDate, parseMonthSlug } from "./lunar-calendar-paths";

const NOW = new Date("2026-11-17T09:00:00Z"); // 12:00 по Москве

describe("month slugs", () => {
  test("builds the page path from the year and month", () => {
    expect(LUNAR_CALENDAR_PATH).toBe("/lunnyy-kalendar");
    expect(lunarMonthPath(2026, 12)).toBe("/lunnyy-kalendar/dekabr-2026");
    expect(lunarMonthPath(2027, 5)).toBe("/lunnyy-kalendar/may-2027");
    expect(MONTH_SLUGS).toHaveLength(12);
  });

  test("parses every month slug back, both ways", () => {
    for (let month = 1; month <= 12; month++) {
      const slug = lunarMonthPath(2027, month).replace(`${LUNAR_CALENDAR_PATH}/`, "");
      expect(parseMonthSlug(slug)).toEqual({ year: 2027, month });
    }
    expect(parseMonthSlug("dekabr-2026")).toEqual({ year: 2026, month: 12 });
  });

  test("rejects wrong case, short years, extra characters and nonsense", () => {
    for (const slug of ["Dekabr-2026", "dekabr-26", "dekabr-2026x", "dekabr-20266", "13-2026", "dekabr", "-2026", "", "dekabr-2026/", " dekabr-2026"]) expect(parseMonthSlug(slug), slug).toBeNull();
  });
});

describe("moscowDate", () => {
  test("gives the calendar day in Moscow, not in UTC", () => {
    expect(moscowDate(new Date("2026-11-17T21:30:00Z"))).toBe("2026-11-18");
    expect(moscowDate(new Date("2026-11-17T20:59:00Z"))).toBe("2026-11-17");
  });
});

describe("month window", () => {
  test("is the previous month, the current and 13 next ones, in a row", () => {
    const window = monthWindow(NOW);
    expect(window).toHaveLength(15);
    expect(window[0]).toEqual({ year: 2026, month: 10 });
    expect(window[1]).toEqual({ year: 2026, month: 11 });
    expect(window[14]).toEqual({ year: 2027, month: 12 });
    window.forEach((item, index) => {
      if (index > 0) expect(item.year * 12 + item.month).toBe(window[index - 1]!.year * 12 + window[index - 1]!.month + 1);
    });
  });

  test("tests membership and counts the Moscow midnight as a new month", () => {
    expect(isInWindow(2026, 9, NOW)).toBe(false);
    expect(isInWindow(2026, 10, NOW)).toBe(true);
    expect(isInWindow(2027, 12, NOW)).toBe(true);
    expect(isInWindow(2028, 1, NOW)).toBe(false);
    expect(monthWindow(new Date("2026-11-30T21:30:00Z"))[1]).toEqual({ year: 2026, month: 12 });
  });
});

describe("lightCurve", () => {
  const days = [0, 0.25, 0.5, 1, 0.5, 0.25].map((illumination, index) => ({ date: `2026-11-0${index + 1}`, illumination }));
  const curve = lightCurve(days, 600, 100);

  test("puts one point in the middle of each day slot, full Moon on top and new Moon at the bottom", () => {
    expect(curve.points).toHaveLength(6);
    expect(curve.points[0]!.x).toBeCloseTo(50, 6);
    expect(curve.points[5]!.x).toBeCloseTo(550, 6);
    expect(curve.points[3]!.y).toBeCloseTo(0, 6);
    expect(curve.points[0]!.y).toBeCloseTo(100, 6);
    expect(curve.points[2]!.y).toBeCloseTo(50, 6);
  });

  test("draws a clean line and a closed area without NaN", () => {
    expect(curve.line.startsWith("M")).toBe(true);
    expect(curve.line).not.toContain("NaN");
    expect(curve.area).not.toContain("NaN");
    expect(curve.area.trim().endsWith("Z")).toBe(true);
  });
});

describe("ribbonSegments", () => {
  test("covers the month from 0 to 1 in a row without gaps", () => {
    const start = new Date("2026-11-01T00:00:00Z");
    const end = new Date("2026-12-01T00:00:00Z");
    const runs = [
      { sign: "leo" as const, from: start, to: new Date("2026-11-04T12:00:00Z") },
      { sign: "virgo" as const, from: new Date("2026-11-04T12:00:00Z"), to: new Date("2026-11-17T00:00:00Z") },
      { sign: "libra" as const, from: new Date("2026-11-17T00:00:00Z"), to: end },
    ];
    const segments = ribbonSegments(runs, start, end);
    expect(segments[0]!.from).toBe(0);
    expect(segments[2]!.to).toBe(1);
    segments.forEach((segment, index) => {
      if (index > 0) expect(segment.from).toBeCloseTo(segments[index - 1]!.to, 12);
    });
    expect(segments.reduce((sum, segment) => sum + (segment.to - segment.from), 0)).toBeCloseTo(1, 9);
    expect(segments.map((segment) => segment.signName)).toEqual(["Лев", "Дева", "Весы"]);
  });
});

describe("buildMonthPage(2026, 11)", () => {
  const page = buildMonthPage(2026, 11, NOW);

  test("titles the page and puts November on six weeks of seven cells", () => {
    expect(page.title).toBe("Лунный календарь на ноябрь 2026");
    expect(MONTH_NAMES[10]).toBe("ноябрь");
    expect(page.weeks).toHaveLength(6);
    for (const week of page.weeks) expect(week).toHaveLength(7);
    expect(page.weeks[0]!.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(page.weeks[0]![6]).toBe(0);
    const filled = page.weeks.flat().filter((index): index is number => index !== null);
    expect(filled).toEqual(Array.from({ length: 30 }, (_, i) => i));
    expect(page.weeks[5]![0]).toBe(29);
    expect(page.weeks[5]!.slice(1)).toEqual([null, null, null, null, null, null]);
  });

  test("has one cell per day with the Moon of that day and Russian names", () => {
    expect(page.cells).toHaveLength(30);
    const day17 = page.cells[16]!;
    expect(day17).toMatchObject({ date: "2026-11-17", day: 17, phaseName: "Первая четверть", signName: "Водолей", lunarNumber: 8 });
    expect(day17.label).toBe("17 ноября");
    expect(day17.lunarChange).toMatch(/^с 13:5[0-6] — 9-е$/);
    expect(day17.riseSet).toMatch(/^13:5[0-6] \/ (23:3[6-9]|23:4[0-2])$/);
  });

  test("lists the four events with Moscow times and the index of their day", () => {
    expect(page.events.map((event) => event.kind)).toEqual(["lastQuarter", "new", "firstQuarter", "full"]);
    expect(page.events[1]).toMatchObject({ name: "Новолуние", date: "2026-11-09", dayIndex: 8 });
    expect(page.events[1]!.label).toMatch(/^9 ноября, 10:0[0-4]$/);
    expect(page.events[3]!.label).toMatch(/^24 ноября, 17:5[2-5]$/);
  });

  test("the timeline puts the phases and every move into a new sign in time order, without the sign the month starts in", () => {
    const signs = page.timeline.filter((item) => item.kind === "sign");
    expect(signs).toHaveLength(page.signRuns.length - 1);
    expect(page.timeline.filter((item) => item.kind !== "sign").map((item) => item.title)).toEqual(["Последняя четверть", "Новолуние", "Первая четверть", "Полнолуние"]);
    expect(page.timeline.map((item) => item.at)).toEqual([...page.timeline.map((item) => item.at)].sort((a, b) => a - b));
    for (const item of signs) expect(item.title).toMatch(/^Луна входит в знак: [А-ЯЁ]/);
    for (const item of page.timeline) expect(item.date).toMatch(/^2026-1[01]-\d\d$|^2026-11-\d\d$/);
    expect(page.timeline.find((item) => item.title === "Новолуние")!.label).toMatch(/^9 ноября, 10:0[0-4]$/);
  });

  test("has the curve with event markers on it, sign runs, a ribbon and a row for every day", () => {
    expect(page.curve.points).toHaveLength(30);
    expect(page.curve.events).toHaveLength(4);
    const high = page.curve.points.reduce((best, point) => (point.y < best.y ? point : best));
    expect(["2026-11-23", "2026-11-24", "2026-11-25"]).toContain(high.date);
    const low = page.curve.points.reduce((best, point) => (point.y > best.y ? point : best));
    expect(["2026-11-08", "2026-11-09", "2026-11-10"]).toContain(low.date);
    expect(page.signRuns.length).toBeGreaterThanOrEqual(11);
    expect(page.signRuns[0]!.label).toMatch(/^1 нояб/);
    expect(page.ribbon[0]!.from).toBe(0);
    expect(page.ribbon[page.ribbon.length - 1]!.to).toBe(1);
    expect(page.rows).toHaveLength(30);
    expect(page.rows[16]!.date).toBe("2026-11-17");
  });

  test("links the neighbours and lists the whole window with the current month marked", () => {
    expect(page.prev).toEqual({ label: "Октябрь 2026", href: "/lunnyy-kalendar/oktyabr-2026" });
    expect(page.next).toEqual({ label: "Декабрь 2026", href: "/lunnyy-kalendar/dekabr-2026" });
    expect(page.months).toHaveLength(15);
    expect(page.months.filter((month) => month.current)).toEqual([{ label: "Ноябрь 2026", href: "/lunnyy-kalendar/noyabr-2026", current: true }]);
  });

  test("has no previous link on the first month of the window and no next one on the last", () => {
    expect(buildMonthPage(2026, 10, NOW).prev).toBeNull();
    expect(buildMonthPage(2027, 12, NOW).next).toBeNull();
  });

  test("carries the accepted FAQ with the dates of the month", () => {
    // Четыре вопроса с датами месяца и три вопроса о том, чего календарь не делает (приняты 20 ноября 2026)
    expect(page.faq).toHaveLength(7);
    expect(page.faq[0]!.question).toBe("Когда новолуние в ноябре 2026?");
    expect(page.faq[1]!.answer).toMatch(/24 ноября, 17:5\d/);
    expect(page.faq.slice(4).map((item) => item.question)).toEqual([
      "Почему календарь не делит дни на удачные и неудачные?",
      "Влияет ли фаза Луны на расчёт матрицы судьбы или натальной карты?",
      "Что сайт хранит о моих вопросах и раскладах?",
    ]);
  });
});

describe("monthFaq", () => {
  test("answers with the real dates of the month in the Moscow time", () => {
    const faq = monthFaq(2026, 11);
    expect(faq.map((item) => item.question)).toEqual(["Когда новолуние в ноябре 2026?", "Когда полнолуние в ноябре 2026?", "Какие фазы Луны в ноябре 2026?", "Как читать лунный календарь?"]);
    expect(faq[0]!.answer).toMatch(/9 ноября, 10:0\d/);
    expect(faq[1]!.answer).toMatch(/24 ноября, 17:5\d/);
  });

  test("names both full moons of May 2026", () => {
    const answer = monthFaq(2026, 5)[1]!.answer;
    expect(answer).toMatch(/1 мая, 20:2\d/);
    expect(answer).toMatch(/31 мая, 11:4\d/);
  });
});

describe("buildMonthPage for a Place", () => {
  const NOVOSIBIRSK: Place = { latitude: 54.99, longitude: 82.9, zone: "Asia/Novosibirsk" };
  const BERLIN: Place = { latitude: 52.52, longitude: 13.405, zone: "Europe/Berlin" };

  test("for Moscow equals the stored baseline", () => {
    const baseline = JSON.parse(readFileSync(new URL("./__fixtures__/moon-month-moscow.json", import.meta.url), "utf8")) as Record<string, unknown>;
    for (const [year, month] of MONTH_BASELINE_MONTHS) {
      expect(JSON.parse(JSON.stringify(plainMonthPage(buildMonthPage(year, month, MONTH_BASELINE_NOW)))), `${year}-${month}`).toEqual(baseline[`${year}-${month}`]);
    }
  }, 120_000);

  test("Novosibirsk November 2026: event times are in the place's zone and riseMin counts from local midnight", () => {
    const moscow = buildMonthPage(2026, 11, MONTH_BASELINE_NOW);
    const local = buildMonthPage(2026, 11, MONTH_BASELINE_NOW, NOVOSIBIRSK);
    expect(moscow.events.find((event) => event.kind === "full")?.label).toBe("24 ноября, 17:54");
    expect(local.events.find((event) => event.kind === "full")?.label).toBe("24 ноября, 21:54");
    expect(local.cells).toHaveLength(30);
    for (const cell of local.cells) {
      if (cell.riseMin !== null) {
        expect(cell.riseMin).toBeGreaterThanOrEqual(0);
        expect(cell.riseMin).toBeLessThan(24 * 60);
      }
    }
    expect(local.cells[0]!.riseSet).not.toBe(moscow.cells[0]!.riseSet);
  });

  test("Berlin March 2027 builds 31 cells with consistent weeks and no negative riseMin", () => {
    const page = buildMonthPage(2027, 3, MONTH_BASELINE_NOW, BERLIN);
    expect(page.cells).toHaveLength(31);
    expect(page.weeks.flat().filter((slot) => slot !== null)).toHaveLength(31);
    for (const cell of page.cells) {
      expect(cell.riseMin === null || cell.riseMin >= 0).toBe(true);
      expect(cell.setMin === null || cell.setMin >= 0).toBe(true);
    }
  });
});

describe("the day of a sign change", () => {
  const november = buildMonthPage(2026, 11, NOW);
  const cell = (page: typeof november, day: number) => page.cells[day - 1]!;

  test("is the day on which the Moon really enters the sign, also when that happens after noon", () => {
    // Овен → Телец 22 ноября в 13:09, Телец → Близнецы 24 ноября в 14:09: срез на полдень отстаёт от события на сутки
    expect(cell(november, 22).signChange).toBe(true);
    expect(cell(november, 22).signMove).toEqual({ from: "Овен", to: "Телец", time: "13:09" });
    expect(cell(november, 23).signChange).toBe(false);
    expect(cell(november, 23).signMove).toBeNull();
    expect(cell(november, 24).signMove).toEqual({ from: "Телец", to: "Близнецы", time: "14:09" });
    expect(cell(november, 25).signChange).toBe(false);
  });

  test("is the same day also when the Moon enters the sign before noon or right before midnight", () => {
    expect(cell(buildMonthPage(2026, 10, NOW), 26).signMove).toMatchObject({ to: "Телец", time: "02:34" });
    expect(cell(november, 12).signMove).toMatchObject({ to: "Козерог", time: "23:27" });
    expect(cell(november, 13).signChange).toBe(false);
  });

  test("every change of the month is marked once, on the date of the entry in the ribbon", () => {
    const marked = november.cells.filter((item) => item.signChange);
    expect(marked.map((item) => item.date)).toEqual(marked.map((item) => item.date).filter((date, index, all) => all.indexOf(date) === index));
    expect(marked.length).toBe(november.ribbon.length - 1);
  });

  test("follows the time zone of the chosen city: the entry at 23:27 Moscow time is already the next day in Novosibirsk", () => {
    const novosibirsk: Place = { latitude: 55.03, longitude: 82.92, zone: "Asia/Novosibirsk" };
    const page = buildMonthPage(2026, 11, NOW, novosibirsk);
    expect(cell(page, 12).signChange).toBe(false);
    expect(cell(page, 13).signMove).toMatchObject({ to: "Козерог", time: "03:27" });
  });
});
