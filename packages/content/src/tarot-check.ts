import { findStopPhrases } from "./check";
import type { TarotCard } from "./tarot";
import { TAROT_DECK } from "./tarot-deck";

const RANGES = {
  essence: { min: 400, max: 1600 },
  love: { min: 200, max: 900 },
  money: { min: 200, max: 900 },
  day: { min: 150, max: 800 },
  action: { min: 20, max: 300 },
  question: { min: 20, max: 240 },
  item: { min: 12, max: 140 },
} as const;
const MIN_WORDS = 330;

const chars = (parts: readonly string[]) => parts.join(" ").length;
const inRange = (n: number, range: { min: number; max: number }) => n >= range.min && n <= range.max;
const words = (card: TarotCard) =>
  [...card.essence, ...card.love, ...card.money, ...card.resource, ...card.distortion, ...card.day, card.action, card.question].join(" ").split(/\s+/).filter(Boolean).length;

function checkCard(card: TarotCard): string[] {
  const errors: string[] = [];
  const at = (message: string) => errors.push(`${card.slug}: ${message}`);
  const ref = TAROT_DECK.find((item) => item.slug === card.slug);
  if (!ref) return [`${card.slug}: нет в манифесте колоды`];
  if (ref.order !== card.order || ref.name !== card.name || ref.suit !== card.suit) at(`шапка не совпадает с манифестом (order ${ref.order}, «${ref.name}», ${ref.suit})`);
  for (const key of ["essence", "love", "money", "day"] as const) {
    if (!inRange(chars(card[key]), RANGES[key])) at(`секция ${key}: от ${RANGES[key].min} до ${RANGES[key].max} знаков, сейчас ${chars(card[key])}`);
  }
  if (card.essence.length < 2) at("«Суть» — минимум два абзаца");
  if (!inRange(card.action.length, RANGES.action)) at(`«Действие на сегодня»: от ${RANGES.action.min} до ${RANGES.action.max} знаков`);
  if (!card.question.endsWith("?")) at("«Вопрос для себя» должен заканчиваться знаком «?»");
  if (!inRange(card.question.length, RANGES.question)) at(`«Вопрос для себя»: от ${RANGES.question.min} до ${RANGES.question.max} знаков`);
  for (const item of [...card.resource, ...card.distortion]) {
    if (!inRange(item.length, RANGES.item)) at(`пункт списка «${item.slice(0, 30)}…»: от ${RANGES.item.min} до ${RANGES.item.max} знаков`);
  }
  if (words(card) < MIN_WORDS) at(`слов ${words(card)}, нужно не меньше ${MIN_WORDS}`);
  const stops = findStopPhrases([card.name, ...card.keywords, ...card.essence, ...card.love, ...card.money, ...card.resource, ...card.distortion, ...card.day, card.action, card.question].join("\n"));
  if (stops.length > 0) at(`запрещённые обороты — ${stops.join(", ")}`);
  return errors;
}

export function checkTarotCards(cards: readonly TarotCard[]): string[] {
  const errors: string[] = [];
  if (cards.length !== TAROT_DECK.length) errors.push(`карт ${cards.length}, нужно ${TAROT_DECK.length}`);
  for (const ref of TAROT_DECK) if (!cards.some((card) => card.slug === ref.slug)) errors.push(`${ref.slug}: текст отсутствует`);
  const questions = new Map<string, string>();
  for (const card of cards) {
    errors.push(...checkCard(card));
    const previous = questions.get(card.question);
    if (previous) errors.push(`${previous} и ${card.slug}: вопрос совпадает`);
    questions.set(card.question, card.slug);
  }
  return errors;
}
