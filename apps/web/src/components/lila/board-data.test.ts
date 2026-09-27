import { describe, expect, test } from "vitest";
import { ARROWS, CELLS, SNAKES, cellPosition, getCell, lineForCell } from "./board-data";

describe("lila board data", () => {
  test("places cells in the required serpentine order", () => {
    expect(cellPosition(1)).toEqual({ col: 0, row: 7 });
    expect(cellPosition(9)).toEqual({ col: 8, row: 7 });
    expect(cellPosition(10)).toEqual({ col: 8, row: 6 });
    expect(cellPosition(18)).toEqual({ col: 0, row: 6 });
    expect(cellPosition(64)).toEqual({ col: 8, row: 0 });
    expect(cellPosition(72)).toEqual({ col: 0, row: 0 });
  });

  test("loads all 72 cell names without Sanskrit in parentheses", () => {
    expect(CELLS).toHaveLength(72);
    expect(getCell(1).name).toBe("Рождение");
    expect(getCell(23).name).toBe("Небесный план");
    expect(getCell(68).name).toBe("Космическое Сознание");
    expect(CELLS.some((cell) => /\(.+\)/.test(cell!.name))).toBe(false);
  });

  test("keeps the approved snakes and arrows from the specification", () => {
    expect(SNAKES).toEqual([
      { from: 12, to: 8 },
      { from: 16, to: 4 },
      { from: 24, to: 7 },
      { from: 29, to: 6 },
      { from: 44, to: 9 },
      { from: 52, to: 35 },
      { from: 55, to: 3 },
      { from: 61, to: 13 },
      { from: 63, to: 2 },
      { from: 72, to: 51 },
    ]);
    expect(ARROWS).toEqual([
      { from: 10, to: 23 },
      { from: 17, to: 69 },
      { from: 20, to: 32 },
      { from: 22, to: 60 },
      { from: 27, to: 41 },
      { from: 28, to: 50 },
      { from: 37, to: 66 },
      { from: 45, to: 67 },
      { from: 46, to: 62 },
      { from: 54, to: 68 },
    ]);
  });

  test("describes the link that starts on a cell for screen readers and legends", () => {
    expect(lineForCell(10)).toEqual({ kind: "arrow", from: 10, to: 23 });
    expect(lineForCell(12)).toEqual({ kind: "snake", from: 12, to: 8 });
    expect(lineForCell(23)).toBeNull();
  });
});

