import { calculateMatrix } from "@oracle/core";
import { describe, expect, test } from "vitest";
import { chapterTeaser, QUESTION_TOPICS, TEASER_CHAPTERS } from "./chapter-teaser";

const matrix = calculateMatrix({ day: 18, month: 11, year: 1988 });

describe("chapterTeaser", () => {
  test("every topic leads to a chapter with points and a non-empty text", () => {
    expect(QUESTION_TOPICS.map((topic) => topic.chapter)).toEqual([...TEASER_CHAPTERS]);
    for (const chapter of TEASER_CHAPTERS) {
      const teaser = chapterTeaser(matrix, chapter);
      expect(teaser.id).toBe(chapter);
      expect(teaser.points.length).toBeGreaterThan(0);
      expect(teaser.text.length).toBeGreaterThan(40);
      expect(teaser.text).not.toMatch(/undefined|«»/);
    }
  });

  test("the relationship teaser is the one already shown for free", () => {
    expect(chapterTeaser(matrix, "love").points).toHaveLength(2);
  });
});
