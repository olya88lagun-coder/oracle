import { findStopPhrases } from "@oracle/content";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { LilaTryDice, TRY_DICE_HINT, tryDiceCaption } from "./LilaTryDice";

describe("LilaTryDice", () => {
  test("starts with the hint and a roll button, and no link to the game before a six", () => {
    const html = renderToStaticMarkup(createElement(LilaTryDice));
    expect(html).toContain("Бросить кубик");
    expect(html).toContain(TRY_DICE_HINT);
    expect(html).not.toContain("Начать партию с намерением");
  });

  test("a six lets the piece in and anything else asks for another throw", () => {
    expect(tryDiceCaption(6)).toContain("шестёрка");
    for (const value of [1, 2, 3, 4, 5]) expect(tryDiceCaption(value)).toContain(`Выпало ${value}`);
  });

  test("captions have no prediction stop phrases", () => {
    for (const value of [null, 1, 6]) expect(findStopPhrases(tryDiceCaption(value))).toEqual([]);
  });
});
