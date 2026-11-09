import { calculateMatrix, type Matrix } from "@oracle/core";
import { ARCANA, findStopPhrases } from "@oracle/content";
import { describe, expect, test } from "vitest";
import { relationshipLink } from "./matrix-link";

const withPoints = (love: number, heart: number): Matrix => ({ ...calculateMatrix({ year: 1990, month: 1, day: 15 }), love, heart });

describe("relationshipLink", () => {
  test("shows the love and heart points of the matrix — the pair of the paid «Отношения» chapter", () => {
    const matrix = calculateMatrix({ year: 1990, month: 1, day: 15 });
    const { points } = relationshipLink(matrix);
    expect(points.map((point) => point.number)).toEqual([matrix.love, matrix.heart]);
    expect(points.map((point) => point.role)).toEqual(["Точка любви", "Сердце матрицы"]);
  });

  test("reads cleanly for every one of the 22×22 pairs", () => {
    for (const love of ARCANA) {
      for (const heart of ARCANA) {
        const { points, link } = relationshipLink(withPoints(love.number, heart.number));
        expect(link).not.toMatch(/«»|undefined/);
        expect(link).toContain(love.name);
        expect(findStopPhrases(link)).toEqual([]);
        for (const point of points) expect(point.meaning.length).toBeGreaterThan(40);
      }
    }
  });

  test("does not repeat the same phrase when both points are one arcanum", () => {
    const { link } = relationshipLink(withPoints(6, 6));
    expect(link).toContain("Обе точки — Влюблённые");
    expect(link).toContain("«искренность» и «способность к близости»");
    expect(link).toContain("«бояться выбрать» и «угождать всем»");
  });
});
