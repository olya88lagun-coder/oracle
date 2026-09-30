import { ARCANA_COUNT } from "@oracle/core";
import { findStopPhrases } from "./check";
import type { CompatUnion } from "./compat";

const ESSENCE_CHARS = { min: 150, max: 500 } as const;
const GIVES_CHARS = { min: 100, max: 400 } as const;
const ATTENTION_CHARS = { min: 100, max: 400 } as const;
const QUESTION_CHARS = { min: 20, max: 240 } as const;

const inRange = (text: string, range: { min: number; max: number }) => text.length >= range.min && text.length <= range.max;

function checkUnion(union: CompatUnion, arcanaNames: ReadonlyMap<number, string>): string[] {
  const errors: string[] = [];
  const at = (message: string) => errors.push(`союз ${union.number}: ${message}`);
  if (arcanaNames.get(union.number) !== union.name) at(`имя аркана должно быть «${arcanaNames.get(union.number)}», в тексте «${union.name}»`);
  if (!inRange(union.essence, ESSENCE_CHARS)) at(`«Суть союза» — от ${ESSENCE_CHARS.min} до ${ESSENCE_CHARS.max} знаков, сейчас ${union.essence.length}`);
  if (!inRange(union.gives, GIVES_CHARS)) at(`«Что даёт» — от ${GIVES_CHARS.min} до ${GIVES_CHARS.max} знаков, сейчас ${union.gives.length}`);
  if (!inRange(union.attention, ATTENTION_CHARS)) at(`«Где стоит присмотреться» — от ${ATTENTION_CHARS.min} до ${ATTENTION_CHARS.max} знаков, сейчас ${union.attention.length}`);
  if (!union.question.endsWith("?")) at("«Вопрос для двоих» должен заканчиваться знаком «?»");
  if (!inRange(union.question, QUESTION_CHARS)) at(`«Вопрос для двоих» — от ${QUESTION_CHARS.min} до ${QUESTION_CHARS.max} знаков`);
  const stops = findStopPhrases([union.name, union.essence, union.gives, union.attention, union.question].join("\n"));
  if (stops.length > 0) at(`запрещённые обороты — ${stops.join(", ")}`);
  return errors;
}

export function checkCompatUnions(unions: readonly CompatUnion[], arcanaNames: ReadonlyMap<number, string>): string[] {
  const errors: string[] = [];
  if (unions.length !== ARCANA_COUNT) errors.push(`союзов ${unions.length}, нужно ${ARCANA_COUNT}`);
  for (let number = 1; number <= ARCANA_COUNT; number += 1) {
    if (!unions.some((union) => union.number === number)) errors.push(`союз ${number} отсутствует`);
  }
  for (const union of unions) errors.push(...checkUnion(union, arcanaNames));
  return errors;
}
