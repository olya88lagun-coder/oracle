import type { BirthDate } from "./birth-date";
import { calculateMatrix, reduceToArcanum, type Matrix } from "./matrix";

export const KEY_POINTS = ["personality", "center", "task"] as const;
export type KeyPoint = (typeof KEY_POINTS)[number];
// Личность — точка A (день), центр — E, задача — D
export type CompatPerson = Readonly<Record<KeyPoint, number>>;

export type Compatibility = {
  pair: number;
  people: readonly [CompatPerson, CompatPerson];
  sameAtPoint: readonly KeyPoint[];
  sharedArcana: readonly number[];
};

const personOf = (matrix: Matrix): CompatPerson => ({ personality: matrix.A, center: matrix.E, task: matrix.D });

export function calculateCompatibility(a: BirthDate, b: BirthDate): Compatibility {
  const matrixA = calculateMatrix(a);
  const matrixB = calculateMatrix(b);
  const first = personOf(matrixA);
  const second = personOf(matrixB);
  const firstNumbers = new Set(Object.values(first));
  const shared = [...new Set(Object.values(second))].filter((number) => firstNumbers.has(number)).sort((x, y) => x - y);
  return {
    pair: reduceToArcanum(matrixA.E + matrixB.E),
    people: [first, second],
    sameAtPoint: KEY_POINTS.filter((point) => first[point] === second[point]),
    sharedArcana: shared,
  };
}
