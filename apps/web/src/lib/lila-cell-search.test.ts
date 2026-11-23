import { LILA_CELLS } from "@oracle/content/lila";
import { describe, expect, test } from "vitest";
import { filterCells, type CellSearchItem } from "./lila-cell-search";

const items: CellSearchItem[] = LILA_CELLS.map((cell) => ({ number: cell.number, name: cell.name, text: cell.about }));
const numbers = (query: string) => filterCells(items, query).map((item) => item.number);

describe("lila cell search", () => {
  test("empty or blank query keeps all 72 cells", () => {
    expect(filterCells(items, "")).toHaveLength(72);
    expect(filterCells(items, "   ")).toHaveLength(72);
  });

  test("a number finds exactly that cell, not 10–19 for 1", () => {
    expect(numbers("1")).toEqual([1]);
    expect(numbers("68")).toEqual([68]);
  });

  test("name search ignores case and ё/е", () => {
    const zavist = numbers("зависть");
    expect(zavist).toContain(12);
    expect(numbers("ЗАВИСТЬ")).toEqual(zavist);
  });

  test("all words must match; nonsense finds nothing", () => {
    expect(numbers("зависть 12")).toEqual([12]);
    expect(numbers("зависть 13")).toEqual([]);
    expect(numbers("qqqqq")).toEqual([]);
    expect(numbers("0")).toEqual([]);
  });

  test("every cell is found by its own name", () => {
    for (const item of items) expect(numbers(item.name)).toContain(item.number);
  });
});
