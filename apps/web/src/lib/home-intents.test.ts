import { describe, expect, test } from "vitest";
import { HOME_INTENTS, HOME_INTENTS_LEAD } from "./home-intents";
import { spreadFromParam } from "./taro-spreads";

describe("home intents", () => {
  test("four entries with distinct internal links", () => {
    expect(HOME_INTENTS).toHaveLength(4);
    expect(new Set(HOME_INTENTS.map((i) => i.href)).size).toBe(4);
    for (const intent of HOME_INTENTS) expect(intent.href).toMatch(/^\/[a-z-]/);
  });

  test("the choice link points at an existing spread", () => {
    expect(spreadFromParam("vybor")).toBeDefined();
    expect(HOME_INTENTS.some((i) => i.href.endsWith("/rasklady/vybor"))).toBe(true);
  });

  test("copy promises no prediction and names no price", () => {
    for (const text of [HOME_INTENTS_LEAD, ...HOME_INTENTS.flatMap((i) => [i.title, i.text])]) {
      expect(text).not.toMatch(/предскаж|прогноз|узнаете будущее|₽/i);
    }
  });
});
