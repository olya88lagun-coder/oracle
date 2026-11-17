import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { describe, expect, test } from "vitest";
import { buildMoonToday, MOON_FAQ, MOON_PATH, PHASE_NAMES } from "./moon-today";

const NOON_MOSCOW = new Date("2026-11-17T09:00:00Z");

describe("buildMoonToday", () => {
  test("labels the day by the Moscow calendar, not by the server's", () => {
    expect(buildMoonToday(NOON_MOSCOW).dateLabel).toBe("17 ноября 2026");
    // 21:30 UTC — уже 00:30 18 ноября по Москве
    expect(buildMoonToday(new Date("2026-11-17T21:30:00Z")).dateLabel).toBe("18 ноября 2026");
  });

  test("describes the Moon at noon on 17 Nov 2026: first quarter, Aquarius, lunar day 8, rising at about 13:53", () => {
    const today = buildMoonToday(NOON_MOSCOW);
    expect(today.snapshot.phase).toBe("firstQuarter");
    expect(today.phaseName).toBe(PHASE_NAMES.firstQuarter);
    expect(today.signName).toBe("в Водолее");
    expect(today.lunarDay.number).toBe(8);
    expect(today.rise).toMatch(/^13:5[0-6]$/);
    expect(today.set).toMatch(/^\d\d:\d\d$/);
  });

  test("names the next phase with a day word when it is today, and with a date otherwise", () => {
    expect(buildMoonToday(NOON_MOSCOW).next.label).toMatch(/^Первая четверть сегодня в 14:4[78]$/);
    expect(buildMoonToday(new Date("2026-11-18T09:00:00Z")).next.label).toMatch(/^Полнолуние 24 ноября, 17:5[234]$/);
  });

  test("has a 14-day strip starting today, one calendar day per cell, with the Moon at noon", () => {
    const { strip } = buildMoonToday(NOON_MOSCOW);
    expect(strip).toHaveLength(14);
    expect(strip[0]).toMatchObject({ date: "2026-11-17", isToday: true });
    expect(strip[1]?.date).toBe("2026-11-18");
    expect(strip[13]?.date).toBe("2026-11-30");
    expect(strip.filter((cell) => cell.isToday)).toHaveLength(1);
    expect(strip[0]!.snapshot.at.toISOString()).toBe("2026-11-17T09:00:00.000Z");
  });

  test("links the Moon's sign to the natal page and offers the card of the day and the natal chart", () => {
    const today = buildMoonToday(NOON_MOSCOW);
    expect(today.signSummary?.href).toBe("/natalnaya-karta/luna-v-vodolee");
    expect(today.signSummary?.text.length).toBeGreaterThan(20);
    expect(today.links).toEqual({ cardOfDay: "/taro/karta-dnya", natal: "/natalnaya-karta" });
  });

  test("carries the accepted texts for today's phase and lunar day", () => {
    const { texts } = buildMoonToday(NOON_MOSCOW);
    expect(texts.phase?.title).toBe("Первая четверть");
    expect(texts.day?.day).toBe(8);
    expect(texts.day?.symbol).toBe("Феникс");
  });

  test("the page path is /luna-segodnya", () => {
    expect(MOON_PATH).toBe("/luna-segodnya");
  });
});

describe("MOON_FAQ", () => {
  test("has at least four substantive answers without forbidden words", () => {
    expect(MOON_FAQ.length).toBeGreaterThanOrEqual(4);
    for (const item of MOON_FAQ) {
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.trim().split(/\s+/).length).toBeGreaterThanOrEqual(20);
      for (const word of FORBIDDEN_MOON_WORDS) expect((item.question + item.answer).toLowerCase()).not.toContain(word);
    }
  });
});
