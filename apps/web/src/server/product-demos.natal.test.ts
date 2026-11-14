import { NATAL_CHAPTER_IDS } from "@oracle/core/natal-report";
import { describe, expect, test } from "vitest";
import { DEMO_NATAL_CHART_DATA, DEMO_NATAL_DATE, DEMO_NATAL_PLACE, DEMO_NATAL_REPORT } from "./product-demos";

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

  test("is a real AI report snapshot: every chapter written by the model, no filler phrases, scenario fields on one line", () => {
    expect(DEMO_NATAL_REPORT.every((chapter) => chapter.source === "ai")).toBe(true);
    const text = DEMO_NATAL_REPORT.flatMap((chapter) => [...(chapter.paragraphs ?? []), ...Object.values(chapter.scenario ?? {})]).join("\n");
    for (const filler of ["Стоит заметить", "Следует отметить", "Важно отметить", "Таким образом"]) expect(text, filler).not.toContain(filler);
    for (const value of Object.values(DEMO_NATAL_REPORT.find((chapter) => chapter.id === "scenario")?.scenario ?? {})) expect(value).not.toContain("\n");
    expect(DEMO_NATAL_REPORT.find((chapter) => chapter.id === "aspects")?.paragraphs?.join("").length).toBeGreaterThan(2000);
  });

  test("the snapshot and the wheel describe the same demo moment (Moscow, 12:25)", () => {
    expect(DEMO_NATAL_CHART_DATA.birth).toMatchObject({ city: "Москва", date: "1990-03-07", time: "12:25" });
    expect(DEMO_NATAL_REPORT.find((chapter) => chapter.id === "core")?.paragraphs?.join(" ")).toContain("Асцендент в Раке");
  });
});
