import { describe, expect, test } from "vitest";
import { PICKER_EXAMPLES, pickSpreads } from "./taro-spread-picker";
import { TARO_SPREADS } from "./taro-spreads";

const slugs = (question: string) => pickSpreads(question).spreads.map((spread) => spread.slug);

describe("spread picker", () => {
  test("every example question leads to the spread it is meant for", () => {
    expect(slugs(PICKER_EXAMPLES[0]!)[0]).toBe("smena-raboty");
    expect(slugs(PICKER_EXAMPLES[1]!)[0]).toBe("otnosheniya");
    expect(slugs(PICKER_EXAMPLES[2]!)[0]).toBe("roditeli");
    expect(slugs(PICKER_EXAMPLES[3]!)[0]).toBe("vybor");
    expect(slugs(PICKER_EXAMPLES[4]!)[0]).toBe("na-segodnya");
  });

  test("picks by the topic of the question and keeps at most three spreads", () => {
    expect(slugs("Мы поссорились с подругой")[0]).toBe("konflikt");
    expect(slugs("Хочу начать что-то новое в новолуние")[0]).toBe("novolunie");
    expect(slugs("Как отпустить прошлое в полнолуние")[0]).toBe("polnolunie");
    expect(slugs("не понимаю себя")[0]).toBe("samopoznanie");
    expect(pickSpreads("работа деньги выбор отношения").spreads.length).toBeLessThanOrEqual(3);
  });

  test("ignores case, ё and punctuation", () => {
    expect(slugs("РАБОТА!!!")).toContain("delo-i-dengi");
    expect(slugs("Вернётся ли он?")).toContain("otnosheniya");
  });

  test("an unknown question gets the universal three-card spread", () => {
    const pick = pickSpreads("абракадабра");
    expect(pick.matched).toBe(false);
    expect(pick.spreads.map((spread) => spread.slug)).toEqual(["tri-karty"]);
    expect(pickSpreads("").spreads.map((spread) => spread.slug)).toEqual(["tri-karty"]);
  });

  test("a question about the future is flagged, and still gets spreads about the person's own side", () => {
    expect(pickSpreads("Вернётся ли он ко мне?").predictive).toBe(true);
    expect(pickSpreads("Да или нет?").predictive).toBe(true);
    expect(pickSpreads("Да или нет?").spreads.map((spread) => spread.slug)).toEqual(["tri-karty", "vybor"]);
    expect(pickSpreads("Что мне важно увидеть?").predictive).toBe(false);
  });

  test("returns only spreads that exist", () => {
    const all = new Set(TARO_SPREADS.map((spread) => spread.slug));
    for (const question of [...PICKER_EXAMPLES, "любовь", "новый год итоги", "что-то ещё"]) for (const slug of slugs(question)) expect(all.has(slug)).toBe(true);
  });
});
