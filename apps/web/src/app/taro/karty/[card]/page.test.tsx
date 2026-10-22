import { TAROT_DECK } from "@oracle/content/tarot";
import { describe, expect, test } from "vitest";
import { generateMetadata } from "./page";

const params = (card: string) => ({ params: Promise.resolve({ card }) });
// К заголовку страницы layout добавляет « — Твой оракул» (14 знаков); в выдаче целиком помещается около 60
const TITLE_SUFFIX_LENGTH = " — Твой оракул".length;
const SERP_TITLE_LIMIT = 60;

describe("/taro/karty/[card] metadata", () => {
  test("the title of every card, with the site name, fits into the search results", async () => {
    for (const card of TAROT_DECK) {
      const metadata = await generateMetadata(params(card.slug));
      const title = String(metadata.title);
      expect(title, card.slug).toMatch(/^Карта Таро .+ — значение$/);
      expect(title.length + TITLE_SUFFIX_LENGTH, card.slug).toBeLessThanOrEqual(SERP_TITLE_LIMIT);
    }
  });
});
