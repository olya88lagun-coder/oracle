import { describe, expect, test } from "vitest";
import { conclusionJobKey, guideMoveJobKey, LILA_CONCLUSION_CHAPTERS, LILA_CONCLUSION_TITLES, LILA_SESSION_PRICE_KOPECKS, lilaFacts } from "./lila-session";

const move = (from: number, landed: number, to: number, transition: "none" | "snake" | "arrow" = "none", note: string | null = null) => ({ from, landed, to, transition, note });

describe("session constants", () => {
  test("cost 490 rubles and give each job a stable key", () => {
    expect(LILA_SESSION_PRICE_KOPECKS).toBe(49_000);
    expect(guideMoveJobKey({ gameId: "g1", n: 4 })).toBe("lila-guide-move:g1:4");
    expect(conclusionJobKey({ gameId: "g1" })).toBe("lila-conclusion:g1");
  });

  test("have a title for every conclusion chapter", () => {
    expect(LILA_CONCLUSION_CHAPTERS.map((id) => LILA_CONCLUSION_TITLES[id])).toEqual(["Намерение и путь", "Что повторялось", "Что вы замечали", "Вывод и шаг на неделю"]);
  });
});

describe("lilaFacts", () => {
  test("counts moves, waits, snakes, arrows, opened cells and notes", () => {
    const facts = lilaFacts([move(0, 0, 0), move(0, 1, 1), move(1, 12, 8, "snake", "Заметила."), move(8, 18, 18), move(18, 10, 23, "arrow")]);
    expect(facts).toMatchObject({ movesCount: 5, wastedMoves: 1, snakes: 1, arrows: 1, notesCount: 1, finalPosition: 23, reachedGoal: false });
    expect(facts.openedCells).toBe(6);
  });

  test("lists cells visited more than once, most visited first", () => {
    const facts = lilaFacts([move(0, 1, 1), move(1, 12, 8, "snake"), move(8, 12, 8, "snake"), move(8, 12, 8, "snake")]);
    expect(facts.repeated).toEqual([
      { cell: 8, visits: 3 },
      { cell: 12, visits: 3 },
    ]);
  });

  test("marks the goal and handles an empty game", () => {
    expect(lilaFacts([move(67, 68, 68)])).toMatchObject({ reachedGoal: true, finalPosition: 68 });
    expect(lilaFacts([])).toMatchObject({ movesCount: 0, finalPosition: 0, reachedGoal: false, repeated: [] });
  });
});
