import { describe, expect, test } from "vitest";
import { isMoonPath, moonTabFor, moonTabs, MOON_TAB_LABELS } from "./moon-nav";

describe("moonTabFor", () => {
  test("maps every moon route family to its tab", () => {
    const cases: [string, string][] = [
      ["/luna-segodnya", "today"],
      ["/lunnyy-kalendar", "calendar"],
      ["/lunnyy-kalendar/noyabr-2026", "calendar"],
      ["/luna/fazy-luny", "phases"],
      ["/luna/novoluniya-2026", "phases"],
      ["/luna/polnoluniya-2027", "phases"],
      ["/luna/zatmeniya-2026", "phases"],
      ["/luna/retrograd-merkuriya-2026", "phases"],
      ["/luna/sutki", "days"],
      ["/luna/sutki/13", "days"],
      ["/dni-nedeli", "weekday"],
    ];
    for (const [path, tab] of cases) expect(moonTabFor(path), path).toBe(tab);
  });

  test("gives null for non-moon paths and look-alike prefixes", () => {
    for (const path of ["/", "/lila", "/taro", "/lunatik", "/luna-something-else", "/lunnyy-kalendar-x", "/dni-nedeli-x", "/natalnaya-karta/lunnyy-znak"]) expect(moonTabFor(path), path).toBeNull();
  });
});

describe("isMoonPath", () => {
  test("is true for all moon routes and false for the rest", () => {
    expect(isMoonPath("/luna-segodnya")).toBe(true);
    expect(isMoonPath("/luna/sutki/5")).toBe(true);
    expect(isMoonPath("/dni-nedeli")).toBe(true);
    expect(isMoonPath("/lila")).toBe(false);
    expect(isMoonPath("/luna-something-else")).toBe(false);
  });
});

describe("moonTabs", () => {
  test("gives five tabs in order, with the current month for the calendar", () => {
    const tabs = moonTabs(new Date("2026-11-22T09:00:00Z"));
    expect(tabs.map((tab) => tab.key)).toEqual(["today", "calendar", "phases", "days", "weekday"]);
    expect(tabs.map((tab) => tab.label)).toEqual(["Сегодня", "Календарь", "Фазы", "Сутки", "Дни недели"]);
    expect(tabs.find((tab) => tab.key === "calendar")?.href).toBe("/lunnyy-kalendar/noyabr-2026");
    expect(tabs.find((tab) => tab.key === "today")?.href).toBe("/luna-segodnya");
    expect(Object.keys(MOON_TAB_LABELS)).toHaveLength(5);
  });
});
