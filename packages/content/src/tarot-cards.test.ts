import { describe, expect, it } from "vitest";
import { TAROT_DECK } from "./tarot-deck";
import { TAROT_CARDS, tarotCardText } from "./tarot-cards";
import { checkTarotCards } from "./tarot-check";

describe("тексты колоды Таро", () => {
  it("написаны все 78 карт", () => {
    expect(TAROT_CARDS).toHaveLength(78);
    for (const card of TAROT_DECK) {
      expect(tarotCardText(card.slug), card.slug).toBeDefined();
    }
  });

  it("все тексты проходят проверки длины, формы и стоп-фраз", () => {
    expect(checkTarotCards(TAROT_CARDS)).toEqual([]);
  });
});
