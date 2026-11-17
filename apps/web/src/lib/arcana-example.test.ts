import { calculateMatrix } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { arcanumExample, sumChain } from "./arcana-example";

describe("arcana example", () => {
  test("shows the sum and folds digits while the number is above 22", () => {
    expect(sumChain([14, 9, 8])).toBe("14 + 9 + 8 = 31 → 3 + 1 = 4");
    expect(sumChain([1, 9, 8, 8])).toBe("1 + 9 + 8 + 8 = 26 → 2 + 6 = 8");
    expect(sumChain([10, 12])).toBe("10 + 12 = 22");
  });

  test("for every arcanum the date is real, the number stands in the personality and every step matches the calculator", () => {
    for (let number = 1; number <= 22; number += 1) {
      const example = arcanumExample(number);
      const matrix = calculateMatrix({ day: example.day, month: example.month, year: example.year });
      expect(example.day).toBe(number);
      expect(example.month).toBeGreaterThanOrEqual(1);
      expect(example.month).toBeLessThanOrEqual(12);
      expect(example.year).toBeGreaterThanOrEqual(1960);
      expect(matrix.A).toBe(number);
      expect(example.steps.map((step) => step.point)).toEqual(["A", "B", "C", "D", "E"]);
      for (const step of example.steps) expect(step.arcanum, `${number} ${step.point}`).toBe(matrix[step.point]);
      expect(example.dateLabel).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    }
  });

  test("examples differ between arcana", () => {
    expect(new Set(Array.from({ length: 22 }, (_, i) => arcanumExample(i + 1).dateLabel)).size).toBe(22);
  });
});
