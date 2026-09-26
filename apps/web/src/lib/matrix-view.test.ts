import { calculateMatrix, MATRIX_POINTS } from "@oracle/core";
import { describe, expect, test } from "vitest";
import {
  DIAGRAM_LINES,
  DIAGRAM_POINTS,
  DIAGRAM_SIZE,
  KEY_POINTS,
  keyArcana,
  POINT_LABELS,
  pointRows,
  pointTitle,
  POSITIONS,
  positionRows,
  PURPOSES,
} from "./matrix-view";

const PURPOSE_POINTS = ["sky", "earth", "personal", "male", "female", "social", "spiritual", "planetary"];

describe("diagram layout", () => {
  test("draws every point except the purposes, each once", () => {
    const drawn = DIAGRAM_POINTS.map((p) => p.point).sort();
    const expected = MATRIX_POINTS.filter((p) => !PURPOSE_POINTS.includes(p)).sort();
    expect(drawn).toEqual(expected);
  });

  test("keeps every circle inside the field", () => {
    for (const { point, x, y, r } of DIAGRAM_POINTS) {
      expect({ point, inside: x - r >= 0 && y - r >= 0 && x + r <= DIAGRAM_SIZE && y + r <= DIAGRAM_SIZE }).toEqual({ point, inside: true });
    }
  });

  test("no two circles overlap", () => {
    const overlaps: string[] = [];
    DIAGRAM_POINTS.forEach((a, i) => {
      DIAGRAM_POINTS.slice(i + 1).forEach((b) => {
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) overlaps.push(`${a.point}/${b.point}`);
      });
    });
    expect(overlaps).toEqual([]);
  });

  test("highlights exactly the three key points", () => {
    expect(DIAGRAM_POINTS.filter((p) => p.tier === "key").map((p) => p.point).sort()).toEqual(["A", "D", "E"]);
  });

  test("lines connect drawn points only", () => {
    const drawn = new Set(DIAGRAM_POINTS.map((p) => p.point));
    for (const [from, to] of DIAGRAM_LINES) {
      expect(drawn.has(from) && drawn.has(to)).toBe(true);
    }
  });
});

describe("labels", () => {
  test("every point has a label, and the key points and purposes are the agreed ones", () => {
    expect(MATRIX_POINTS.every((p) => POINT_LABELS[p].length > 0)).toBe(true);
    expect(KEY_POINTS.map((k) => [k.point, k.label])).toEqual([["A", "Личность"], ["E", "Центр"], ["D", "Задача"]]);
    expect(PURPOSES.map((p) => p.point)).toEqual(["personal", "social", "spiritual"]);
  });

  test("a point title names the position, the number and the arcanum", () => {
    expect(pointTitle("E", 11)).toBe("E — центр: 11, Сила");
  });

  test("rows list every point with its arcanum name for screen readers", () => {
    const rows = pointRows(calculateMatrix({ year: 1988, month: 11, day: 18 }));
    expect(rows).toHaveLength(MATRIX_POINTS.length);
    expect(rows[0]).toEqual({ point: "A", label: "A — личность", value: 18, name: "Луна" });
  });
});

// Ruling 1: a visible compact «Позиции» list next to the diagram (A–E plus the love/money line)
describe("positions list", () => {
  test("covers points A through E plus the love/money line, in that order", () => {
    expect(POSITIONS).toEqual(["A", "B", "C", "D", "E", "love", "money"]);
  });

  test("positionRows is exactly that subset of pointRows, same order, same values", () => {
    const matrix = calculateMatrix({ year: 1988, month: 11, day: 18 });
    const all = pointRows(matrix);
    expect(positionRows(matrix)).toEqual(POSITIONS.map((point) => all.find((row) => row.point === point)));
  });
});

describe("keyArcana", () => {
  test("lists personality, center and task with arcana names", () => {
    expect(keyArcana(calculateMatrix({ year: 1988, month: 11, day: 18 }))).toEqual([
      { point: "A", label: "Личность", number: 18, name: "Луна" },
      { point: "E", label: "Центр", number: 11, name: "Сила" },
      { point: "D", label: "Задача", number: 10, name: "Колесо Фортуны" },
    ]);
  });
});
