import { describe, expect, test } from "vitest";
import { checkLilaCells } from "./lila-check";
import { LILA_CELLS, lilaCellByNumber, lilaCellBySlug } from "./lila-cells";

describe("the shipped Lila texts", () => {
  test("pass every content check", () => {
    expect(checkLilaCells(LILA_CELLS)).toEqual([]);
  });

  test("are found by number and by slug", () => {
    expect(lilaCellByNumber(12).name).toBe("Зависть");
    expect(lilaCellBySlug(lilaCellByNumber(12).slug)?.number).toBe(12);
    expect(lilaCellBySlug("net-takoy")).toBeUndefined();
    expect(() => lilaCellByNumber(99)).toThrow();
  });
});
