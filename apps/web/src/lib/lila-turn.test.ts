import type { LilaCell } from "@oracle/content/lila";
import { describe, expect, test } from "vitest";
import { describeGameFacts, describeTurn, openedCells, trailOf } from "./lila-turn";
import { toGameView } from "./lila-view";

const cellOf = (n: number): LilaCell => ({
  number: n,
  name: `Клетка ${n}`,
  slug: "kletka",
  about: `О клетке ${n}`,
  questions: [`Вопрос 1 клетки ${n}?`, `Вопрос 2 клетки ${n}?`, `Вопрос 3 клетки ${n}?`],
  transition: n === 12 ? "Вы возвращаетесь к теме." : null,
});
const move = (n: number, from: number, landed: number, to: number, roll: number, transition: "none" | "snake" | "arrow" = "none", note: string | null = null) => ({ n, roll, from, landed, to, transition, customDie: false, note });
const view = (moves: ReturnType<typeof move>[]) =>
  toGameView({ id: "g", mode: "free", status: "active", intention: "Что мне важно?", position: moves.at(-1)?.to ?? 0, movesCount: moves.length, moves });

describe("describeTurn", () => {
  test("a wasted start asks what the player notices while waiting", () => {
    const turn = describeTurn(view([move(1, 0, 0, 0, 3)]), 0, cellOf);
    expect(turn).toMatchObject({ kind: "wait", landed: null, arrival: null });
    expect(turn.question).toMatch(/шестёрк/);
  });

  test("the entry shows cell 1 with its first question", () => {
    expect(describeTurn(view([move(1, 0, 1, 1, 6)]), 0, cellOf)).toMatchObject({ kind: "entry", question: "Вопрос 1 клетки 1?", visit: 1 });
  });

  test("a snake shows the landing cell, its transition line and the arrival cell with its question", () => {
    const turn = describeTurn(view([move(1, 0, 1, 1, 6), move(2, 1, 12, 8, 6, "snake")]), 1, cellOf);
    expect(turn).toMatchObject({ kind: "step", transitionText: "Вы возвращаетесь к теме.", question: "Вопрос 1 клетки 8?" });
    expect(turn.landed?.number).toBe(12);
    expect(turn.arrival?.number).toBe(8);
  });

  test("a repeated visit uses the next question and shows the previous note", () => {
    const moves = [move(1, 0, 1, 1, 6), move(2, 1, 12, 8, 6, "snake", "Первая запись"), move(3, 8, 12, 8, 4, "snake")];
    const turn = describeTurn(view(moves), 2, cellOf);
    expect(turn).toMatchObject({ visit: 2, question: "Вопрос 2 клетки 8?", previousNote: "Первая запись" });
  });

  test("the goal is reported as such", () => {
    expect(describeTurn(view([move(1, 67, 68, 68, 1)]), 0, cellOf).kind).toBe("goal");
  });

  test("a wasted move on the field says how far the goal is", () => {
    const turn = describeTurn(view([move(1, 66, 66, 66, 5)]), 0, cellOf);
    expect(turn).toMatchObject({ kind: "wait" });
    expect(turn.question).toMatch(/2/);
  });
});

describe("openedCells and trailOf", () => {
  const moves = [move(1, 0, 1, 1, 6), move(2, 1, 12, 8, 6, "snake"), move(3, 8, 8, 8, 1)];
  test("count distinct opened cells, ignoring wasted moves", () => {
    expect(openedCells(view(moves.slice(0, 2)))).toBe(3);
  });
  test("the trail lists the cells the piece went through without repeats in a row", () => {
    expect(trailOf(view(moves.slice(0, 2)))).toEqual([1, 12, 8]);
  });
});

describe("describeGameFacts", () => {
  test("counts moves, snakes, arrows and opened cells with the right plural forms", () => {
    const moves = [move(1, 0, 1, 1, 6), move(2, 1, 12, 8, 6, "snake"), move(3, 8, 10, 23, 2, "arrow")];
    expect(describeGameFacts(view(moves))).toBe("3 хода · 1 змея · 1 стрела · открыто клеток 5");
    expect(describeGameFacts(view([]))).toBe("0 ходов · 0 змей · 0 стрел · открыто клеток 0");
  });
});
