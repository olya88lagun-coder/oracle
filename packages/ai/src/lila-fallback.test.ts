import { findStopPhrases } from "@oracle/content";
import { LILA_CONCLUSION_CHAPTERS } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { fallbackConclusionChapter } from "./lila-fallback";
import type { ConclusionInput } from "./lila-input";

const base = (chapter: ConclusionInput["chapter"], extra: Partial<ConclusionInput> = {}): ConclusionInput => ({
  chapter,
  intention: "Что мне важно?",
  facts: { moves: 12, waits: 2, snakes: 3, arrows: 1, openedCells: 9, reachedGoal: false, stoppedAt: "Зависть" },
  repeated: [],
  notes: [],
  earlier: [],
  ...extra,
});

describe("fallbackConclusionChapter", () => {
  test.each(LILA_CONCLUSION_CHAPTERS)("builds «%s» without a model: marked as fallback, two paragraphs, no stop phrases", (chapter) => {
    const result = fallbackConclusionChapter(base(chapter));
    expect(result).toMatchObject({ id: chapter, source: "fallback" });
    expect(result.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(findStopPhrases(result.paragraphs.join("\n"))).toEqual([]);
  });

  test("the path names the number of moves and snakes and where the player stopped", () => {
    const text = fallbackConclusionChapter(base("path")).paragraphs.join(" ");
    expect(text).toContain("12 ходов");
    expect(text).toContain("змей: 3");
    expect(text).toContain("«Зависть»");
    const reached = base("path", { facts: { moves: 21, waits: 0, snakes: 0, arrows: 0, openedCells: 21, reachedGoal: true, stoppedAt: null } });
    expect(fallbackConclusionChapter(reached).paragraphs.join(" ")).toContain("дошли до клетки 68");
  });

  test("says so when nothing repeated and when there are no notes", () => {
    expect(fallbackConclusionChapter(base("repeats")).paragraphs.join(" ")).toContain("Возвратов");
    expect(fallbackConclusionChapter(base("noticed")).paragraphs.join(" ")).toContain("записей мыслей нет");
  });

  test("lists repeated cells and recent notes", () => {
    const repeated = [{ cell: "Зависть", visits: 3, about: "О.", question: "Чему я завидую?" }];
    const notes = [{ n: 4, cell: "Зависть", text: "Заметила." }];
    expect(fallbackConclusionChapter(base("repeats", { repeated })).paragraphs.join(" ")).toContain("«Зависть» — 3 раза");
    expect(fallbackConclusionChapter(base("noticed", { notes })).paragraphs.join(" ")).toContain("ход 4, «Зависть»: «Заметила.»");
  });

  test("the outcome names the most visited cell and its first question, or gives a generic step", () => {
    const repeated = [{ cell: "Зависть", visits: 3, about: "О.", question: "Чему я завидую?" }];
    const withTop = fallbackConclusionChapter(base("outcome", { repeated })).paragraphs.join(" ");
    expect(withTop).toContain("«Зависть»");
    expect(withTop).toContain("Чему я завидую?");
    expect(fallbackConclusionChapter(base("outcome")).paragraphs.join(" ")).toContain("Шаг на 7 дней");
  });
});
