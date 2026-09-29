import { LILA_ARROWS, LILA_CELL_COUNT, LILA_SNAKES } from "@oracle/core";
import { findStopPhrases } from "./check";
import type { LilaCell } from "./lila";

const ABOUT_CHARS = { min: 120, max: 700 } as const;
const QUESTION_CHARS = { min: 20, max: 280 } as const;
const TRANSITION_CHARS = { min: 25, max: 220 } as const;

const hasTransition = (number: number) => number in LILA_SNAKES || number in LILA_ARROWS;
const inRange = (text: string, range: { min: number; max: number }) => text.length >= range.min && text.length <= range.max;

function checkCell(cell: LilaCell): string[] {
  const errors: string[] = [];
  const at = (message: string) => errors.push(`клетка ${cell.number}: ${message}`);
  if (!inRange(cell.about, ABOUT_CHARS)) at(`«О чём это» — от ${ABOUT_CHARS.min} до ${ABOUT_CHARS.max} знаков, сейчас ${cell.about.length}`);
  cell.questions.forEach((question, index) => {
    if (!question.endsWith("?")) at(`вопрос ${index + 1} должен заканчиваться знаком «?»`);
    if (!inRange(question, QUESTION_CHARS)) at(`вопрос ${index + 1} — от ${QUESTION_CHARS.min} до ${QUESTION_CHARS.max} знаков`);
  });
  if (new Set(cell.questions).size !== cell.questions.length) at("вопросы совпадают");
  if (hasTransition(cell.number) && !cell.transition) at("нужна строка «Переход» (голова змеи или начало стрелы)");
  if (!hasTransition(cell.number) && cell.transition) at("строка «Переход» только у клеток со змеёй или стрелой");
  if (cell.transition && !inRange(cell.transition, TRANSITION_CHARS)) at(`переход — от ${TRANSITION_CHARS.min} до ${TRANSITION_CHARS.max} знаков`);
  const stops = findStopPhrases([cell.name, cell.about, ...cell.questions, cell.transition ?? ""].join("\n"));
  if (stops.length > 0) at(`запрещённые обороты — ${stops.join(", ")}`);
  return errors;
}

export function checkLilaCells(cells: readonly LilaCell[]): string[] {
  const errors: string[] = [];
  if (cells.length !== LILA_CELL_COUNT) errors.push(`клеток ${cells.length}, нужно ${LILA_CELL_COUNT}`);
  for (let number = 1; number <= LILA_CELL_COUNT; number += 1) {
    if (!cells.some((cell) => cell.number === number)) errors.push(`клетка ${number} отсутствует`);
  }
  const bySlug = new Map<string, number>();
  for (const cell of cells) {
    const previous = bySlug.get(cell.slug);
    if (previous !== undefined) errors.push(`клетки ${previous} и ${cell.number}: slug «${cell.slug}» повторяется`);
    bySlug.set(cell.slug, cell.number);
    errors.push(...checkCell(cell));
  }
  return errors;
}
