import { describe, expect, test } from "vitest";
import { findViolations, FORBIDDEN_MOON_WORDS } from "./moon";
import { checkMoonCalendarTexts, MONTH_FAQ_TEMPLATES, MONTH_INTRO, monthIntro, MOON_CALENDAR_TEXTS_ACCEPTED, type MonthFacts } from "./moon-calendar";

const words = (text: string) => text.trim().split(/\s+/).length;
const november: MonthFacts = {
  month: "ноябрь",
  monthLocative: "ноябре",
  year: 2026,
  events: { new: ["9 ноября, 10:02"], firstQuarter: ["17 ноября, 14:47"], full: ["24 ноября, 17:53"], lastQuarter: ["1 ноября, 23:28"] },
};
const may: MonthFacts = { ...november, month: "май", monthLocative: "мае", events: { new: ["16 мая, 23:01"], firstQuarter: ["23 мая, 14:10"], full: ["1 мая, 20:23", "31 мая, 11:45"], lastQuarter: ["10 мая, 00:10"] } };
const noNewMoon: MonthFacts = { ...november, events: { ...november.events, new: [] } };

describe("month FAQ templates", () => {
  test("has four questions that name the month and the year", () => {
    expect(MONTH_FAQ_TEMPLATES).toHaveLength(4);
    const questions = MONTH_FAQ_TEMPLATES.map((template) => template.question("ноябре", 2026));
    expect(questions[0]).toBe("Когда новолуние в ноябре 2026?");
    expect(questions[1]).toBe("Когда полнолуние в ноябре 2026?");
    expect(questions[2]).toBe("Какие фазы Луны в ноябре 2026?");
    expect(questions[3]).toBe("Как читать лунный календарь?");
  });

  test("the full moon answer names one date, or both dates in a month with two full moons", () => {
    const full = MONTH_FAQ_TEMPLATES[1]!;
    expect(full.answer(november)).toContain("24 ноября, 17:53");
    const both = full.answer(may);
    expect(both).toContain("1 мая, 20:23");
    expect(both).toContain("31 мая, 11:45");
  });

  test("an event that does not happen in the month is said so honestly, without an invented date", () => {
    const answer = MONTH_FAQ_TEMPLATES[0]!.answer(noNewMoon);
    expect(answer).toMatch(/нет/);
    expect(answer).not.toMatch(/\d{1,2} ноября, \d\d:\d\d/);
  });

  test("the phases answer lists the events of the month in order of the phase cycle and skips missing ones", () => {
    const answer = MONTH_FAQ_TEMPLATES[2]!.answer(november);
    for (const label of ["9 ноября, 10:02", "17 ноября, 14:47", "24 ноября, 17:53", "1 ноября, 23:28"]) expect(answer).toContain(label);
    expect(answer.indexOf("9 ноября")).toBeLessThan(answer.indexOf("17 ноября"));
    expect(answer.indexOf("17 ноября")).toBeLessThan(answer.indexOf("24 ноября"));
    expect(MONTH_FAQ_TEMPLATES[2]!.answer(noNewMoon)).not.toContain("Новолуние —");
  });

  test("every answer is substantial in every variant", () => {
    for (const facts of [november, may, noNewMoon]) for (const template of MONTH_FAQ_TEMPLATES) expect(words(template.answer(facts))).toBeGreaterThanOrEqual(15);
  });

  test("no question or answer contains a forbidden word", () => {
    for (const facts of [november, may, noNewMoon]) {
      for (const template of MONTH_FAQ_TEMPLATES) {
        const text = `${template.question(facts.monthLocative, facts.year)} ${template.answer(facts)}`.toLowerCase();
        for (const word of FORBIDDEN_MOON_WORDS) expect(text, word).not.toContain(word);
      }
    }
  });
});

describe("intro and checks", () => {
  test("the intro is two or three sentences without evaluations", () => {
    expect(MONTH_INTRO.split(/[.!?]/).filter((sentence) => sentence.trim()).length).toBeGreaterThanOrEqual(2);
    expect(MONTH_INTRO.split(/[.!?]/).filter((sentence) => sentence.trim()).length).toBeLessThanOrEqual(3);
  });

  test("the check passes on the written texts and catches a forbidden word", () => {
    expect(checkMoonCalendarTexts()).toEqual([]);
    expect(findViolations([{ id: "x", fields: ["благоприятный день для стрижки"] }]).length).toBeGreaterThan(0);
  });

  test("the intro stays hidden until the owner accepts the texts", () => {
    expect(MOON_CALENDAR_TEXTS_ACCEPTED).toBe(false);
    expect(monthIntro()).toBeUndefined();
  });
});
