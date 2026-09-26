import type { BirthDate } from "./birth-date";

export const ARCANA_COUNT = 22;

// Порядок: основной квадрат, родовой квадрат, внутренние точки, линия отношений и денег, предназначения
export const MATRIX_POINTS = [
  "A", "B", "C", "D", "E",
  "F", "G", "H", "I",
  "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2",
  "F1", "F2", "G1", "G2", "H1", "H2", "I1", "I2",
  "heart", "love", "money",
  "sky", "earth", "personal", "male", "female", "social", "spiritual", "planetary",
] as const;

export type MatrixPoint = (typeof MATRIX_POINTS)[number];
export type Matrix = Readonly<Record<MatrixPoint, number>>;

const digitSum = (n: number): number => [...String(n)].reduce((sum, digit) => sum + Number(digit), 0);

// Свёртка к номеру аркана: пока больше 22 — складываем цифры (29 → 11, 1988 → 26 → 8)
export function reduceToArcanum(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`reduceToArcanum expects a positive integer, got ${n}`);
  let value = n;
  while (value > ARCANA_COUNT) value = digitSum(value);
  return value;
}

const add = (...values: number[]): number => reduceToArcanum(values.reduce((sum, value) => sum + value, 0));

export function calculateMatrix(date: BirthDate): Matrix {
  const A = reduceToArcanum(date.day);
  const B = reduceToArcanum(date.month);
  const C = reduceToArcanum(digitSum(date.year));
  const D = add(A, B, C);
  const E = add(A, B, C, D);
  const F = add(A, B);
  const G = add(B, C);
  const H = add(C, D);
  const I = add(D, A);

  // Внутренние точки на линии «вершина → центр»: X2 ближе к центру, X1 ближе к вершине
  const inner = (x: number) => add(x, E);
  const A2 = inner(A), B2 = inner(B), C2 = inner(C), D2 = inner(D);
  const F2 = inner(F), G2 = inner(G), H2 = inner(H), I2 = inner(I);

  const heart = add(C2, D2);
  const sky = add(B, D);
  const earth = add(A, C);
  const personal = add(sky, earth);
  const male = add(F, H);
  const female = add(G, I);
  const social = add(male, female);
  const spiritual = add(personal, social);

  return {
    A, B, C, D, E, F, G, H, I,
    A1: add(A, A2), A2, B1: add(B, B2), B2, C1: add(C, C2), C2, D1: add(D, D2), D2,
    F1: add(F, F2), F2, G1: add(G, G2), G2, H1: add(H, H2), H2, I1: add(I, I2), I2,
    heart, love: add(heart, D2), money: add(heart, C2),
    sky, earth, personal, male, female, social, spiritual, planetary: add(social, spiritual),
  };
}
