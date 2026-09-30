import raw from "./generated/tarot.json";
import { parseTarotCard, type TarotCard } from "./tarot";
import { TAROT_DECK } from "./tarot-deck";

export type { TarotCard } from "./tarot";
export { TAROT_SECTION_TITLES } from "./tarot";
export * from "./tarot-deck";

// Собранные тексты: pnpm content:build → src/generated/tarot.json. Порядок и rank берутся из манифеста колоды
export const TAROT_CARDS: readonly TarotCard[] = Object.keys(raw as Record<string, string>)
  .sort()
  .map((name) => parseTarotCard((raw as Record<string, string>)[name] ?? "", `${name}.md`))
  .map((card) => ({ ...card, rank: TAROT_DECK.find((ref) => ref.slug === card.slug)?.rank ?? 0 }))
  .sort((a, b) => a.order - b.order);

export function tarotCardText(slug: string): TarotCard | undefined {
  return TAROT_CARDS.find((card) => card.slug === slug);
}
