import { describe, expect, test } from "vitest";
import {
  applyLilaRoll,
  canFinishLila,
  canRollLila,
  isLilaRoll,
  LILA_ARROWS,
  LILA_SNAKES,
  lilaQuestionIndex,
  lilaVisitCounts,
  replayLila,
} from "./lila";

describe("snakes and arrows tables", () => {
  test("match the approved Harish Johari scheme", () => {
    expect(LILA_SNAKES).toEqual({ 12: 8, 16: 4, 24: 7, 29: 6, 44: 9, 52: 35, 55: 3, 61: 13, 63: 2, 72: 51 });
    expect(LILA_ARROWS).toEqual({ 10: 23, 17: 69, 20: 32, 22: 60, 27: 41, 28: 50, 37: 66, 45: 67, 46: 62, 54: 68 });
  });

  test("snakes go down and arrows go up", () => {
    for (const [from, to] of Object.entries(LILA_SNAKES)) expect(to).toBeLessThan(Number(from));
    for (const [from, to] of Object.entries(LILA_ARROWS)) expect(to).toBeGreaterThan(Number(from));
  });
});

describe("applyLilaRoll", () => {
  test("only a six lets the game begin, and it lands on cell 1", () => {
    expect(applyLilaRoll(0, 6)).toMatchObject({ landed: 1, to: 1, entered: true, wasted: false });
    for (const roll of [1, 2, 3, 4, 5]) expect(applyLilaRoll(0, roll)).toMatchObject({ landed: 0, to: 0, entered: false, wasted: true });
  });

  test("an ordinary move lands on the target cell", () => {
    expect(applyLilaRoll(1, 4)).toEqual({ roll: 4, from: 1, landed: 5, to: 5, transition: "none", entered: false, reachedGoal: false, wasted: false });
  });

  test("a snake takes the player down and reports both cells", () => {
    expect(applyLilaRoll(6, 6)).toMatchObject({ landed: 12, to: 8, transition: "snake" });
  });

  test("an arrow takes the player up", () => {
    expect(applyLilaRoll(4, 6)).toMatchObject({ landed: 10, to: 23, transition: "arrow" });
    expect(applyLilaRoll(11, 6)).toMatchObject({ landed: 17, to: 69, transition: "arrow" });
  });

  test("the goal needs an exact roll; an overshoot changes nothing", () => {
    expect(applyLilaRoll(67, 1)).toMatchObject({ landed: 68, to: 68, reachedGoal: true });
    expect(applyLilaRoll(66, 3)).toMatchObject({ landed: 66, to: 66, wasted: true, reachedGoal: false });
  });

  test("the arrow 54 to 68 also reaches the goal", () => {
    expect(applyLilaRoll(50, 4)).toMatchObject({ landed: 54, to: 68, transition: "arrow", reachedGoal: true });
  });

  test("from the cells above the goal the player moves on, and 72 is a snake to 51", () => {
    expect(applyLilaRoll(69, 3)).toMatchObject({ landed: 72, to: 51, transition: "snake", reachedGoal: false });
    expect(applyLilaRoll(70, 3)).toMatchObject({ wasted: true, to: 70 });
    expect(applyLilaRoll(71, 1)).toMatchObject({ landed: 72, to: 51 });
  });

  test("rejects the goal cell as a start, positions outside the field and rolls outside 1-6", () => {
    expect(() => applyLilaRoll(68, 1)).toThrow(RangeError);
    expect(() => applyLilaRoll(-1, 1)).toThrow(RangeError);
    expect(() => applyLilaRoll(73, 1)).toThrow(RangeError);
    expect(() => applyLilaRoll(1.5, 1)).toThrow(RangeError);
    for (const roll of [0, 7, 2.5, Number.NaN]) expect(() => applyLilaRoll(1, roll)).toThrow(RangeError);
  });

  test("every position and roll gives a result inside the field", () => {
    for (let position = 0; position <= 72; position += 1) {
      if (position === 68) continue;
      for (let roll = 1; roll <= 6; roll += 1) {
        const result = applyLilaRoll(position, roll);
        expect(result.from).toBe(position);
        expect(result.to).toBeGreaterThanOrEqual(0);
        expect(result.to).toBeLessThanOrEqual(72);
        if (result.wasted) expect(result.to).toBe(position);
        else expect(result.landed).not.toBe(position);
      }
    }
  });
});

describe("visits and questions", () => {
  test("count both the landing cell and the arrival cell, but not wasted moves", () => {
    const moves = [
      { landed: 1, to: 1, wasted: false },
      { landed: 12, to: 8, wasted: false },
      { landed: 8, to: 8, wasted: true },
    ];
    expect(lilaVisitCounts(moves)).toEqual(
      new Map([
        [1, 1],
        [12, 1],
        [8, 1],
      ]),
    );
  });

  test("the question changes on the second and third visit and then stays", () => {
    expect([1, 2, 3, 4, 9].map(lilaQuestionIndex)).toEqual([0, 1, 2, 2, 2]);
    expect(lilaQuestionIndex(0)).toBe(0);
  });
});

describe("replayLila", () => {
  test("returns the final position and every result", () => {
    const { position, results } = replayLila([3, 6, 5, 6]);
    expect(results.map((r) => r.to)).toEqual([0, 1, 6, 8]);
    expect(position).toBe(8);
  });

  test("the shortest way to the goal uses three arrows: 4 → 10 → 23, 28 → 50, 54 → 68", () => {
    const { position, results } = replayLila([6, 3, 6, 5, 4]);
    expect(results.map((r) => r.to)).toEqual([1, 4, 23, 50, 68]);
    expect(position).toBe(68);
    expect(results.at(-1)).toMatchObject({ landed: 54, transition: "arrow", reachedGoal: true });
  });

  test("rejects an invalid roll and any roll after the goal", () => {
    expect(() => replayLila([6, 9])).toThrow(RangeError);
    expect(() => replayLila([6, 3, 6, 5, 4, 1])).toThrow(RangeError);
  });
});

describe("game limits", () => {
  test("a roll is possible until the goal or the move limit", () => {
    expect(canRollLila({ position: 20, movesCount: 5 })).toBe(true);
    expect(canRollLila({ position: 68, movesCount: 5 })).toBe(false);
    expect(canRollLila({ position: 20, movesCount: 120 })).toBe(false);
  });

  test("finishing is possible at the goal or from ten moves", () => {
    expect(canFinishLila({ position: 68, movesCount: 3 })).toBe(true);
    expect(canFinishLila({ position: 20, movesCount: 9 })).toBe(false);
    expect(canFinishLila({ position: 20, movesCount: 10 })).toBe(true);
  });

  test("isLilaRoll accepts integers 1-6 only", () => {
    expect([1, 6].every(isLilaRoll)).toBe(true);
    expect([0, 7, 1.2, "3", null].some(isLilaRoll)).toBe(false);
  });
});
