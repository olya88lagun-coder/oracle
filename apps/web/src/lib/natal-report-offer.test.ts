import { computeNatalChart } from "@oracle/core/natal";
import { natalChapterOutline } from "@oracle/core/natal-report";
import { describe, expect, test } from "vitest";
import { chapterLabel, housesLabel, natalOfferState, pointLabel } from "./natal-report-offer";

const chart = computeNatalChart({ instant: new Date("1990-03-07T09:00:00Z"), latitude: 55.7558, longitude: 37.6173, timeKnown: true });
const outline = natalChapterOutline(chart);
const label = (id: string) => chapterLabel(outline.find((chapter) => chapter.id === id)!);

describe("natalOfferState", () => {
  test("is hidden while sales are off, needs the birth time, then splits guest and signed-in", () => {
    expect(natalOfferState({ enabled: false, signedIn: true, timeKnown: true })).toEqual({ kind: "hidden" });
    expect(natalOfferState({ enabled: true, signedIn: true, timeKnown: false })).toEqual({ kind: "no_time" });
    expect(natalOfferState({ enabled: true, signedIn: false, timeKnown: true })).toEqual({ kind: "guest" });
    expect(natalOfferState({ enabled: true, signedIn: true, timeKnown: true })).toEqual({ kind: "buy" });
  });
});

describe("chapterLabel", () => {
  test("names the person's own positions with the house", () => {
    expect(label("love")).toMatch(/^Венера (в|во) [А-Яа-я]+, \d+ дом$/);
    expect(label("core")).toMatch(/^Солнце (в|во) [А-Яа-я]+, \d+ дом · Луна (в|во) [А-Яа-я]+, \d+ дом · Асцендент (в|во) [А-Яа-я]+$/);
  });

  test("describes the chapters that have no point of their own", () => {
    expect(label("work")).toBe("Дома 2, 6 и 10");
    expect(label("aspects")).toBe("Самые точные связи планет вашей карты");
    expect(label("scenario")).toContain("эксперимент на 7 дней");
  });
});

describe("pointLabel and housesLabel", () => {
  test("a planet gets its sign and house, the ascendant only its sign", () => {
    const core = outline.find((chapter) => chapter.id === "core")!;
    expect(pointLabel(core.points[0]!)).toMatch(/^Солнце (в|во) [А-Яа-я]+, \d+ дом$/);
    expect(pointLabel(core.points.at(-1)!)).toMatch(/^Асцендент (в|во) [А-Яа-я]+$/);
  });

  test("houses read as one house or as a list with «и» before the last", () => {
    expect(housesLabel([7])).toBe("7 дом");
    expect(housesLabel([2, 6, 10])).toBe("Дома 2, 6 и 10");
    expect(housesLabel([4, 8])).toBe("Дома 4 и 8");
  });
});
