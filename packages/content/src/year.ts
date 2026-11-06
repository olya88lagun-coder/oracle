import { ARCANA_COUNT } from "@oracle/core";
import { findStopPhrases } from "./check";

// Тексты страниц «аркан на год» (/arkan-na-god): календарная практика, не прогноз
export type YearText = {
  readonly number: number;
  readonly name: string;
  readonly theme: string;
  readonly supports: string;
  readonly attention: string;
  readonly love: string;
  readonly money: string;
  readonly question: string;
};

export class YearFormatError extends Error {}

const FIELDS = {
  "Тема года": "theme",
  "Что поддерживает": "supports",
  "На что обратить внимание": "attention",
  "В отношениях": "love",
  "В деле и деньгах": "money",
  "Вопрос года": "question",
} as const;
type FieldKey = (typeof FIELDS)[keyof typeof FIELDS];

const HEADING = /^(\d+)\.\s+(.+)$/;
const FIELD = /^([^:]+):\s*(.+)$/;

function parseBlock(block: string): YearText {
  const [heading = "", ...lines] = block.split("\n");
  const match = HEADING.exec(heading.trim());
  if (!match) throw new YearFormatError(`заголовок должен быть «N. Название»: «${heading.trim()}»`);
  const number = Number(match[1]);
  const fail = (message: string): never => {
    throw new YearFormatError(`аркан года ${number}: ${message}`);
  };
  if (number < 1 || number > ARCANA_COUNT) fail(`номер должен быть от 1 до ${ARCANA_COUNT}`);
  const values = new Map<FieldKey, string>();
  for (const line of lines.map((item) => item.trim()).filter(Boolean)) {
    const field = FIELD.exec(line);
    const key = field ? FIELDS[field[1] as keyof typeof FIELDS] : undefined;
    if (!field || !key) return fail(`неизвестная строка «${line}»`);
    if (values.has(key)) fail(`поле «${field[1]}» повторяется`);
    values.set(key, field[2]!.trim());
  }
  for (const [label, key] of Object.entries(FIELDS)) if (!values.get(key)) fail(`нет поля «${label}»`);
  const get = (key: FieldKey) => values.get(key)!;
  return { number, name: match[2]!.trim(), theme: get("theme"), supports: get("supports"), attention: get("attention"), love: get("love"), money: get("money"), question: get("question") };
}

export function parseYearTexts(source: string): YearText[] {
  const [before, ...blocks] = source.replace(/\r\n/g, "\n").split(/^## /m);
  if (before?.trim()) throw new YearFormatError("текст до первого аркана");
  const texts = blocks.map(parseBlock);
  const seen = new Set<number>();
  for (const text of texts) {
    if (seen.has(text.number)) throw new YearFormatError(`аркан года ${text.number} повторяется`);
    seen.add(text.number);
  }
  return texts.sort((a, b) => a.number - b.number);
}

const LIMITS: Readonly<Record<Exclude<FieldKey, "question">, { min: number; max: number }>> = {
  theme: { min: 250, max: 700 },
  supports: { min: 100, max: 400 },
  attention: { min: 100, max: 400 },
  love: { min: 100, max: 350 },
  money: { min: 100, max: 350 },
};

export function checkYearTexts(texts: readonly YearText[], arcanaNames: ReadonlyMap<number, string>): string[] {
  const errors: string[] = [];
  if (texts.length !== ARCANA_COUNT) errors.push(`арканов года ${texts.length}, нужно ${ARCANA_COUNT}`);
  for (const text of texts) {
    const at = (message: string) => errors.push(`аркан года ${text.number}: ${message}`);
    if (arcanaNames.get(text.number) !== text.name) at(`имя аркана должно быть «${arcanaNames.get(text.number)}», в тексте «${text.name}»`);
    for (const [key, { min, max }] of Object.entries(LIMITS) as [keyof typeof LIMITS, { min: number; max: number }][]) {
      if (text[key].length < min || text[key].length > max) at(`поле ${key} — от ${min} до ${max} знаков, сейчас ${text[key].length}`);
    }
    if (!text.question.endsWith("?")) at("«Вопрос года» должен заканчиваться знаком «?»");
    const stops = findStopPhrases([text.theme, text.supports, text.attention, text.love, text.money, text.question].join("\n"));
    if (stops.length > 0) at(`запрещённые обороты — ${stops.join(", ")}`);
  }
  return errors;
}
