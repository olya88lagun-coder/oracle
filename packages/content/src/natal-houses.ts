import type { BodyId } from "@oracle/core/natal";
import housesRaw from "./generated/natal-houses.json";
import planetsRaw from "./generated/natal-planets.json";

// Тексты платного разбора натальной карты: «планета в доме» (по 12 блоков на тело, файл packages/content/natal-houses/<тело>.md)
// и «функция планеты» (packages/content/natal-planets.md). Блоки читает воркер: сборка глав без ИИ и вход ИИ-редактора.
// Партии вычитывает владелица; пока партия не принята (ACCEPTED_HOUSE_BATCHES), блоки не используются.

export const HOUSE_BODIES: readonly BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
export const HOUSE_BODY_BATCH: Readonly<Record<BodyId, number>> = {
  sun: 1,
  moon: 1,
  mercury: 1,
  venus: 1,
  mars: 2,
  jupiter: 2,
  saturn: 2,
  uranus: 3,
  neptune: 3,
  pluto: 3,
};
export const HOUSE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

// Принятые владелицей партии: 1 — Солнце, Луна, Меркурий, Венера и функции всех планет; 2 — Марс, Юпитер, Сатурн; 3 — Уран, Нептун, Плутон.
// Номер добавляется отдельным коммитом после вычитки. Партия 1 принята владелицей 21 октября 2026, партия 2 — 21 октября 2026
export const ACCEPTED_HOUSE_BATCHES: ReadonlySet<number> = new Set<number>([1, 2]);

export class NatalHouseFormatError extends Error {}

export type NatalHouseFile = { body: BodyId; batch: number; blocks: Readonly<Record<number, string>> };
export type NatalPlanetsFile = { batch: number; functions: Readonly<Partial<Record<BodyId, string>>> };

const paragraph = (text: string) => text.replace(/\s*\n\s*/g, " ").trim();

function frontMatter(source: string, file: string): { head: Record<string, string>; rest: string } {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source.replace(/\r\n/g, "\n"));
  if (!match) throw new NatalHouseFormatError(`${file}: нет шапки`);
  const head: Record<string, string> = {};
  for (const line of (match[1] ?? "").split("\n")) {
    const pair = /^([a-z]+):\s*(.+)$/.exec(line.trim());
    if (pair) head[pair[1] as string] = pair[2] as string;
  }
  return { head, rest: match[2] ?? "" };
}

// Разделы вида «## <заголовок>» → заголовок и текст раздела одним абзацем
function sections(rest: string, file: string): [string, string][] {
  const parts = rest.split(/^## /m).slice(1);
  if (parts.length === 0) throw new NatalHouseFormatError(`${file}: нет разделов`);
  return parts.map((part) => {
    const newline = part.indexOf("\n");
    return [part.slice(0, newline).trim(), paragraph(part.slice(newline + 1))];
  });
}

export function parseNatalHouseFile(source: string, file: string): NatalHouseFile {
  const { head, rest } = frontMatter(source, file);
  const body = HOUSE_BODIES.find((item) => item === head.body);
  if (!body) throw new NatalHouseFormatError(`${file}: неизвестное тело «${head.body ?? ""}»`);
  const batch = Number(head.batch);
  if (!Number.isInteger(batch)) throw new NatalHouseFormatError(`${file}: batch должен быть числом`);
  const blocks: Record<number, string> = {};
  for (const [title, text] of sections(rest, file)) {
    const house = /^(\d{1,2}) дом$/.exec(title)?.[1];
    if (!house) throw new NatalHouseFormatError(`${file}: заголовок «${title}» должен быть «<N> дом»`);
    blocks[Number(house)] = text;
  }
  return { body, batch, blocks };
}

export function parseNatalPlanets(source: string): NatalPlanetsFile {
  const { head, rest } = frontMatter(source, "natal-planets.md");
  const functions: Partial<Record<BodyId, string>> = {};
  for (const [title, text] of sections(rest, "natal-planets.md")) {
    const body = HOUSE_BODIES.find((item) => item === title);
    if (!body) throw new NatalHouseFormatError(`natal-planets.md: неизвестное тело «${title}»`);
    functions[body] = text;
  }
  return { batch: Number(head.batch), functions };
}

// Собранные тексты: pnpm content:build → src/generated/natal-houses.json и natal-planets.json
export const NATAL_HOUSE_FILES: readonly NatalHouseFile[] = Object.keys(housesRaw as Record<string, string>)
  .sort()
  .map((name) => parseNatalHouseFile((housesRaw as Record<string, string>)[name] ?? "", `${name}.md`));
export const NATAL_PLANETS: NatalPlanetsFile = parseNatalPlanets((planetsRaw as { planets: string }).planets);

// Блок «<тело> в <N> доме» из принятой партии или undefined
export function houseBlock(body: BodyId, house: number): string | undefined {
  const file = NATAL_HOUSE_FILES.find((item) => item.body === body);
  return file && ACCEPTED_HOUSE_BATCHES.has(file.batch) ? file.blocks[house] : undefined;
}

// Функция планеты («Марс связывают с энергией…») из принятой партии или undefined
export function planetFunction(body: BodyId): string | undefined {
  return ACCEPTED_HOUSE_BATCHES.has(NATAL_PLANETS.batch) ? NATAL_PLANETS.functions[body] : undefined;
}
