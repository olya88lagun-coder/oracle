import { describe, expect, test } from "vitest";
import { buildDayPage, buildDaysHub, buildEclipsePage, buildRetroPage, dayOrdinal } from "./moon-events";

const NOW = new Date("2026-11-20T09:00:00Z");

describe("buildEclipsePage", () => {
  const page = buildEclipsePage(2026, NOW);

  test("lists the four eclipses of 2026 in order with their kinds and the visibility from Moscow", () => {
    expect(page.rows.map((row) => [row.date, row.kindName, row.visibility])).toEqual([
      ["2026-02-17", "Кольцеобразное солнечное затмение", "Не видно"],
      ["2026-03-03", "Полное лунное затмение", "Не видно"],
      ["2026-08-12", "Полное солнечное затмение", "Видно частично"],
      ["2026-08-28", "Частное лунное затмение", "Не видно"],
    ]);
  });

  test("gives the share of the Sun covered for a solar eclipse seen at its maximum", () => {
    const rows = buildEclipsePage(2027, NOW).rows;
    expect(rows.find((row) => row.kindName === "Полное солнечное затмение")!.visibility).toMatch(/^Видно, закрыто (до \d+ %|менее 1 %)/);
  });

  test("the texts wait for the owner", () => {
    expect(page.intro).toBeNull();
    expect(page.faq).toEqual([]);
  });

  test("offers the three years of the window", () => {
    expect(page.years.map((item) => item.href)).toEqual(["/luna/zatmeniya-2025", "/luna/zatmeniya-2026", "/luna/zatmeniya-2027"]);
  });
});

describe("buildRetroPage", () => {
  test("Mercury in 2026: three periods with the stations in Moscow time, the signs and the length in days", () => {
    const page = buildRetroPage("mercury", 2026, NOW);
    expect(page.rows).toHaveLength(3);
    expect(page.title).toBe("Ретроградный Меркурий 2026");
    expect(page.rows[0]!.from).toMatch(/^26 февраля, /);
    expect(page.rows[2]!.to).toMatch(/^13 ноября, /);
    for (const row of page.rows) expect(row.days).toBeGreaterThan(18);
    expect(page.rows[0]!.signs).toMatch(/Рыбы/);
  });

  test("the title and the links follow the planet", () => {
    const venus = buildRetroPage("venus", 2026, NOW);
    expect(venus.title).toBe("Ретроградная Венера 2026");
    expect(venus.years.map((item) => item.href)).toContain("/luna/retrograd-venery-2026");
    expect(venus.faq).toEqual([]);
  });
});

describe("buildDayPage", () => {
  test("day 8 is the Phoenix, falls on the first quarter, has three coming dates by Moscow noon and links to its neighbours", () => {
    const page = buildDayPage(8, NOW);
    expect(page.symbol).toBe("Феникс");
    expect(page.phases).toContain("Первая четверть");
    expect(page.illumination).toBeGreaterThanOrEqual(40);
    expect(page.illumination).toBeLessThanOrEqual(60);
    expect(page.dates).toHaveLength(3);
    expect(page.prev!.href).toBe("/luna/sutki/7");
    expect(page.next!.href).toBe("/luna/sutki/9");
    expect(page.text).toBeTruthy();
    expect(page.question).toMatch(/\?$/);
  });

  test("the first and the thirtieth days have one neighbour each, and the new moon days fall on the new moon phase", () => {
    expect(buildDayPage(1, NOW).prev).toBeNull();
    expect(buildDayPage(30, NOW).next).toBeNull();
    expect(buildDayPage(1, NOW).phases).toContain("Новолуние");
    expect(buildDayPage(15, NOW).phases).toContain("Полнолуние");
    expect(buildDayPage(30, NOW).phases).toContain("Новолуние");
  });

  test("the coming dates start from today, and a lunar day that lasts into two calendar days is shown as a range", () => {
    const page = buildDayPage(3, new Date("2026-11-10T09:00:00Z"));
    expect(page.dates[0]!.label).toMatch(/11–12 ноября|11 ноября/);
    for (const item of page.dates) expect(item.label).not.toBe("");
  });

  test("the note waits for the owner", () => {
    expect(buildDayPage(8, NOW).note).toBeNull();
  });

  test("the ordinal of the third days ends in «и», the thirteenth in «е»", () => {
    expect([1, 2, 3, 4, 13, 23, 30].map(dayOrdinal)).toEqual(["1-е", "2-е", "3-и", "4-е", "13-е", "23-и", "30-е"]);
  });
});

describe("buildDaysHub", () => {
  test("lists all 30 days with their symbols and links", () => {
    const hub = buildDaysHub();
    expect(hub.items).toHaveLength(30);
    expect(hub.items[0]).toEqual({ day: 1, symbol: "Светильник", href: "/luna/sutki/1" });
    expect(new Set(hub.items.map((item) => item.symbol)).size).toBe(30);
    expect(hub.intro).toBeNull();
  });
});
