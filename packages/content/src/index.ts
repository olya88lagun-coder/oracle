import { parseArcanum, type Arcanum } from "./arcana";
import raw from "./generated/arcana.json";
import positionsRaw from "./generated/positions.json";
import { parsePositions } from "./positions";

export { ArcanumFormatError, parseArcanum, SECTION_TITLES, type Arcanum } from "./arcana";
export { checkArcana, findStopPhrases, STOP_PHRASES } from "./check";
export { parsePositions, PositionsFormatError } from "./positions";

export function loadArcana(sources: Readonly<Record<string, string>>): { file: string; arcanum: Arcanum }[] {
  return Object.keys(sources)
    .sort()
    .map((name) => ({ file: `${name}.md`, arcanum: parseArcanum(sources[name] ?? "", `${name}.md`) }));
}

// Собранные тексты: pnpm content:build → src/generated/arcana.json
export const ARCANA: readonly Arcanum[] = loadArcana(raw as Record<string, string>)
  .map((entry) => entry.arcanum)
  .sort((a, b) => a.number - b.number);

export function arcanumByNumber(number: number): Arcanum {
  const arcanum = ARCANA.find((item) => item.number === number);
  if (!arcanum) throw new Error(`Аркан ${number} не найден — выполните pnpm content:build`);
  return arcanum;
}

export function arcanumBySlug(slug: string): Arcanum | undefined {
  return ARCANA.find((item) => item.slug === slug);
}

// Что показывает каждая глава платного разбора: вход для ИИ и вступление глав без ИИ
export const POSITIONS = parsePositions(positionsRaw.positions);
