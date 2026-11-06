import raw from "./generated/tarot-combos.json";
import { findStopPhrases } from "./check";
import { TAROT_DECK, type TarotCardRef } from "./tarot-deck";

// Сочетания карт для страниц Таро: у каждой карты — несколько пар с короткой трактовкой
export type TarotCombo = { readonly partner: TarotCardRef; readonly text: string };

export class TarotComboFormatError extends Error {}

const byName = new Map(TAROT_DECK.map((card) => [card.name, card] as const));
const bySlug = new Map(TAROT_DECK.map((card) => [card.slug, card] as const));

export function parseTarotCombos(source: string): ReadonlyMap<string, readonly TarotCombo[]> {
  const [before, ...blocks] = source.replace(/\r\n/g, "\n").split(/^## /m);
  if (before?.trim()) throw new TarotComboFormatError("текст до первой карты");
  const result = new Map<string, TarotCombo[]>();
  for (const block of blocks) {
    const [heading = "", ...lines] = block.split("\n");
    const slug = heading.trim();
    if (!bySlug.has(slug)) throw new TarotComboFormatError(`неизвестная карта «${slug}»`);
    if (result.has(slug)) throw new TarotComboFormatError(`карта ${slug} повторяется`);
    const combos: TarotCombo[] = [];
    for (const line of lines.map((item) => item.trim()).filter(Boolean)) {
      const match = /^([^:]+):\s*(.+)$/.exec(line);
      const partner = match && byName.get(match[1]!.trim());
      if (!match || !partner) throw new TarotComboFormatError(`${slug}: строка должна начинаться с названия карты: «${line}»`);
      combos.push({ partner, text: match[2]!.trim() });
    }
    result.set(slug, combos);
  }
  return result;
}

const COUNT = { min: 4, max: 8 } as const;
const TEXT = { min: 80, max: 320 } as const;

export function checkTarotCombos(combos: ReadonlyMap<string, readonly TarotCombo[]>): string[] {
  const errors: string[] = [];
  for (const card of TAROT_DECK.filter((item) => item.suit === "major")) {
    if (!combos.has(card.slug)) errors.push(`нет сочетаний для карты ${card.slug}`);
  }
  for (const [slug, list] of combos) {
    const at = (message: string) => errors.push(`${slug}: ${message}`);
    if (list.length < COUNT.min || list.length > COUNT.max) at(`сочетаний ${list.length}, нужно от ${COUNT.min} до ${COUNT.max}`);
    const partners = list.map((combo) => combo.partner.slug);
    if (partners.includes(slug)) at("карта в паре сама с собой");
    if (new Set(partners).size !== partners.length) at("карта-партнёр повторяется");
    for (const combo of list) {
      if (combo.text.length < TEXT.min || combo.text.length > TEXT.max) at(`${combo.partner.slug} — от ${TEXT.min} до ${TEXT.max} знаков, сейчас ${combo.text.length}`);
    }
    const stops = findStopPhrases(list.map((combo) => combo.text).join("\n"));
    if (stops.length > 0) at(`запрещённые обороты — ${stops.join(", ")}`);
  }
  return errors;
}

// Собранные тексты: pnpm content:build → src/generated/tarot-combos.json
export const TAROT_COMBOS = parseTarotCombos(raw.combos);
export const tarotCombos = (slug: string): readonly TarotCombo[] => TAROT_COMBOS.get(slug) ?? [];
