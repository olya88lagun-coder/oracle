import { TAROT_CARDS } from "@oracle/content/tarot";
import { taroCardImage, taroCardPath } from "@/lib/taro-paths";
import { positionReading, type PositionText, type Spread, type SpreadSource } from "@/lib/taro-spreads";

export type SpreadCardData = {
  slug: string;
  name: string;
  image: string;
  path: string;
  texts: Partial<Record<SpreadSource, PositionText>>;
};

// В браузер уходит только то, что нужно этому раскладу: название, картинка и разделы карт, которые берут его позиции
export function spreadDeck(spread: Spread): SpreadCardData[] {
  const sources = [...new Set(spread.positions.map((position) => position.source))];
  return TAROT_CARDS.map((card) => ({
    slug: card.slug,
    name: card.name,
    image: taroCardImage(card, "card"),
    path: taroCardPath(card),
    texts: Object.fromEntries(sources.map((source) => [source, positionReading(card, source)])),
  }));
}
