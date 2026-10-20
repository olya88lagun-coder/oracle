import { SCENARIO_FIELDS } from "@oracle/core";
import { ASPECT_TEXTS, HOUSE_TEXTS, houseBlock, NATAL_CHAPTER_INTROS } from "@oracle/content/natal";
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
    // Блок «Солнце в 10 доме» из принятой партии заменяет общее описание дома
    expect(core[2]).toBe(houseBlock("sun", 10) ?? HOUSE_TEXTS[10]);
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

describe("fallbackNatalReport with the planet-in-house blocks", () => {
  const blocks = { house: (body: string, house: number) => `БЛОК ${body} в доме ${house}`, planet: (body: string) => `ФУНКЦИЯ ${body}` };
  const withBlocks = fallbackNatalReport(moscow(true), blocks as never);
  const textOf = (id: string) => (withBlocks.find((chapter) => chapter.id === id)?.paragraphs ?? []).join("\n");

  test("a planet-in-house block replaces the general description of the house", () => {
    expect(textOf("core")).toContain("БЛОК sun в доме 10");
    expect(textOf("core")).not.toContain(HOUSE_TEXTS[10]);
    // Асцендент без дома: блока нет, текст не ломается
    expect(textOf("core")).toContain("Асцендент в Раке.");
    // Дома, о которых глава рассказывает сама (7, 2, 6, 10), описываются общими текстами
    expect(textOf("love")).toContain(HOUSE_TEXTS[7]);
    expect(textOf("work")).toContain(HOUSE_TEXTS[6]);
  });

  test("the aspects chapter starts with the function of each planet that takes part, once", () => {
    const paragraphs = withBlocks.find((chapter) => chapter.id === "aspects")?.paragraphs ?? [];
    const functions = paragraphs.filter((paragraph) => paragraph.startsWith("ФУНКЦИЯ "));
    expect(functions.length).toBeGreaterThan(0);
    expect(new Set(functions).size).toBe(functions.length);
    expect(paragraphs.indexOf(functions[0] as string)).toBe(1);
    expect(paragraphs.findIndex((paragraph) => paragraph.includes("(орбис"))).toBeGreaterThan(paragraphs.lastIndexOf(functions.at(-1) as string));
  });

  test("without blocks the general descriptions of the houses are used, and the shipped blocks are the default", () => {
    const none = { house: () => undefined, planet: () => undefined };
    const plain = fallbackNatalReport(moscow(true), none);
    expect(JSON.stringify(plain)).toContain(HOUSE_TEXTS[10]);
    expect(JSON.stringify(fallbackNatalReport(moscow(true)))).toContain(houseBlock("sun", 10) ?? HOUSE_TEXTS[10]);
  });
});
