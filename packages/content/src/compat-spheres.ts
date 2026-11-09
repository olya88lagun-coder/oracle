import { ARCANA_COUNT } from "@oracle/core";
import { findStopPhrases } from "./check";
import { CompatFormatError } from "./compat";

// Сферы союза для результата совместимости: packages/content/compat-spheres.md, формат как у compat-arcana.md
export type CompatSpheres = {
  readonly number: number;
  readonly name: string;
  readonly closer: string;
  readonly friction: string;
  readonly agree: string;
  readonly question: string;
};

const HEADING = /^(\d+)\.\s+(.+)$/;
const FIELDS = {
  "Что сближает": "closer",
  "Где возможны разногласия": "friction",
  "Как договариваться": "agree",
  "Вопрос для разговора": "question",
} as const;
type FieldKey = (typeof FIELDS)[keyof typeof FIELDS];
const FIELD = new RegExp(`^(${Object.keys(FIELDS).join("|")}):\\s*(.+)$`);

function parseBlock(block: string): CompatSpheres {
  const [heading = "", ...lines] = block.split("\n");
  const match = HEADING.exec(heading.trim());
  if (!match) throw new CompatFormatError(`заголовок должен быть «N. Название»: «${heading.trim()}»`);
  const number = Number(match[1]);
  const fail = (message: string): never => {
    throw new CompatFormatError(`сферы ${number}: ${message}`);
  };
  if (number < 1 || number > ARCANA_COUNT) fail(`номер должен быть от 1 до ${ARCANA_COUNT}`);
  const fields = new Map<FieldKey, string>();
  for (const line of lines.map((item) => item.trim()).filter(Boolean)) {
    const field = FIELD.exec(line);
    if (!field) fail(`неизвестная строка «${line}»`);
    const key = FIELDS[field![1] as keyof typeof FIELDS];
    if (fields.has(key)) fail(`поле «${field![1]}» повторяется`);
    fields.set(key, field![2]!.trim());
  }
  for (const [label, key] of Object.entries(FIELDS)) if (!fields.get(key)) fail(`нет поля «${label}»`);
  return {
    number,
    name: match[2]!.trim(),
    closer: fields.get("closer")!,
    friction: fields.get("friction")!,
    agree: fields.get("agree")!,
    question: fields.get("question")!,
  };
}

export function parseCompatSpheres(source: string): CompatSpheres[] {
  const [before, ...blocks] = source.replace(/\r\n/g, "\n").split(/^## /m);
  if (before?.trim()) throw new CompatFormatError("текст до первого аркана");
  const items = blocks.map(parseBlock);
  const seen = new Set<number>();
  for (const item of items) {
    if (seen.has(item.number)) throw new CompatFormatError(`сферы ${item.number} повторяются`);
    seen.add(item.number);
  }
  return items.sort((a, b) => a.number - b.number);
}

const TEXT_CHARS = { min: 100, max: 400 } as const;
const QUESTION_CHARS = { min: 20, max: 240 } as const;
const LABELS: Readonly<Record<FieldKey, string>> = {
  closer: "Что сближает",
  friction: "Где возможны разногласия",
  agree: "Как договариваться",
  question: "Вопрос для разговора",
};

export function checkCompatSpheres(items: readonly CompatSpheres[], arcanaNames: ReadonlyMap<number, string>): string[] {
  const errors: string[] = [];
  if (items.length !== ARCANA_COUNT) errors.push(`сфер ${items.length}, нужно ${ARCANA_COUNT}`);
  for (const item of items) {
    const at = (message: string) => errors.push(`сферы ${item.number}: ${message}`);
    if (arcanaNames.get(item.number) !== item.name) at(`имя аркана должно быть «${arcanaNames.get(item.number)}», в тексте «${item.name}»`);
    for (const key of ["closer", "friction", "agree"] as const) {
      const length = item[key].length;
      if (length < TEXT_CHARS.min || length > TEXT_CHARS.max) at(`«${LABELS[key]}» — от ${TEXT_CHARS.min} до ${TEXT_CHARS.max} знаков, сейчас ${length}`);
    }
    if (!item.question.endsWith("?")) at(`«${LABELS.question}» должен заканчиваться знаком «?»`);
    if (item.question.length < QUESTION_CHARS.min || item.question.length > QUESTION_CHARS.max) at(`«${LABELS.question}» — от ${QUESTION_CHARS.min} до ${QUESTION_CHARS.max} знаков`);
    const stops = findStopPhrases([item.closer, item.friction, item.agree, item.question].join("\n"));
    if (stops.length > 0) at(`запрещённые обороты — ${stops.join(", ")}`);
  }
  return errors;
}
