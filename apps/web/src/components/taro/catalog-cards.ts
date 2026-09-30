import { TAROT_CARDS } from "@oracle/content/tarot";
import { rankLabel, type CatalogCard } from "@/lib/taro-catalog";
import { taroCardImage, taroCardPath } from "@/lib/taro-paths";

// Данные для каталога: название, масть, подпись ранга, ключевые слова для поиска и пути
export const catalogCards = (): CatalogCard[] =>
  TAROT_CARDS.map((card) => ({
    slug: card.slug,
    name: card.name,
    suit: card.suit,
    rankLabel: rankLabel(card.suit, card.rank),
    keywords: card.keywords,
    image: taroCardImage(card, "card"),
    path: taroCardPath(card),
  }));
