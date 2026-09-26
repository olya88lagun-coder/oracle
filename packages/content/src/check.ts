import { ARCANA_COUNT } from "@oracle/core";
import type { Arcanum } from "./arcana";

// Обороты, которые превращают трактовку в предсказание, диагноз или запугивание. Сравнение — без регистра, «ё» = «е»
export const STOP_PHRASES = [
  "вас ждет",
  "вам суждено",
  "суждено вам",
  "неизбежно",
  "обязательно случится",
  "гарантирует",
  "гарантированно",
  "карма накажет",
  "кармический долг",
  "расплата",
  "порча",
  "сглаз",
  "проклят",
  "венец безбрачия",
  "диагноз",
  "болезнь",
] as const;

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, "е");

export function findStopPhrases(text: string): string[] {
  const haystack = normalize(text);
  return STOP_PHRASES.filter((phrase) => haystack.includes(phrase));
}

const arcanumText = (a: Arcanum) =>
  [a.name, ...a.keywords, ...a.essence, ...a.personality, ...a.center, ...a.task, ...a.resource, ...a.distortion, a.action, a.question].join("\n");

export function checkArcana(entries: readonly { file: string; arcanum: Arcanum }[], expectedCount: number = ARCANA_COUNT): string[] {
  const errors: string[] = [];
  if (entries.length !== expectedCount) errors.push(`файлов арканов ${entries.length}, нужно ${expectedCount}`);

  for (let number = 1; number <= expectedCount; number += 1) {
    const count = entries.filter((entry) => entry.arcanum.number === number).length;
    if (count === 0) errors.push(`номер ${number} отсутствует`);
    if (count > 1) errors.push(`номер ${number} встречается ${count} раза`);
  }

  for (const { file, arcanum } of entries) {
    const expectedFile = `${String(arcanum.number).padStart(2, "0")}-${arcanum.slug}.md`;
    if (file !== expectedFile) errors.push(`${file}: имя файла должно быть ${expectedFile}`);
    const stops = findStopPhrases(arcanumText(arcanum));
    if (stops.length > 0) errors.push(`${file}: запрещённые обороты — ${stops.join(", ")}`);
  }
  return errors;
}
