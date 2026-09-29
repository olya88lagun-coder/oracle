import { LILA_CELL_COUNT } from "@oracle/core";

export type LilaCell = {
  readonly number: number;
  readonly name: string;
  readonly slug: string;
  readonly about: string;
  readonly questions: readonly [string, string, string];
  readonly transition: string | null;
};

export class LilaFormatError extends Error {}

const SLUG = /^[a-z]+(-[a-z]+)*$/;
const HEADING = /^(\d+)\.\s+(.+)$/;
const FIELD = /^(slug|О чём это|Вопрос 1|Вопрос 2|Вопрос 3|Переход):\s*(.+)$/;
const REQUIRED = ["slug", "О чём это", "Вопрос 1", "Вопрос 2", "Вопрос 3"] as const;

function parseBlock(block: string): LilaCell {
  const [heading = "", ...lines] = block.split("\n");
  const match = HEADING.exec(heading.trim());
  if (!match) throw new LilaFormatError(`заголовок клетки должен быть «N. Название»: «${heading.trim()}»`);
  const number = Number(match[1]);
  const fail = (message: string): never => {
    throw new LilaFormatError(`клетка ${number}: ${message}`);
  };
  if (number < 1 || number > LILA_CELL_COUNT) fail(`номер должен быть от 1 до ${LILA_CELL_COUNT}`);

  const fields = new Map<string, string>();
  for (const line of lines.map((item) => item.trim()).filter(Boolean)) {
    const field = FIELD.exec(line);
    if (!field) fail(`неизвестная строка «${line}»`);
    const [, key = "", value = ""] = field!;
    if (fields.has(key)) fail(`поле «${key}» повторяется`);
    fields.set(key, value.trim());
  }
  for (const key of REQUIRED) if (!fields.get(key)) fail(`нет поля «${key}»`);

  const slug = fields.get("slug")!;
  if (!SLUG.test(slug)) fail("slug — латиница в нижнем регистре через дефис");
  return {
    number,
    name: match[2]!.trim(),
    slug,
    about: fields.get("О чём это")!,
    questions: [fields.get("Вопрос 1")!, fields.get("Вопрос 2")!, fields.get("Вопрос 3")!],
    transition: fields.get("Переход") ?? null,
  };
}

export function parseLilaCells(source: string): LilaCell[] {
  const [before, ...blocks] = source.replace(/\r\n/g, "\n").split(/^## /m);
  if (before?.trim()) throw new LilaFormatError("текст до первой клетки");
  const cells = blocks.map(parseBlock);
  const seen = new Set<number>();
  for (const cell of cells) {
    if (seen.has(cell.number)) throw new LilaFormatError(`клетка ${cell.number} повторяется`);
    seen.add(cell.number);
  }
  return cells.sort((a, b) => a.number - b.number);
}
