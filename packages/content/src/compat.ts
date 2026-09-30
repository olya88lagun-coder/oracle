import { ARCANA_COUNT } from "@oracle/core";

export type CompatUnion = {
  readonly number: number;
  readonly name: string;
  readonly essence: string;
  readonly gives: string;
  readonly attention: string;
  readonly question: string;
};

export class CompatFormatError extends Error {}

const HEADING = /^(\d+)\.\s+(.+)$/;
const FIELD = /^(Суть союза|Что даёт|Где стоит присмотреться|Вопрос для двоих):\s*(.+)$/;
const FIELDS = ["Суть союза", "Что даёт", "Где стоит присмотреться", "Вопрос для двоих"] as const;

function parseBlock(block: string): CompatUnion {
  const [heading = "", ...lines] = block.split("\n");
  const match = HEADING.exec(heading.trim());
  if (!match) throw new CompatFormatError(`заголовок должен быть «N. Название»: «${heading.trim()}»`);
  const number = Number(match[1]);
  const fail = (message: string): never => {
    throw new CompatFormatError(`союз ${number}: ${message}`);
  };
  if (number < 1 || number > ARCANA_COUNT) fail(`номер должен быть от 1 до ${ARCANA_COUNT}`);
  const fields = new Map<string, string>();
  for (const line of lines.map((item) => item.trim()).filter(Boolean)) {
    const field = FIELD.exec(line);
    if (!field) fail(`неизвестная строка «${line}»`);
    const [, key = "", value = ""] = field!;
    if (fields.has(key)) fail(`поле «${key}» повторяется`);
    fields.set(key, value.trim());
  }
  for (const key of FIELDS) if (!fields.get(key)) fail(`нет поля «${key}»`);
  return {
    number,
    name: match[2]!.trim(),
    essence: fields.get("Суть союза")!,
    gives: fields.get("Что даёт")!,
    attention: fields.get("Где стоит присмотреться")!,
    question: fields.get("Вопрос для двоих")!,
  };
}

export function parseCompatUnions(source: string): CompatUnion[] {
  const [before, ...blocks] = source.replace(/\r\n/g, "\n").split(/^## /m);
  if (before?.trim()) throw new CompatFormatError("текст до первого союза");
  const unions = blocks.map(parseBlock);
  const seen = new Set<number>();
  for (const union of unions) {
    if (seen.has(union.number)) throw new CompatFormatError(`союз ${union.number} повторяется`);
    seen.add(union.number);
  }
  return unions.sort((a, b) => a.number - b.number);
}
