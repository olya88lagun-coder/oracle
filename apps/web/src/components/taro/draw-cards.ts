import { TAROT_CARDS, TAROT_SUIT_LABELS } from "@oracle/content/tarot";
import { taroCardImage, taroCardPath } from "@/lib/taro-paths";
import type { DrawCard } from "./TaroDraw";

// В браузер уходит только то, что нужно для карты дня, а не вся колода целиком
export const drawCards = (): DrawCard[] =>
  TAROT_CARDS.map((card) => ({
    slug: card.slug,
    name: card.name,
    suitLabel: TAROT_SUIT_LABELS[card.suit],
    image: taroCardImage(card, "card"),
    path: taroCardPath(card),
    day: card.day.join(" "),
    action: card.action,
    question: card.question,
  }));
