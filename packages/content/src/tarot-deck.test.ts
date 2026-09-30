import { describe, expect, test } from "vitest";
import { ARCANA } from "./index";
import { matrixSlugOf, TAROT_DECK, tarotCardBySlug, tarotFileName } from "./tarot-deck";

describe("TAROT_DECK", () => {
  test("has 78 cards with unique slugs, orders 1–78 and the right suit sizes", () => {
    expect(TAROT_DECK).toHaveLength(78);
    expect(new Set(TAROT_DECK.map((card) => card.slug)).size).toBe(78);
    expect(TAROT_DECK.map((card) => card.order)).toEqual(Array.from({ length: 78 }, (_, i) => i + 1));
    const count = (suit: string) => TAROT_DECK.filter((card) => card.suit === suit).length;
    expect([count("major"), count("wands"), count("cups"), count("swords"), count("pentacles")]).toEqual([22, 14, 14, 14, 14]);
  });

  test("numbers the major arcana as in the Rider–Waite deck", () => {
    const rank = (slug: string) => tarotCardBySlug(slug)!.rank;
    expect([rank("shut"), rank("mag"), rank("sila"), rank("spravedlivost"), rank("mir")]).toEqual([0, 1, 8, 11, 21]);
  });

  test("names minor cards by rank and suit and builds file names", () => {
    expect(tarotCardBySlug("zhezly-tuz")).toMatchObject({ name: "Туз Жезлов", order: 23, suit: "wands", rank: 1 });
    expect(tarotCardBySlug("pentakli-korol")).toMatchObject({ name: "Король Пентаклей", order: 78 });
    expect(tarotFileName(tarotCardBySlug("mag")!)).toBe("02-mag");
  });

  test("every major card points at an existing matrix arcanum by the same slug", () => {
    const matrixSlugs = new Set(ARCANA.map((arcanum) => arcanum.slug));
    for (const card of TAROT_DECK.filter((item) => item.suit === "major")) expect(matrixSlugs.has(matrixSlugOf(card)!)).toBe(true);
    expect(matrixSlugOf(tarotCardBySlug("zhezly-tuz")!)).toBeNull();
  });
});
