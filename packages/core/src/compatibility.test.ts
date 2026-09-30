import { describe, expect, test } from "vitest";
import { calculateCompatibility } from "./compatibility";

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe("calculateCompatibility", () => {
  test("takes the key points of each person and sums the centers into the pair arcanum", () => {
    // 18.11.1988: личность 18, центр 11, задача 10. 01.01.2000: личность 1, центр 8, задача 4
    const result = calculateCompatibility(d(1988, 11, 18), d(2000, 1, 1));
    expect(result.people).toEqual([
      { personality: 18, center: 11, task: 10 },
      { personality: 1, center: 8, task: 4 },
    ]);
    expect(result.pair).toBe(19);
    expect(result.sameAtPoint).toEqual([]);
    expect(result.sharedArcana).toEqual([]);
  });

  test("the pair arcanum does not depend on who is first, but the people keep their order", () => {
    const ab = calculateCompatibility(d(1988, 11, 18), d(2000, 1, 1));
    const ba = calculateCompatibility(d(2000, 1, 1), d(1988, 11, 18));
    expect(ba.pair).toBe(ab.pair);
    expect(ba.people[0]).toEqual(ab.people[1]);
  });

  test("the same date twice matches at every key point and folds 22 as it is", () => {
    const result = calculateCompatibility(d(1988, 11, 18), d(1988, 11, 18));
    expect(result.sameAtPoint).toEqual(["personality", "center", "task"]);
    expect(result.sharedArcana).toEqual([10, 11, 18]);
    expect(result.pair).toBe(22);
  });

  test("lists the shared arcana sorted and without repeats, and every shared arcanum really belongs to both people", () => {
    const dates = [d(1988, 11, 18), d(2000, 1, 1), d(1999, 9, 29), d(1955, 5, 22), d(1990, 10, 10), d(2010, 2, 20)];
    for (const first of dates) {
      for (const second of dates) {
        const { people, sharedArcana } = calculateCompatibility(first, second);
        expect(new Set(sharedArcana).size).toBe(sharedArcana.length);
        expect([...sharedArcana]).toEqual([...sharedArcana].sort((x, y) => x - y));
        for (const arcanum of sharedArcana) {
          expect(Object.values(people[0])).toContain(arcanum);
          expect(Object.values(people[1])).toContain(arcanum);
        }
      }
    }
  });

  test("always gives a pair arcanum from 1 to 22, even for the extreme centers", () => {
    for (const [year, month, day] of [[1900, 1, 1], [2026, 12, 31], [1999, 9, 29], [1955, 5, 22]] as const) {
      const { pair } = calculateCompatibility(d(year, month, day), d(2026, 12, 31));
      expect(pair).toBeGreaterThanOrEqual(1);
      expect(pair).toBeLessThanOrEqual(22);
    }
  });
});
