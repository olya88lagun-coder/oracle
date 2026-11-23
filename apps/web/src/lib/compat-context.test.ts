import { findStopPhrases } from "@oracle/content";
import { describe, expect, test } from "vitest";
import { COMPAT_CONTEXT_FOOTNOTE, COMPAT_CONTEXTS } from "./compat-context";

describe("compat contexts", () => {
  test("four contexts, the couple first", () => {
    expect(COMPAT_CONTEXTS.map((context) => context.id)).toEqual(["pair", "friends", "colleagues", "family"]);
  });

  test("each context has a note and five open questions that end with a question mark", () => {
    for (const context of COMPAT_CONTEXTS) {
      expect(context.note.length).toBeGreaterThan(40);
      expect(context.questions).toHaveLength(5);
      for (const question of context.questions) expect(question.endsWith("?")).toBe(true);
    }
  });

  test("nobody is scored or promised anything: no stop phrases, no percentages, no verdict words", () => {
    const text = [...COMPAT_CONTEXTS.flatMap((context) => [context.note, ...context.questions]), COMPAT_CONTEXT_FOOTNOTE].join("\n");
    expect(findStopPhrases(text)).toEqual([]);
    expect(text).not.toMatch(/%|подходите|не подходите|совместимы на/i);
  });

  test("the colleagues note says that the result does not judge professional qualities", () => {
    expect(COMPAT_CONTEXTS.find((context) => context.id === "colleagues")?.note).toMatch(/не оценивает профессиональные качества/);
  });
});
