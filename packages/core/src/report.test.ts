import { describe, expect, test } from "vitest";
import { parseBirthDate } from "./birth-date";
import { calculateMatrix } from "./matrix";
import { CHAPTER_IDS, CHAPTER_TITLES, generateReportJobKey, MATRIX_REPORT_PRICE_KOPECKS, reportChapters, SCENARIO_FIELDS, SCENARIO_TITLES } from "./report";

const matrixOf = (iso: string) => {
  const date = parseBirthDate(iso, new Date("2026-09-28T00:00:00Z"));
  if (!date) throw new Error(`bad test date ${iso}`);
  return calculateMatrix(date);
};

describe("reportChapters", () => {
  test("lists the seven chapters with the arcana of the example date 18.11.1988", () => {
    const chapters = reportChapters(matrixOf("1988-11-18"));

    expect(chapters.map((chapter) => chapter.id)).toEqual([...CHAPTER_IDS]);
    expect(Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter.arcana]))).toEqual({
      core: [18, 11],
      task: [10],
      love: [7, 4],
      money: [5, 4],
      family: [11, 19, 18, 10],
      purpose: [11, 22, 6],
      scenario: [11],
    });
  });

  test("every chapter and scenario field has a title", () => {
    for (const chapter of reportChapters(matrixOf("1990-05-14"))) expect(chapter.title).toBe(CHAPTER_TITLES[chapter.id]);
    expect(Object.keys(SCENARIO_TITLES)).toEqual([...SCENARIO_FIELDS]);
  });
});

describe("product", () => {
  test("costs 390 rubles and has one generation job per purchase", () => {
    expect(MATRIX_REPORT_PRICE_KOPECKS).toBe(39_000);
    expect(generateReportJobKey({ purchaseId: "p1" })).toBe("generate-report:p1");
  });
});
