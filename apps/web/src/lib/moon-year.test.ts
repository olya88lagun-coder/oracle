import { describe, expect, test } from "vitest";
import { buildMonthPage, SPREAD_ACTIONS } from "./lunar-calendar";
import { buildPhasesPage, buildYearPage } from "./moon-year";
import { spreadPath, TARO_SPREADS } from "./taro-spreads";

const NOW = new Date("2026-11-20T09:00:00Z");

describe("buildYearPage", () => {
  const full = buildYearPage("full", 2026, NOW);
  const fresh = buildYearPage("new", 2026, NOW);

  test("lists every full and new moon of the year in order, with the Moscow time", () => {
    expect(full.rows).toHaveLength(13);
    expect(fresh.rows).toHaveLength(12);
    expect(full.rows.map((row) => row.date)).toEqual([...full.rows.map((row) => row.date)].sort());
    expect(full.rows.find((row) => row.date === "2026-11-24")?.label).toBe("24 ноября, 17:54");
    expect(fresh.rows.find((row) => row.date === "2026-11-09")?.label).toBe("9 ноября, 10:02");
  });

  test("names the sign the Moon is in at the moment of the phase: at the full moon of 24 November it is Gemini, although the grid shows Taurus at noon", () => {
    expect(full.rows.find((row) => row.date === "2026-11-24")?.signName).toBe("Близнецы");
  });

  test("marks supermoons only among full moons: 24 November and 24 December 2026 are, 3 January is not", () => {
    expect(full.rows.filter((row) => row.superMoon).map((row) => row.date)).toEqual(["2026-11-24", "2026-12-24"]);
    expect(fresh.rows.some((row) => row.superMoon)).toBe(false);
  });

  test("links the row to the month page only while that month has one", () => {
    expect(full.rows.find((row) => row.date === "2026-11-24")?.monthHref).toBe("/lunnyy-kalendar/noyabr-2026");
    expect(full.rows.find((row) => row.date === "2026-01-03")?.monthHref).toBeNull();
  });

  test("offers the three years of the window and the other kind of the same year", () => {
    expect(full.years.map((item) => item.label)).toEqual(["2025", "2026", "2027"]);
    expect(full.years.filter((item) => item.current).map((item) => item.label)).toEqual(["2026"]);
    expect(full.other.href).toBe("/luna/novoluniya-2026");
    expect(fresh.other.href).toBe("/luna/polnoluniya-2026");
  });

  test("the accepted texts are shown: an intro, and the questions with the real dates and the supermoons", () => {
    expect(full.intro).toContain("2026");
    expect(full.faq.map((item) => item.question)).toEqual(["Сколько полнолуний в 2026 году?", "Что такое суперлуние?", "Чем полнолуние отличается от новолуния?", "Почему время указано по Москве?"]);
    expect(full.faq[1]!.answer).toContain("24 ноября, 17:54; 24 декабря, 04:28");
    expect(fresh.faq).toHaveLength(3);
    expect(fresh.faq[0]!.answer).toContain("9 ноября, 10:02");
  });
});

describe("buildPhasesPage", () => {
  const page = buildPhasesPage(NOW);

  test("shows eight phases with one current, and four upcoming main phases in order", () => {
    expect(page.schema).toHaveLength(8);
    expect(page.schema.filter((item) => item.current)).toHaveLength(1);
    expect(page.upcoming).toHaveLength(4);
    expect(page.upcoming.map((item) => item.date)).toEqual([...page.upcoming.map((item) => item.date)].sort());
    expect(new Set(page.upcoming.map((item) => item.name)).size).toBe(4);
  });

  test("shows the eight phase texts, the intro and three questions", () => {
    expect(page.cards).toHaveLength(8);
    expect(page.intro).toContain("восемь фаз");
    expect(page.faq).toHaveLength(3);
  });

  test("all eight phase cards carry a picture of the 480 px size", () => {
    expect(page.cards.filter((card) => card.image).length).toBe(8);
    expect(page.cards.find((card) => card.phase === "full")!.image).toBe("/luna/phases/full-480.webp");
    expect(page.cards.find((card) => card.phase === "lastQuarter")!.image).toBe("/luna/phases/lastQuarter-480.webp");
  });
});

describe("month page additions", () => {
  test("the month summary names the dates and the signs of the new and full moon", () => {
    expect(buildMonthPage(2026, 11, NOW).summary).toContain("полнолуние — 24 ноября, 17:54 (в этот момент Луна в Близнецах)");
  });

  test("the new and full moon link to the real spreads from the key points only, and the timeline does not repeat them", () => {
    const slugs = TARO_SPREADS.map((spread) => spreadPath(spread));
    expect(slugs).toContain(SPREAD_ACTIONS.new!.href);
    expect(slugs).toContain(SPREAD_ACTIONS.full!.href);
    const page = buildMonthPage(2026, 11, NOW);
    expect(page.keyPoints.filter((point) => point.action).map((point) => point.kind).sort()).toEqual(["full", "new"]);
    expect(page.timeline.some((item) => item.action)).toBe(false);
  });
});
