import { describe, expect, test } from "vitest";
import { wrapLines } from "./poster";

// Ширина строки — число символов: хватает, чтобы проверить сам перенос
const measure = (text: string) => text.length;

describe("wrapLines", () => {
  test("wraps by words within the width", () => {
    expect(wrapLines(measure, "один два три четыре", 9)).toEqual(["один два", "три", "четыре"]);
  });

  test("keeps a word longer than the line whole and ignores extra spaces", () => {
    expect(wrapLines(measure, "  короткое   неразрывнодлинное  ", 8)).toEqual(["короткое", "неразрывнодлинное"]);
  });

  test("returns nothing for empty text", () => {
    expect(wrapLines(measure, "   ", 10)).toEqual([]);
  });
});
