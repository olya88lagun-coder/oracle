import { describe, expect, test } from "vitest";
import { parseBirthDate } from "./birth-date";
import { calculateMatrix } from "./matrix";
import {
  CHAPTER_IDS,
  CHAPTER_TITLES,
  generateNatalReportJobKey,
  generateReportJobKey,
  MATRIX_REPORT_PRICE_KOPECKS,
  NATAL_REPORT_PRICE_KOPECKS,
  natalSnapshotKey,
  QUEUES,
  reportChapters,
  SCENARIO_FIELDS,
  SCENARIO_TITLES,
} from "./report";

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

describe("natal report product", () => {
  test("costs 490 rubles and has its own queue and job key", () => {
    expect(NATAL_REPORT_PRICE_KOPECKS).toBe(49_000);
    expect(QUEUES.generateNatalReport).toBe("generate-natal-report");
    expect(generateNatalReportJobKey({ purchaseId: "p" })).toBe("generate-natal-report:p");
  });

  test("the snapshot key rounds the coordinates to two decimals", () => {
    expect(natalSnapshotKey({ date: "1990-03-07", time: "12:00", latitude: 55.7558, longitude: 37.6173 })).toBe("1990-03-07|12:00|55.76|37.62");
    expect(natalSnapshotKey({ date: "1990-03-07", time: "12:00", latitude: 55.7541, longitude: 37.6149 })).toBe("1990-03-07|12:00|55.75|37.61");
  });
});
