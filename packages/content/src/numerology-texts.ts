import raw from "./generated/numerology.json";
import { NUMEROLOGY_ACCEPTED_BATCHES, NUMEROLOGY_PAGES, type NumerologyKind, type NumerologyPageRef } from "./numerology-manifest";
import { parseNumerologyPage, type NumerologyText } from "./numerology";

export { NUMEROLOGY_MIN_BODY, NUMEROLOGY_SECTION_TITLES, NumerologyFormatError, PAIR_LINE_TITLES, PAIR_RELATION_TITLES, pairCellSection, pairLineSection, pairSectionTitles, parseNumerologyPage, SQUARE_LINE_TITLES, squareSectionTitles, type NumerologySection, type NumerologyText } from "./numerology";
export { NUMEROLOGY_ACCEPTED_BATCHES, NUMEROLOGY_PAGES, numerologyFile, type NumerologyKind, type NumerologyPageRef } from "./numerology-manifest";

// Собранные тексты: pnpm content:build → src/generated/numerology.json
const TEXTS: readonly NumerologyText[] = Object.entries(raw as Record<string, string>).map(([name, source]) => parseNumerologyPage(source, `${name}.md`));

const accepted = (batch: number): boolean => NUMEROLOGY_ACCEPTED_BATCHES.has(batch);

// Только принятые партии: у непринятой страницы нет текста, а значит нет страницы, ссылки и адреса в карте сайта
export function numerologyText(kind: NumerologyKind, key: string): NumerologyText | undefined {
  return TEXTS.find((text) => text.kind === kind && text.key === key && accepted(text.batch));
}

export function acceptedNumerologyPages(kind: NumerologyKind): readonly NumerologyPageRef[] {
  return NUMEROLOGY_PAGES.filter((page) => page.kind === kind && accepted(page.batch) && numerologyText(kind, page.key));
}

// Первый абзац первого раздела — для подписи под результатом калькулятора и description-подобных мест
export function numerologySummary(text: NumerologyText): string {
  return text.sections[0]?.paragraphs[0] ?? "";
}
