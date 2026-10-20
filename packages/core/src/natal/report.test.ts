import { describe, expect, test } from "vitest";
import { computeNatalChart } from "./chart";
import { mainAspects, NATAL_CHAPTER_IDS, NATAL_CHAPTER_TITLES, natalChapterOutline } from "./report";

// Москва, 7 марта 1990, 12:00 (08:00 UTC): образец из макета калькулятора
const moscow = (timeKnown: boolean) => computeNatalChart({ instant: new Date("1990-03-07T08:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown });

describe("natalChapterOutline", () => {
  test("lists nine chapters in the fixed order with their titles", () => {
    const outline = natalChapterOutline(moscow(true));
    expect(outline.map((chapter) => chapter.id)).toEqual([...NATAL_CHAPTER_IDS]);
    expect(outline.map((chapter) => chapter.title)).toEqual(NATAL_CHAPTER_IDS.map((id) => NATAL_CHAPTER_TITLES[id]));
    expect(NATAL_CHAPTER_TITLES.scenario).toBe("Ваш сценарий");
  });

  test("the core chapter holds the Sun, the Moon and the ascendant, the ascendant without a house", () => {
    const core = natalChapterOutline(moscow(true)).find((chapter) => chapter.id === "core");
    expect(core?.points.map((point) => point.body)).toEqual(["sun", "moon", "ascendant"]);
    expect(core?.points[0]).toMatchObject({ sign: "pisces", house: 10 });
    expect(core?.points[2]?.house).toBeNull();
  });

  test("the other chapters pick their bodies and the houses they describe", () => {
    const byId = Object.fromEntries(natalChapterOutline(moscow(true)).map((chapter) => [chapter.id, chapter]));
    expect(byId.mind?.points.map((point) => point.body)).toEqual(["mercury"]);
    expect(byId.love).toMatchObject({ houses: [7] });
    expect(byId.love?.points.map((point) => point.body)).toEqual(["venus"]);
    expect(byId.action?.points.map((point) => point.body)).toEqual(["mars"]);
    expect(byId.work).toMatchObject({ points: [], houses: [2, 6, 10] });
    expect(byId.growth?.points.map((point) => point.body)).toEqual(["jupiter", "saturn"]);
    expect(byId.depth?.points.map((point) => point.body)).toEqual(["uranus", "neptune", "pluto"]);
    expect(byId.aspects).toMatchObject({ points: [], houses: [] });
    expect(byId.scenario).toMatchObject({ points: [], houses: [] });
  });

  test("needs the birth time: houses and the ascendant do not exist without it", () => {
    expect(() => natalChapterOutline(moscow(false))).toThrow(RangeError);
  });
});

describe("mainAspects", () => {
  test("keeps the most exact aspects first and at most seven by default", () => {
    const chart = moscow(true);
    const main = mainAspects(chart);
    expect(main.length).toBeLessThanOrEqual(7);
    expect(main).toEqual(chart.aspects.slice(0, 7));
    expect(mainAspects(chart, 3)).toEqual(chart.aspects.slice(0, 3));
  });
});
