import { NATAL_CHAPTER_IDS } from "@oracle/core/natal";
import { describe, expect, test } from "vitest";
import { findStopPhrases } from "./check";
import { NATAL_ASPECT_NAMES, NATAL_CHAPTER_INTROS } from "./natal-report-texts";

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

describe("natal report chapter intros", () => {
  test("every chapter has an intro of 15–60 words", () => {
    expect(Object.keys(NATAL_CHAPTER_INTROS).sort()).toEqual([...NATAL_CHAPTER_IDS].sort());
    for (const id of NATAL_CHAPTER_IDS) {
      expect(words(NATAL_CHAPTER_INTROS[id]), id).toBeGreaterThanOrEqual(15);
      expect(words(NATAL_CHAPTER_INTROS[id]), id).toBeLessThanOrEqual(60);
    }
  });

  test("have no stop phrases, no informal address and no karma", () => {
    for (const id of NATAL_CHAPTER_IDS) {
      expect(findStopPhrases(NATAL_CHAPTER_INTROS[id]), id).toEqual([]);
      expect(NATAL_CHAPTER_INTROS[id], id).not.toMatch(/\b(ты|тебя|тебе|карма|кармическ)/i);
    }
  });

  test("names the five aspects in Russian", () => {
    expect(NATAL_ASPECT_NAMES).toEqual({ conjunction: "соединение", sextile: "секстиль", square: "квадрат", trine: "трин", opposition: "оппозиция" });
  });
});
