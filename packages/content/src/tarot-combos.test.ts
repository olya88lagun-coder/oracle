import { describe, expect, test } from "vitest";
import { checkTarotCombos, parseTarotCombos, TAROT_COMBOS, tarotCombos, TarotComboFormatError } from "./tarot-combos";

const LONG = "Сочетание может говорить о переменах, которые стоит прожить бережно и без спешки, замечая, что из прежнего хочется сохранить.";

describe("parseTarotCombos", () => {
  test("reads partner cards by name and keeps the order", () => {
    const combos = parseTarotCombos(`## smert\nБашня: ${LONG}\nЗвезда: ${LONG}\n`);
    expect(combos.get("smert")!.map((combo) => combo.partner.slug)).toEqual(["bashnya", "zvezda"]);
  });

  test("rejects an unknown card, an unknown partner and a repeated card", () => {
    expect(() => parseTarotCombos(`## nevedomaya\nБашня: ${LONG}\n`)).toThrow(TarotComboFormatError);
    expect(() => parseTarotCombos(`## smert\nНеведомая: ${LONG}\n`)).toThrow(/названия карты/);
    expect(() => parseTarotCombos(`## smert\nБашня: ${LONG}\n## smert\nБашня: ${LONG}\n`)).toThrow(/повторяется/);
  });
});

describe("tarot combos", () => {
  test("cover all 78 cards and pass the checks", () => {
    expect(checkTarotCombos(TAROT_COMBOS)).toEqual([]);
    expect(tarotCombos("smert").length).toBeGreaterThanOrEqual(4);
    expect(tarotCombos("zhezly-dvoyka").length).toBeGreaterThanOrEqual(4);
    expect(tarotCombos("nevedomaya")).toEqual([]);
  });

  test("the check catches a self pair, a repeat, a short text and stop phrases", () => {
    const combos = parseTarotCombos(`## smert\nСмерть: Коротко.\nБашня: ${LONG} Вас ждёт успех.\nБашня: ${LONG}\n`);
    const errors = checkTarotCombos(combos).join("\n");
    expect(errors).toMatch(/сама с собой/);
    expect(errors).toMatch(/повторяется/);
    expect(errors).toMatch(/smert — от 80/);
    expect(errors).toMatch(/запрещённые обороты/);
  });
});
