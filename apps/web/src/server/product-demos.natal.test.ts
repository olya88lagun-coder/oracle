import { NATAL_CHAPTER_IDS } from "@oracle/core/natal-report";
import { describe, expect, test } from "vitest";
import { DEMO_NATAL_DATE, DEMO_NATAL_PLACE, DEMO_NATAL_REPORT } from "./product-demos";

describe("the demo natal report", () => {
  test("has all nine chapters in the fixed order, on made-up data", () => {
    expect(DEMO_NATAL_REPORT.map((chapter) => chapter.id)).toEqual([...NATAL_CHAPTER_IDS]);
    expect(DEMO_NATAL_DATE).toBe("1990-03-07");
    expect(DEMO_NATAL_PLACE).toBe("Москва");
  });

  test("is assembled from the chart of the demo moment, not empty", () => {
    const love = DEMO_NATAL_REPORT.find((chapter) => chapter.id === "love");
    expect(love?.paragraphs?.join(" ")).toContain("Венера");
    expect(DEMO_NATAL_REPORT.find((chapter) => chapter.id === "scenario")?.scenario?.pattern).toBeTruthy();
  });
});
