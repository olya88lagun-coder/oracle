import { findStopPhrases } from "@oracle/content";
import { LILA_CONCLUSION_CHAPTERS } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { fallbackConclusionChapter } from "./lila-fallback";
import type { ConclusionInput } from "./lila-input";

const base = (chapter: ConclusionInput["chapter"], extra: Partial<ConclusionInput> = {}): ConclusionInput => ({
  chapter,
  intention: "Что мне важно?",
  facts: { moves: 12, waits: 2, snakes: 3, arrows: 1, openedCells: 9, reachedGoal: false, stoppedAt: "Зависть" },
  visited: [],
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
    const withRoute = base("path", { visited: [{ n: 1, cell: "Рождение", from: null, passage: null, note: null }, { n: 2, cell: "Зависть", from: "Гнев", passage: "змея", note: null }] });
    expect(fallbackConclusionChapter(withRoute).paragraphs.join(" ")).toContain("1. «Рождение»");
    expect(fallbackConclusionChapter(withRoute).paragraphs.join(" ")).toContain("2. «Зависть» (змея, с «Гнев»)");
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

  test("without repeats the outcome still ties the step to the last note", () => {
    const notes = [{ n: 4, cell: "Алчность", text: "Хочу оставить вечер без задач." }];
    const text = fallbackConclusionChapter(base("outcome", { notes })).paragraphs.join(" ");
    expect(text).toContain("«Алчность»");
    expect(text).toContain("Хочу оставить вечер без задач.");
    expect(text).toContain("21:00");
    expect(text).toContain("за столом");
  });

  test("the outcome ties the most visited cell to the note written on it and to the intention, with a way to check the step", () => {
    const repeated = [{ cell: "Зависть", visits: 3, about: "О.", question: "Чему я завидую?" }];
    const notes = [{ n: 4, cell: "Зависть", text: "Сравниваю свой темп с чужим." }, { n: 7, cell: "Гнев", text: "Другая клетка." }];
    const text = fallbackConclusionChapter(base("outcome", { repeated, notes })).paragraphs.join(" ");
    expect(text).toContain("вы возвращались 3 раза");
    expect(text).toContain("на ходе 4 записали: «Сравниваю свой темп с чужим.»");
    expect(text).not.toContain("Другая клетка.");
    expect(text).toContain("Это предположение, а не вывод");
    expect(text).toContain("Проверка:");
  });
});
