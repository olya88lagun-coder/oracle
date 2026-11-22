import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { daysInMonth } from "@oracle/core/moon";
import { describe, expect, test } from "vitest";
import { dateAnswer, dateDescription, dateFaq, dateTitle } from "./lunar-day-copy";
import { buildDatePage, type DatePage } from "./lunar-day-page";

const NOW = new Date("2026-11-17T09:00:00Z");
const MONTHS = [[2026, 11], [2026, 12], [2027, 1]] as const;
const allPages = (): DatePage[] => MONTHS.flatMap(([year, month]) => Array.from({ length: daysInMonth(year, month) }, (_, index) => buildDatePage(year, month, index + 1, NOW)));
const texts = (page: DatePage): string[] => [dateTitle(page), dateDescription(page), dateAnswer(page), ...dateFaq(page).flatMap((item) => [item.question, item.answer])];

describe("the day with a main phase and a sign change at once", () => {
  const page = buildDatePage(2026, 11, 24, NOW);

  test("the phase leads the title, the description and the answer", () => {
    expect(dateTitle(page)).toBe("Луна 24 ноября 2026: полнолуние, 15-е лунные сутки");
    expect(dateDescription(page)).toContain("полнолуние в 17:54");
    expect(dateDescription(page)).toContain("восход в 15:12 по Москве");
    expect(dateDescription(page).endsWith("Бесплатно.")).toBe(true);
    const answer = dateAnswer(page);
    for (const part of ["17:54", "100 %", "15-е лунные сутки", "Луна входит в знак Близнецы в 14:09", "15:12", "08:32"]) expect(answer, part).toContain(part);
  });

  test("three questions with the date, the first one answered by the answer paragraph", () => {
    const faq = dateFaq(page);
    expect(faq).toHaveLength(3);
    for (const item of faq) expect(item.question).toContain("24 ноября 2026");
    expect(faq[0]!.answer).toBe(dateAnswer(page));
    expect(faq[1]!.answer).toContain("15-е лунные сутки");
    expect(faq[1]!.answer).toContain("16-е");
    expect(faq[2]!.answer).toContain("15:12");
  });
});

describe("a day next to the full moon", () => {
  test("is titled «около полнолуния», not as the full moon itself", () => {
    const page = buildDatePage(2026, 11, 23, NOW);
    expect(dateTitle(page)).toBe("Луна 23 ноября 2026: около полнолуния, 14-е лунные сутки");
    expect(dateAnswer(page).startsWith("23 ноября 2026 — около полнолуния.")).toBe(true);
  });
});

describe("the kinds of days", () => {
  const pages = allPages();

  test("a day with a sign change but no main phase is led by the sign change", () => {
    const page = pages.find((item) => item.signChange && !item.mainEvent)!;
    expect(page).toBeTruthy();
    expect(dateTitle(page)).toContain(`переход в знак ${page.signChange!.signName}`);
    expect(dateAnswer(page)).toContain(`входит в знак ${page.signChange!.signName}`);
  });

  test("an ordinary day is titled by its phase and its lunar day", () => {
    const page = pages.find((item) => !item.signChange && !item.mainEvent)!;
    expect(page).toBeTruthy();
    expect(dateTitle(page).endsWith(`, ${page.lunarLine}`)).toBe(true);
    expect(dateTitle(page)).not.toContain("переход");
  });

  test("a day without a moonrise or a moonset says so and never prints null", () => {
    const base = pages[0]!;
    for (const page of [{ ...base, rise: null }, { ...base, set: null }, { ...base, rise: null, set: null }]) {
      for (const text of texts(page)) expect(text).not.toMatch(/null|undefined/);
    }
    expect(dateAnswer({ ...base, rise: null })).toContain("не восходит");
    expect(dateAnswer({ ...base, set: null })).toContain("не заходит");
    expect(dateDescription({ ...base, rise: null })).toContain("не восходит");
  });
});

describe("honesty of the lead", () => {
  const pages = allPages();

  test("a day without a main phase is never led by the name of a main phase, even when its phase bucket is called so", () => {
    const day = pages.filter((page) => !page.mainEvent);
    expect(day.some((page) => /^Около /.test(page.phaseName))).toBe(true);
    expect(day.some((page) => /^(Новолуние|Полнолуние|Первая четверть|Последняя четверть)$/.test(page.phaseName))).toBe(false);
    for (const page of day) for (const text of [dateTitle(page), dateDescription(page), dateAnswer(page)]) expect(text.toLowerCase(), `${page.date}: ${text}`).not.toMatch(/новолуние|полнолуние|четверть/);
  });

  test("a day with a sign change names the sign at the moment of the change and not the sign at noon", () => {
    const changed = pages.filter((page) => page.signChange);
    expect(changed.length).toBeGreaterThan(10);
    for (const page of changed) {
      expect(dateDescription(page), page.date).toContain(`входит в знак ${page.signChange!.signName} в ${page.signChange!.time}`);
      expect(dateAnswer(page), page.date).toContain(`входит в знак ${page.signChange!.signName} в ${page.signChange!.time}`);
      expect(dateAnswer(page), page.date).not.toContain(`${page.signLine}.`);
    }
  });
});

describe("the texts of every date of three months", () => {
  const pages = allPages();

  test("contain no words of evaluation", () => {
    for (const page of pages) for (const text of texts(page)) for (const word of FORBIDDEN_MOON_WORDS) expect(text.toLowerCase(), `${page.date}: ${word}`).not.toContain(word);
  });

  test("differ from date to date, so no two pages share a title or a description", () => {
    expect(new Set(pages.map(dateTitle)).size).toBe(pages.length);
    expect(new Set(pages.map(dateDescription)).size).toBe(pages.length);
  });

  test("keep titles and descriptions of a sensible length", () => {
    for (const page of pages) {
      expect(dateTitle(page).length, page.date).toBeLessThanOrEqual(80);
      expect(dateDescription(page).length, page.date).toBeLessThanOrEqual(200);
    }
  });
});
