import type { BodyId } from "@oracle/core/natal";
import { findStopPhrases } from "./check";
import { HOUSE_BODIES, HOUSE_BODY_BATCH, HOUSE_NUMBERS, type NatalHouseFile, type NatalPlanetsFile } from "./natal-houses";

// Проверка текстов «планета в доме» и «функция планеты»: состав, объём, обороты-предсказания, шаблонность

export const HOUSE_WORDS = { min: 45, max: 95 } as const;
export const FUNCTION_WORDS = { min: 25, max: 60 } as const;
export const MAX_SHARED_SHINGLES = 0.25;
const SHINGLE_SIZE = 5;

const wordList = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
const shingles = (text: string): Set<string> => {
  const list = wordList(text);
  return new Set(list.slice(0, Math.max(0, list.length - SHINGLE_SIZE + 1)).map((_, i) => list.slice(i, i + SHINGLE_SIZE).join(" ")));
};

// Слова, которых в этих текстах быть не должно: обращение на «ты» и «карма»
const FORBIDDEN = /(^|[^а-яё])(ты|тебя|тебе|тобой|карма|кармическ[а-яё]*)([^а-яё]|$)/i;

function checkText(label: string, text: string, range: { min: number; max: number }): string[] {
  const errors: string[] = [];
  const words = wordList(text).length;
  if (words < range.min || words > range.max) errors.push(`${label}: слов ${words}, нужно от ${range.min} до ${range.max}`);
  const stops = findStopPhrases(text);
  if (stops.length > 0) errors.push(`${label}: запрещённые обороты — ${stops.join(", ")}`);
  if (FORBIDDEN.test(text)) errors.push(`${label}: «ты»/«карма»`);
  return errors;
}

export function checkNatalHouses(files: readonly NatalHouseFile[], planets: NatalPlanetsFile): string[] {
  const errors: string[] = [];
  const seen = new Set<BodyId>();
  const blocks: { label: string; text: string }[] = [];
  for (const file of files) {
    if (seen.has(file.body)) errors.push(`${file.body}: файл повторяется`);
    seen.add(file.body);
    if (file.batch !== HOUSE_BODY_BATCH[file.body]) errors.push(`${file.body}: партия ${file.batch}, должна быть ${HOUSE_BODY_BATCH[file.body]}`);
    const numbers = Object.keys(file.blocks).map(Number).sort((a, b) => a - b);
    if (numbers.join() !== HOUSE_NUMBERS.join()) errors.push(`${file.body}: нужны дома 1–12, сейчас ${numbers.join(", ") || "ни одного"}`);
    for (const house of HOUSE_NUMBERS) {
      const text = file.blocks[house];
      if (text === undefined) continue;
      errors.push(...checkText(`${file.body}, ${house} дом`, text, HOUSE_WORDS));
      blocks.push({ label: `${file.body}, ${house} дом`, text });
    }
  }
  for (const body of HOUSE_BODIES) {
    const text = planets.functions[body];
    if (text === undefined) {
      errors.push(`natal-planets.md: нет функции для «${body}»`);
      continue;
    }
    errors.push(...checkText(`функция ${body}`, text, FUNCTION_WORDS));
    blocks.push({ label: `функция ${body}`, text });
  }
  // Шаблонность: любая пара блоков не делит больше четверти пятисловных последовательностей
  const sets = blocks.map((block) => shingles(block.text));
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const first = sets[i];
      const second = sets[j];
      if (!first || !second || first.size === 0) continue;
      let shared = 0;
      for (const item of first) if (second.has(item)) shared++;
      const share = shared / first.size;
      if (share > MAX_SHARED_SHINGLES) errors.push(`«${blocks[i]?.label}» и «${blocks[j]?.label}» совпадают на ${Math.round(share * 100)}%, нужно не больше ${MAX_SHARED_SHINGLES * 100}%`);
    }
  }
  return errors;
}
