import { LILA_INTENTION_MAX_CHARS } from "@oracle/core";
import { findStopPhrases } from "@oracle/content";
import { describe, expect, test } from "vitest";
import { readLilaDraft, writeLilaDraft } from "./lila-draft";
import { INTENTION_EXAMPLES } from "./lila-intent-examples";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
};

describe("intention examples", () => {
  const all = INTENTION_EXAMPLES.flatMap((group) => group.items);

  test("the six themes of the game are covered, with nine examples in total", () => {
    expect(INTENTION_EXAMPLES.map((g) => g.theme)).toEqual(["Отношения", "Работа", "Деньги", "Выбор", "Перемены", "О себе"]);
    expect(all).toHaveLength(9);
  });

  test("every example is an open personal question that fits the intention limit and has no prediction wording", () => {
    for (const text of all) {
      expect(text.length).toBeLessThanOrEqual(LILA_INTENTION_MAX_CHARS);
      expect(text.endsWith("?")).toBe(true);
      expect(text).not.toMatch(/^(Будет ли|Сбудется|Получится ли|Почему он)/);
      expect(findStopPhrases(text)).toEqual([]);
    }
  });

  test("every example survives a round trip through the draft the game form reads", () => {
    for (const text of all) {
      const storage = memory();
      expect(writeLilaDraft({ text, theme: "" }, storage)).toBe(true);
      expect(readLilaDraft(storage)).toEqual({ text, theme: "" });
    }
  });
});
