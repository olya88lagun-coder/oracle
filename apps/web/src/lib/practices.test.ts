import { describe, expect, test } from "vitest";
import { FREE_MATRIX_CTA, FREE_RESULT_PROMISE, FREE_RESULT_TERMS, PRACTICES } from "./practices";

describe("free entry texts", () => {
  test("promise exactly the three free positions and name the action once", () => {
    expect(FREE_MATRIX_CTA).toBe("Рассчитать матрицу бесплатно");
    expect(FREE_RESULT_PROMISE).toMatch(/Личность, Центр и Задача/);
    expect(FREE_RESULT_TERMS).toMatch(/без регистрации/);
  });
});

describe("PRACTICES", () => {
  test("lists the four practices of the spec in launch order", () => {
    expect(PRACTICES.map((practice) => practice.slug)).toEqual(["matrix", "lila", "tarot", "natal"]);
  });

  test("every practice has a title and a one-sentence summary", () => {
    for (const practice of PRACTICES) {
      expect(practice.title.length).toBeGreaterThan(0);
      expect(practice.summary).toMatch(/^\S.+\.$/);
    }
  });

  test("the matrix and Lila are open, and lead to their own pages", () => {
    expect(PRACTICES.map((practice) => [practice.slug, practice.href])).toEqual([
      ["matrix", "/matrica-sudby"],
      ["lila", "/lila"],
      ["tarot", null],
      ["natal", null],
    ]);
  });
});
