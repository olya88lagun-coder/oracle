import { describe, expect, test } from "vitest";
import { checkMoonEventsTexts, DAYS_HUB_FAQ, eclipseFaq, MOON_EVENTS_TEXTS_ACCEPTED, retrogradeFaq } from "./moon-events";

const eclipse = (all: string[], visible: string[] = [], partial: string[] = [], hasPenumbralVisible = false) => eclipseFaq({ year: 2026, all, visible, partial, hasPenumbralVisible });

describe("eclipse questions", () => {
  test("the count answer names the year, the right plural and every eclipse", () => {
    const four = eclipse(["a", "b", "c", "d"])[0]!;
    expect(four.question).toBe("Сколько затмений в 2026 году?");
    expect(four.answer).toContain("4 затмения: a; b; c; d");
    expect(eclipse(["a", "b", "c", "d", "e"])[0]!.answer).toContain("5 затмений:");
  });

  test("the visibility answer separates what is seen, what is seen partly and what is not, and warns about the penumbral eclipse", () => {
    const answer = eclipse(["x", "y", "z"], ["x"], ["y"], true)[3]!.answer;
    expect(answer).toContain("Видно из Москвы в максимум: x.");
    expect(answer).toContain("Видно частично");
    expect(answer).toContain("Остальные из Москвы не видны");
    expect(answer).toContain("заметно глазу слабо");
    expect(eclipse(["x"], ["x"])[3]!.answer).not.toContain("Остальные");
  });
});

describe("retrograde questions", () => {
  const mercury = { nominative: "Меркурий", genitive: "Меркурия" };
  const venus = { nominative: "Венера", genitive: "Венеры" };

  test("the grammar follows the planet", () => {
    expect(retrogradeFaq({ planet: "mercury", year: 2026, names: mercury, periods: ["p"] }).map((item) => item.question)).toEqual(["Когда Меркурий ретроградный в 2026 году?", "Что значит ретроградный Меркурий?", "Как часто Меркурий бывает ретроградным?"]);
    expect(retrogradeFaq({ planet: "venus", year: 2026, names: venus, periods: ["p"] }).map((item) => item.question)).toEqual(["Когда Венера ретроградная в 2026 году?", "Что значит ретроградная Венера?", "Как часто Венера бывает ретроградной?"]);
  });

  test("the periods are listed, and a year without them says so honestly", () => {
    expect(retrogradeFaq({ planet: "venus", year: 2026, names: venus, periods: ["с 1 по 2", "с 3 по 4"] })[0]!.answer).toContain("с 1 по 2; с 3 по 4");
    expect(retrogradeFaq({ planet: "venus", year: 2027, names: venus, periods: [] })[0]!.answer).toContain("периодов обратного движения нет");
  });

  test("the answer about the meaning promises nothing", () => {
    const answer = retrogradeFaq({ planet: "mercury", year: 2026, names: mercury, periods: [] })[1]!.answer;
    expect(answer).toContain("не обещает ни событий, ни их исхода");
  });
});

describe("checks", () => {
  test("no text contains a forbidden word", () => {
    expect(checkMoonEventsTexts()).toEqual([]);
  });

  test("the days hub answers two questions", () => {
    expect(DAYS_HUB_FAQ).toHaveLength(2);
  });

  test("the texts wait for the owner: the flag is false until she accepts them", () => {
    expect(MOON_EVENTS_TEXTS_ACCEPTED).toBe(false);
  });
});
