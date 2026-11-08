import { expect, test } from "vitest";
import { GOALS } from "./analytics";
import { DATE_ERROR } from "./matrix-save";
import { acceptedSquarePaths, PYTHAGORAS_PATH, SQUARE_CELL_NAMES, SQUARE_FAQ, SQUARE_LINE_NAMES, SQUARE_LINES_PATH, squareCellPath, squareOutcome, squareVariant } from "./pythagoras";

const TODAY = new Date("2026-11-08");

test("addresses", () => {
  expect(PYTHAGORAS_PATH).toBe("/numerologiya/kvadrat-pifagora");
  expect(squareCellPath(4)).toBe("/numerologiya/kvadrat-pifagora/4");
  expect(SQUARE_LINES_PATH).toBe("/numerologiya/kvadrat-pifagora/linii");
  for (const path of acceptedSquarePaths()) expect(path.startsWith(`${PYTHAGORAS_PATH}/`)).toBe(true);
});

test("variant by count: empty, 1–4 digits, five and more share the last variant", () => {
  expect(squareVariant(4, 0)).toEqual({ title: "Пустая ячейка", anchor: "pusto" });
  expect(squareVariant(4, 1)).toEqual({ title: "4", anchor: "4" });
  expect(squareVariant(4, 3)).toEqual({ title: "444", anchor: "444" });
  expect(squareVariant(4, 5)).toEqual({ title: "44444 и больше", anchor: "44444" });
  expect(squareVariant(1, 9)).toEqual({ title: "11111 и больше", anchor: "11111" });
});

test("outcome for a valid and an empty date", () => {
  const outcome = squareOutcome("1987-05-14", TODAY);
  expect(outcome.ok && outcome.square.working).toEqual([35, 8, 33, 6]);
  expect(squareOutcome("", TODAY)).toEqual({ ok: false, error: DATE_ERROR });
});

test("names: cell 4 and 8 without health and duty, all lines named", () => {
  expect(SQUARE_CELL_NAMES[4]).toBe("Выносливость");
  expect(SQUARE_CELL_NAMES[8]).toBe("Ответственность");
  expect(Object.keys(SQUARE_CELL_NAMES)).toHaveLength(9);
  expect(Object.keys(SQUARE_LINE_NAMES)).toHaveLength(8);
});

test("FAQ: formula with the 14.05.1987 example, other calculators, no karma or illness", () => {
  const how = SQUARE_FAQ.find((q) => q.question === "Как рассчитать квадрат Пифагора по дате рождения?");
  for (const n of ["14.05.1987", "35", "8", "33", "6"]) expect(how?.answer).toContain(n);
  expect(SQUARE_FAQ.some((q) => q.question === "Почему у других калькуляторов другой квадрат?")).toBe(true);
  expect(new Set(SQUARE_FAQ.map((q) => q.question)).size).toBe(SQUARE_FAQ.length);
  for (const q of SQUARE_FAQ) expect(q.answer.toLowerCase()).not.toMatch(/карм|болезн/);
});

test("Metrika goals", () => {
  expect(GOALS).toContain("pythagoras_calculated");
  expect(GOALS).toContain("pythagoras_to_matrix");
});
