import * as core from "@oracle/core/moon";
import { moonMonth } from "@oracle/core/moon";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { buildDatePage } from "./lunar-day-page";

vi.mock("@oracle/core/moon", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@oracle/core/moon")>();
  return { ...actual, moonMonth: vi.fn(actual.moonMonth) };
});

const NOW = new Date("2026-11-17T09:00:00Z");

describe("the page of 24 November 2026: full moon and the Moon entering Gemini on one day", () => {
  const page = buildDatePage(2026, 11, 24, NOW);

  test("answers with the date, the weekday and the numbers of the day", () => {
    expect(page.dateLabel).toBe("24 ноября 2026");
    expect(page.weekday).toBe("вторник");
    expect(page.mainEvent).toMatchObject({ kind: "full", time: "17:54" });
    expect(page.rise).toBe("15:12");
    expect(page.set).toBe("08:32");
    expect(page.lunarNumber).toBe(15);
    expect(page.lunarLine).toBe("15-е лунные сутки");
    expect(page.lunarChange).toEqual({ time: "15:12", to: 16 });
    expect(page.signChange?.signName).toBe("Близнецы");
    expect(page.texts.day?.symbol).toBeTruthy();
    expect(page.texts.phase).toBeTruthy();
  });

  test("lists the events of the day in the order of time: the sign change, the lunar day change, the phase", () => {
    expect(page.events.map((event) => event.kind).sort()).toEqual(["lunar", "phase", "sign"]);
    const times = page.events.map((event) => event.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    const phase = page.events.find((event) => event.kind === "phase");
    expect(phase).toMatchObject({ time: "17:54", text: "Полнолуние" });
    expect(phase?.note).toBeTruthy();
    expect(page.events.find((event) => event.kind === "lunar")).toMatchObject({ time: "15:12", text: "Начинаются 16-е лунные сутки" });
  });

  test("shows seven neighbours with the current one marked, and links the day before and the day after", () => {
    expect(page.neighbours).toHaveLength(7);
    expect(page.neighbours.filter((item) => item.current)).toHaveLength(1);
    expect(page.neighbours[3]).toMatchObject({ current: true, href: "/lunnyy-kalendar/24-noyabrya-2026", label: "24.11" });
    expect(page.neighbours[1]!.href).toBe("/lunnyy-kalendar/22-noyabrya-2026");
    expect(page.prev?.href).toBe("/lunnyy-kalendar/23-noyabrya-2026");
    expect(page.next?.href).toBe("/lunnyy-kalendar/25-noyabrya-2026");
    expect(page.monthHref).toBe("/lunnyy-kalendar/noyabr-2026");
  });
});

describe("the name of the phase on a date", () => {
  test("the day of the full moon is the full moon, the days next to it are «около»", () => {
    expect(buildDatePage(2026, 11, 24, NOW).phaseName).toBe("Полнолуние");
    expect(buildDatePage(2026, 11, 23, NOW).phaseName).toBe("Около полнолуния");
    expect(buildDatePage(2026, 10, 31, NOW).phaseName).toBe("Около последней четверти");
    expect(buildDatePage(2026, 11, 1, NOW).phaseName).toBe("Последняя четверть");
  });

  test("the neighbours carry the same names", () => {
    const names = buildDatePage(2026, 11, 24, NOW).neighbours.map((item) => item.phaseName);
    expect(names.slice(2, 5)).toEqual(["Около полнолуния", "Полнолуние", "Около полнолуния"]);
  });
});

describe("the edges of the window", () => {
  test("the first day of the earliest month has no day before and no neighbours outside the window", () => {
    const page = buildDatePage(2026, 10, 1, NOW);
    expect(page.prev).toBeNull();
    expect(page.neighbours).toHaveLength(4);
    expect(page.neighbours[0]!.current).toBe(true);
  });

  test("the last day of the latest month has no day after", () => {
    const page = buildDatePage(2027, 12, 31, NOW);
    expect(page.next).toBeNull();
    expect(page.neighbours.at(-1)!.current).toBe(true);
  });

  test("the neighbours cross the border of a month and of a year", () => {
    const page = buildDatePage(2026, 12, 31, NOW);
    expect(page.next?.href).toBe("/lunnyy-kalendar/1-yanvarya-2027");
    expect(page.neighbours.map((item) => item.href)).toContain("/lunnyy-kalendar/2-yanvarya-2027");
  });
});

describe("days without a moonrise and without events", () => {
  test("a day on which the Moon does not rise has no rise and still builds", () => {
    let found: { year: number; month: number; day: number } | null = null;
    for (const [year, month] of [[2026, 11], [2026, 12], [2027, 1], [2027, 2], [2027, 3]] as const) {
      const day = moonMonth(year, month).days.find((item) => item.rise === null);
      if (day) {
        found = { year, month, day: day.day };
        break;
      }
    }
    expect(found, "no day without a moonrise in the first five months").not.toBeNull();
    const page = buildDatePage(found!.year, found!.month, found!.day, NOW);
    expect(page.rise).toBeNull();
    expect(page.lunarLine).toMatch(/лунные сутки$/);
  });

  test("an ordinary day has no phase event and no mainEvent", () => {
    const page = buildDatePage(2026, 11, 23, NOW);
    expect(page.mainEvent).toBeNull();
    expect(page.events.some((event) => event.kind === "phase")).toBe(false);
  });
});

describe("the month is computed once for all of its days", () => {
  beforeEach(() => {
    vi.mocked(core.moonMonth).mockClear();
  });

  test("two pages of one month and of its neighbours reuse the first results", () => {
    buildDatePage(2027, 6, 10, NOW);
    const after = vi.mocked(core.moonMonth).mock.calls.length;
    expect(after).toBeLessThanOrEqual(3);
    buildDatePage(2027, 6, 20, NOW);
    expect(vi.mocked(core.moonMonth).mock.calls.length).toBe(after);
  });
});
