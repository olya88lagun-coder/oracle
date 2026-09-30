import { describe, expect, test } from "vitest";
import { buildConclusionInputs, buildGuideInput, type GuideCells } from "./lila-input";

const cellOf: GuideCells = (n) => ({ name: `Клетка ${n}`, about: `О клетке ${n}.`, questions: [`Вопрос 1 клетки ${n}?`, `Вопрос 2 клетки ${n}?`, `Вопрос 3 клетки ${n}?`], transition: null });
const move = (n: number, from: number, landed: number, to: number, roll: number, transition: "none" | "snake" | "arrow" = "none", note: string | null = null) => ({ n, roll, from, landed, to, transition, note });
const moves = [move(1, 0, 1, 1, 6), move(2, 1, 12, 8, 6, "snake", "Первая запись"), move(3, 8, 12, 8, 4, "snake")];

describe("buildGuideInput", () => {
  test("describes the current move, the earlier moves and the revisit", () => {
    const input = buildGuideInput({ intention: "Что мне важно?", moves, index: 2, cellOf });
    expect(input.current).toMatchObject({ n: 3, cell: "Клетка 8", passage: "змея", from: "Клетка 12", revisit: true, question: "Вопрос 2 клетки 8?" });
    expect(input.earlier.map((m) => [m.n, m.cell, m.note])).toEqual([
      [1, "Клетка 1", null],
      [2, "Клетка 8", "Первая запись"],
    ]);
  });

  test("keeps at most eight earlier moves and clips long notes to 300 characters", () => {
    const many = Array.from({ length: 12 }, (_, i) => move(i + 1, i + 1, i + 2, i + 2, 1, "none", "я".repeat(500)));
    const input = buildGuideInput({ intention: "Что мне важно?", moves: many, index: 11, cellOf });
    expect(input.earlier).toHaveLength(8);
    expect(input.earlier[0]!.note).toHaveLength(300);
  });

  test("carries no identifiers, e-mail or dates: only the intention, cells, rolls and notes", () => {
    const text = JSON.stringify(buildGuideInput({ intention: "Что мне важно?", moves, index: 1, cellOf }));
    for (const forbidden of ["userId", "gameId", "purchase", "email", "birth", "displayName", "uuid"]) expect(text.toLowerCase()).not.toContain(forbidden.toLowerCase());
  });
});

describe("buildConclusionInputs", () => {
  test("gives every chapter the intention, facts, repeated cells and recent notes", () => {
    const base = buildConclusionInputs({ intention: "Что мне важно?", moves, cellOf });
    expect(Object.keys(base)).toEqual(["path", "repeats", "noticed", "outcome"]);
    expect(base.path.facts).toMatchObject({ moves: 3, snakes: 2, reachedGoal: false });
    expect(base.repeats.repeated[0]).toMatchObject({ cell: "Клетка 8", visits: 2 });
    expect(base.noticed.notes).toEqual([{ n: 2, cell: "Клетка 8", text: "Первая запись" }]);
  });

  test("keeps at most twenty notes, the most recent ones", () => {
    const many = Array.from({ length: 30 }, (_, i) => move(i + 1, i + 1, i + 2, i + 2, 1, "none", `Запись ${i + 1}`));
    const base = buildConclusionInputs({ intention: "Что мне важно?", moves: many, cellOf });
    expect(base.noticed.notes).toHaveLength(20);
    expect(base.noticed.notes.at(-1)!.text).toBe("Запись 30");
  });
});
