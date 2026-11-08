import { expect, test } from "vitest";
import { PAIR_FIXTURES } from "@/app/numerologiya/kvadrat-pifagora/sovmestimost/pair-fixtures";
import { DATE_ERROR } from "./matrix-save";
import { cellRelation, LINE_LEVEL_NAMES, lineLevel, PYTHAGORAS_COMPAT_PATH, pairOutcome, type PairComparison } from "./pythagoras-compat";

const TODAY = new Date("2026-11-09");

function pairOf([you, partner]: readonly [string, string]): PairComparison {
  const outcome = pairOutcome(you, partner, TODAY);
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.pair;
}

test("address", () => {
  expect(PYTHAGORAS_COMPAT_PATH).toBe("/numerologiya/kvadrat-pifagora/sovmestimost");
});

test("cell relation: both empty, close (both present, differ by at most one), apart", () => {
  expect(cellRelation(0, 0)).toBe("empty");
  expect(cellRelation(1, 2)).toBe("close");
  expect(cellRelation(3, 3)).toBe("close");
  expect(cellRelation(0, 1)).toBe("apart");
  expect(cellRelation(1, 0)).toBe("apart");
  expect(cellRelation(1, 3)).toBe("apart");
});

test("line level: 0–2 low, 3–5 mid, 6 and more high", () => {
  expect([0, 2, 3, 5, 6, 9].map(lineLevel)).toEqual(["low", "low", "mid", "mid", "high", "high"]);
  expect(LINE_LEVEL_NAMES).toEqual({ low: "мало", mid: "средне", high: "много" });
});

test("14.05.1987 and 07.03.1976: working numbers, empty family line, temperament first", () => {
  const pair = pairOf(PAIR_FIXTURES.allRelations);
  expect(pair.you.working).toEqual([35, 8, 33, 6]);
  expect(pair.cells.map((cell) => cell.cell)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(pair.lines[0]?.id).toBe("temperament");
  expect(pair.lines).toHaveLength(8);
  expect(pair.lines.find((line) => line.id === "semya")).toMatchObject({ partner: 0, partnerLevel: "low" });
});

test("fixtures: every relation, five digits, no differences for one date twice", () => {
  const all = pairOf(PAIR_FIXTURES.allRelations);
  expect(new Set(all.cells.map((cell) => cell.relation))).toEqual(new Set(["empty", "close", "apart"]));
  expect(new Set(all.lines.map((line) => line.relation))).toEqual(new Set(["same", "differ"]));
  expect(Math.max(...pairOf(PAIR_FIXTURES.fiveDigits).cells.map((cell) => cell.you))).toBeGreaterThanOrEqual(5);
  const same = pairOf(PAIR_FIXTURES.same);
  expect(same.cells.some((cell) => cell.relation === "apart")).toBe(false);
  expect(same.lines.every((line) => line.relation === "same")).toBe(true);
});

test("a wrong date is reported on its own field", () => {
  expect(pairOutcome("", "1990-01-01", TODAY)).toEqual({ ok: false, field: "you", error: DATE_ERROR });
  expect(pairOutcome("1990-01-01", "2999-01-01", TODAY)).toEqual({ ok: false, field: "partner", error: DATE_ERROR });
});
