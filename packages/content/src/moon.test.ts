import { PHASES } from "@oracle/core/moon";
import { describe, expect, test } from "vitest";
import { checkMoonTexts, findViolations, FORBIDDEN_MOON_WORDS, LUNAR_DAY_TEXTS, lunarDayText, MOON_TEXTS_ACCEPTED, PHASE_TEXTS, phaseText } from "./moon";

const words = (text: string) => text.trim().split(/\s+/).length;

describe("moon texts", () => {
  test("there is one text for each of the 30 lunar days", () => {
    expect(LUNAR_DAY_TEXTS.map((entry) => entry.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  test("there is one text for each of the 8 phases", () => {
    expect([...PHASE_TEXTS.map((entry) => entry.phase)].sort()).toEqual([...PHASES].sort());
  });

  test("every text has a symbol or title, a body of 25–90 words and a question for oneself", () => {
    for (const entry of LUNAR_DAY_TEXTS) {
      expect(entry.symbol.length, `symbol of day ${entry.day}`).toBeGreaterThan(2);
      expect(words(entry.text), `words of day ${entry.day}`).toBeGreaterThanOrEqual(25);
      expect(words(entry.text), `words of day ${entry.day}`).toBeLessThanOrEqual(90);
      expect(entry.question.endsWith("?"), `question of day ${entry.day}`).toBe(true);
    }
    for (const entry of PHASE_TEXTS) {
      expect(entry.title.length, `title of ${entry.phase}`).toBeGreaterThan(2);
      expect(words(entry.text), `words of ${entry.phase}`).toBeGreaterThanOrEqual(25);
      expect(words(entry.text), `words of ${entry.phase}`).toBeLessThanOrEqual(90);
      expect(entry.question.endsWith("?"), `question of ${entry.phase}`).toBe(true);
    }
  });

  test("no text contains a forbidden word and the check passes", () => {
    expect(checkMoonTexts()).toEqual([]);
  });

  test("the check catches forbidden words, case-insensitively, in any field", () => {
    const violations = findViolations([{ id: "x", fields: ["Это БЛАГОПРИЯТНЫЙ день", "хорошо для стрижки?", "нейтрально"] }]);
    expect(violations).toHaveLength(2);
    expect(FORBIDDEN_MOON_WORDS).toEqual(expect.arrayContaining(["благоприятн", "стрижк", "свидани", "лучше не"]));
  });

  test("texts stay hidden until the owner accepts them", () => {
    expect(MOON_TEXTS_ACCEPTED).toBe(false);
    expect(lunarDayText(8)).toBeUndefined();
    expect(phaseText("full")).toBeUndefined();
  });
});
