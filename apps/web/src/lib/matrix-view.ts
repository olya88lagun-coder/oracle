import { MATRIX_POINTS, type Matrix, type MatrixPoint } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";

export const KEY_POINTS = [
  { point: "A", key: "personality", label: "Личность" },
  { point: "E", key: "center", label: "Центр" },
  { point: "D", key: "task", label: "Задача" },
] as const satisfies readonly { point: MatrixPoint; key: "personality" | "center" | "task"; label: string }[];

export const PURPOSES = [
  { point: "personal", label: "Личное" },
  { point: "social", label: "Социальное" },
  { point: "spiritual", label: "Духовное" },
] as const satisfies readonly { point: MatrixPoint; label: string }[];

const OUTER = { A: "личность", B: "верхняя точка", C: "правая точка", D: "задача", E: "центр" } as const;
const FAMILY = { F: "A+B", G: "B+C", H: "C+D", I: "D+A" } as const;

function innerLabels(): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const x of ["A", "B", "C", "D", "F", "G", "H", "I"]) {
    labels[`${x}1`] = `${x}1 — у точки ${x}`;
    labels[`${x}2`] = `${x}2 — между ${x} и центром`;
  }
  return labels;
}

export const POINT_LABELS = {
  ...Object.fromEntries(Object.entries(OUTER).map(([point, name]) => [point, `${point} — ${name}`])),
  ...Object.fromEntries(Object.entries(FAMILY).map(([point, sum]) => [point, `${point} — родовая точка (${sum})`])),
  ...innerLabels(),
  heart: "линия отношений и денег",
  love: "отношения",
  money: "деньги",
  sky: "небо",
  earth: "земля",
  personal: "личное предназначение",
  male: "мужская линия",
  female: "женская линия",
  social: "социальное предназначение",
  spiritual: "духовное предназначение",
  planetary: "планетарное предназначение",
} as Record<MatrixPoint, string>;

export type DiagramPoint = { point: MatrixPoint; x: number; y: number; r: number; tier: "key" | "main" | "family" | "inner" | "line" };

export const DIAGRAM_SIZE = 400;

const at = (point: MatrixPoint, x: number, y: number, r: number, tier: DiagramPoint["tier"]): DiagramPoint => ({ point, x, y, r, tier });

// Поле 400×400, центр (200, 200). Основной квадрат — ромб по осям, родовой — по углам; внутренние точки на линиях к центру
export const DIAGRAM_POINTS: readonly DiagramPoint[] = [
  at("A", 30, 200, 22, "key"),
  at("B", 200, 30, 20, "main"),
  at("C", 370, 200, 20, "main"),
  at("D", 200, 370, 22, "key"),
  at("E", 200, 200, 26, "key"),
  at("F", 80, 80, 18, "family"),
  at("G", 320, 80, 18, "family"),
  at("H", 320, 320, 18, "family"),
  at("I", 80, 320, 18, "family"),
  at("A1", 72, 200, 13, "inner"),
  at("A2", 118, 200, 13, "inner"),
  at("B1", 200, 72, 13, "inner"),
  at("B2", 200, 118, 13, "inner"),
  at("C1", 328, 200, 13, "inner"),
  at("C2", 282, 200, 13, "inner"),
  at("D1", 200, 328, 13, "inner"),
  at("D2", 200, 282, 13, "inner"),
  at("F1", 110, 110, 12, "inner"),
  at("F2", 142, 142, 12, "inner"),
  at("G1", 290, 110, 12, "inner"),
  at("G2", 258, 142, 12, "inner"),
  at("H1", 290, 290, 12, "inner"),
  at("H2", 258, 258, 12, "inner"),
  at("I1", 110, 290, 12, "inner"),
  at("I2", 142, 258, 12, "inner"),
  at("money", 304, 244, 12, "line"),
  at("heart", 266, 282, 12, "line"),
  at("love", 228, 320, 12, "line"),
];

export const DIAGRAM_LINES: readonly (readonly [MatrixPoint, MatrixPoint])[] = [
  ["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"],
  ["F", "G"], ["G", "H"], ["H", "I"], ["I", "F"],
  ["A", "C"], ["B", "D"], ["F", "H"], ["G", "I"],
  ["money", "love"],
];

export function pointTitle(point: MatrixPoint, value: number): string {
  return `${POINT_LABELS[point]}: ${value}, ${arcanumByNumber(value).name}`;
}

export type PointRow = { point: MatrixPoint; label: string; value: number; name: string };

export function pointRows(matrix: Matrix): PointRow[] {
  return MATRIX_POINTS.map((point) => ({ point, label: POINT_LABELS[point], value: matrix[point], name: arcanumByNumber(matrix[point]).name }));
}

// Ruling 1: a visible compact «Позиции» list next to the diagram — points A–E plus the love/money line,
// drawn from pointRows so it never drifts from the screen-reader table.
export const POSITIONS = ["A", "B", "C", "D", "E", "love", "money"] as const satisfies readonly MatrixPoint[];

export function positionRows(matrix: Matrix): PointRow[] {
  const byPoint = new Map(pointRows(matrix).map((row) => [row.point, row]));
  return POSITIONS.map((point) => byPoint.get(point)!);
}
