import { findStopPhrases } from "@oracle/content";
import type { NatalChapterInput } from "./natal-input";
import { NATAL_PROSE_LIMITS } from "./natal-prompt";
import type { NatalChapter } from "./natal-fallback";
import { extractJson, readProse, readScenario, type ValidationFailure } from "./validate";

export type NatalValidation = { ok: true; chapter: NatalChapter } | { ok: false; reason: ValidationFailure };

// Проверка ответа модели: форма (текст нужной длины или JSON сценария), объём и обороты-предсказания из общего стоп-списка
export function validateNatalChapter(input: NatalChapterInput, raw: string): NatalValidation {
  let chapter: NatalChapter;
  if (input.chapter === "scenario") {
    const value = extractJson(raw);
    if (typeof value !== "object" || value === null) return { ok: false, reason: "not_json" };
    const read = readScenario(value as Record<string, unknown>);
    if (!read.ok) return read;
    chapter = { id: input.chapter, source: "ai", scenario: read.scenario };
  } else {
    const read = readProse(raw, NATAL_PROSE_LIMITS);
    if (!read.ok) return read;
    chapter = { id: input.chapter, source: "ai", paragraphs: read.paragraphs };
  }
  const text = [...(chapter.paragraphs ?? []), ...Object.values(chapter.scenario ?? {})].join("\n");
  if (findStopPhrases(text).length > 0) return { ok: false, reason: "stop_words" };
  return { ok: true, chapter };
}
