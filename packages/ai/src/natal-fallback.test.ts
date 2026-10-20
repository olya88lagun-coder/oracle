import { SCENARIO_FIELDS } from "@oracle/core";
import { ASPECT_TEXTS, HOUSE_TEXTS, NATAL_CHAPTER_INTROS } from "@oracle/content/natal";
import { computeNatalChart, NATAL_CHAPTER_IDS } from "@oracle/core/natal";
import { describe, expect, test } from "vitest";
import { fallbackNatalReport } from "./natal-fallback";

// Москва, 7 марта 1990, 12:00 (08:00 UTC)
const moscow = (timeKnown: boolean) => computeNatalChart({ instant: new Date("1990-03-07T08:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown });
const text = (id: string) => (fallbackNatalReport(moscow(true)).find((chapter) => chapter.id === id)?.paragraphs ?? []).join("\n");

describe("fallbackNatalReport", () => {
  const chapters = fallbackNatalReport(moscow(true));

  test("gives nine chapters in order, all assembled without a model", () => {
    expect(chapters.map((chapter) => chapter.id)).toEqual([...NATAL_CHAPTER_IDS]);
    expect(chapters.every((chapter) => chapter.source === "fallback")).toBe(true);
  });

  test("the core chapter opens with its intro, then the Sun in its sign and house", () => {
    const core = chapters.find((chapter) => chapter.id === "core")?.paragraphs ?? [];
    expect(core[0]).toBe(NATAL_CHAPTER_INTROS.core);
    expect(core[1]?.startsWith("Солнце в Рыбах, 10 дом.")).toBe(true);
    expect(core[2]).toBe(HOUSE_TEXTS[10]);
    expect(text("core")).toContain("Асцендент в Раке.");
  });

  test("love adds the seventh house and work the second, sixth and tenth", () => {
    expect(text("love")).toContain(HOUSE_TEXTS[7]);
    for (const house of [2, 6, 10]) expect(text("work")).toContain(HOUSE_TEXTS[house]);
  });

  test("the aspects chapter lists exact aspects with the orb and the kind of aspect", () => {
    const aspects = text("aspects");
    expect(aspects).toMatch(/ — .* — .* \(орбис \d+,\d°\)\./);
    expect(Object.values(ASPECT_TEXTS).some((description) => aspects.includes(description))).toBe(true);
  });

  test("the scenario has all seven fields and no empty value", () => {
    const scenario = chapters.find((chapter) => chapter.id === "scenario")?.scenario;
    for (const field of SCENARIO_FIELDS) expect(scenario?.[field]?.length, field).toBeGreaterThan(10);
  });

  test("never prints undefined, and needs the birth time", () => {
    expect(JSON.stringify(chapters)).not.toContain("undefined");
    expect(() => fallbackNatalReport(moscow(false))).toThrow(RangeError);
  });
});
