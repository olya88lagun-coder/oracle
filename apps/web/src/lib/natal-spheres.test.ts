import { findStopPhrases } from "@oracle/content";
import { describe, expect, test } from "vitest";
import { sampleChart } from "@/components/natal/sample-chart.test-support";
import { ASPECT_GROUPS, SPHERES, SPHERES_INTRO, SPHERES_TITLE, groupAspects, sphereCards } from "./natal-spheres";
import { HOUSE_KEYWORDS, SIGN_KEYWORDS } from "./natal-wheel-card";

// Образец — Москва, 7 марта 1990, 12:00: куспид 7-го дома 284,1° (Козерог), в нём Марс, Сатурн и Нептун; во 2-м доме Луна; 3-й и 4-й дома пусты
const withTime = sampleChart(true);
const noTime = sampleChart(false);

describe("sphereCards", () => {
  const cards = sphereCards(withTime);
  const byId = (id: string) => cards.find((card) => card.id === id);

  test("gives one card per sphere, each tied to its own house", () => {
    expect(cards.map((card) => card.id)).toEqual(SPHERES.map((sphere) => sphere.id));
    expect(new Set(cards.map((card) => card.house)).size).toBe(cards.length);
    expect(new Set(cards.map((card) => card.title)).size).toBe(cards.length);
  });

  test("names the sign on the cusp and the planets that stand in the house, in the order of the chart", () => {
    const love = byId("love");
    expect(love?.house).toBe(7);
    expect(love?.signName).toBe("Козерог");
    expect(love?.planets).toEqual(["Марс", "Сатурн", "Нептун"]);
    expect(love?.text.toLowerCase()).toContain(HOUSE_KEYWORDS[7]);
    expect(love?.text).toContain(SIGN_KEYWORDS.capricorn);
  });

  test("says so when a house is empty instead of leaving a gap", () => {
    expect(byId("money")?.planets).toEqual(["Луна"]);
    expect(byId("home")?.house).toBe(4);
    expect(byId("home")?.planets).toEqual([]);
  });

  test("has no cards without the birth time", () => {
    expect(sphereCards(noTime)).toEqual([]);
  });

  test("never promises or predicts", () => {
    const all = [SPHERES_TITLE, SPHERES_INTRO, ...SPHERES.map((sphere) => sphere.title), ...cards.map((card) => card.text)].join(" ");
    expect(findStopPhrases(all)).toEqual([]);
    expect(all).not.toMatch(/будет|ждёт|судьб|предсказ|обязательно|всегда|никогда|гарант/i);
  });
});

describe("groupAspects", () => {
  const groups = groupAspects(withTime.aspects);

  test("splits the aspects into supports, tensions and merges, in that order, without losing or duplicating any", () => {
    expect(groups.map((entry) => entry.group.id)).toEqual(["support", "tension", "merge"]);
    expect(groups.flatMap((entry) => entry.aspects)).toHaveLength(withTime.aspects.length);
    for (const entry of groups) for (const aspect of entry.aspects) expect(entry.group.aspects).toContain(aspect.aspect);
  });

  test("keeps the order of the chart inside a group, the tightest first", () => {
    for (const entry of groups) {
      const orbs = entry.aspects.map((aspect) => aspect.orb);
      expect(orbs).toEqual([...orbs].sort((a, b) => a - b));
    }
  });

  test("leaves out the groups with no aspects", () => {
    const onlyTrines = withTime.aspects.filter((aspect) => aspect.aspect === "trine");
    expect(groupAspects(onlyTrines).map((entry) => entry.group.id)).toEqual(["support"]);
    expect(groupAspects([])).toEqual([]);
  });

  test("every aspect type belongs to exactly one group", () => {
    const all = ASPECT_GROUPS.flatMap((group) => group.aspects);
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(["conjunction", "opposition", "sextile", "square", "trine"]);
  });
});
