import { describe, expect, test } from "vitest";
import { countLabel, matchesQuery, normalizeQuery, rankLabel } from "./taro-catalog";

describe("countLabel", () => {
  test("uses the right Russian endings", () => {
    expect(countLabel(1)).toBe("1 карта");
    expect(countLabel(2)).toBe("2 карты");
    expect(countLabel(14)).toBe("14 карт");
    expect(countLabel(21)).toBe("21 карта");
    expect(countLabel(22)).toBe("22 карты");
    expect(countLabel(78)).toBe("78 карт");
    expect(countLabel(0)).toBe("0 карт");
  });
});

describe("rankLabel", () => {
  test("Roman numbers for the major arcana, rank names for the minor ones", () => {
    expect(rankLabel("major", 0)).toBe("0");
    expect(rankLabel("major", 8)).toBe("VIII");
    expect(rankLabel("wands", 1)).toBe("Туз");
    expect(rankLabel("cups", 7)).toBe("7");
    expect(rankLabel("swords", 11)).toBe("Паж");
    expect(rankLabel("pentacles", 14)).toBe("Король");
  });
});

describe("search", () => {
  const card = { name: "Влюблённые", keywords: ["выбор", "близость", "ценности"] };
  test("ignores case and ё/е and looks in the keywords", () => {
    expect(normalizeQuery("  ВЛЮБЛЕННЫЕ ")).toBe("влюбленные");
    expect(matchesQuery(card, "влюбленные")).toBe(true);
    expect(matchesQuery(card, "ВЫБОР")).toBe(true);
    expect(matchesQuery(card, "ценности выбор")).toBe(true);
    expect(matchesQuery(card, "башня")).toBe(false);
  });
  test("an empty query matches everything", () => {
    expect(matchesQuery(card, "   ")).toBe(true);
  });
});
