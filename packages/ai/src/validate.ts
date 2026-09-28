import { SCENARIO_FIELDS, type ScenarioField } from "@oracle/core";
import { findStopPhrases } from "@oracle/content";
import type { ChapterInput } from "./input";
import { PROSE_LIMITS, SCENARIO_FIELD_MAX_CHARS } from "./prompt";
import type { GeneratedChapter } from "./writer";

export type ValidationFailure = "not_json" | "schema" | "length" | "stop_words";
export type Validation = { ok: true; chapter: GeneratedChapter } | { ok: false; reason: ValidationFailure };

// Модель иногда оборачивает JSON в ```json или добавляет фразу до и после
export function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return undefined;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

const cleanText = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

function readProse(value: Record<string, unknown>): { ok: true; paragraphs: string[] } | { ok: false; reason: ValidationFailure } {
  if (!Array.isArray(value.paragraphs)) return { ok: false, reason: "schema" };
  const paragraphs = value.paragraphs.map(cleanText);
  if (paragraphs.some((paragraph) => paragraph === null)) return { ok: false, reason: "schema" };
  const texts = paragraphs as string[];
  const chars = texts.join("").length;
  if (texts.length < PROSE_LIMITS.minParagraphs || texts.length > PROSE_LIMITS.maxParagraphs) return { ok: false, reason: "length" };
  if (chars < PROSE_LIMITS.minChars || chars > PROSE_LIMITS.maxChars) return { ok: false, reason: "length" };
  return { ok: true, paragraphs: texts };
}

function readScenario(value: Record<string, unknown>): { ok: true; scenario: Record<ScenarioField, string> } | { ok: false; reason: ValidationFailure } {
  const fields = SCENARIO_FIELDS.map((field) => [field, cleanText(value[field])] as const);
  if (fields.some(([, text]) => text === null)) return { ok: false, reason: "schema" };
  const scenario = Object.fromEntries(fields) as Record<ScenarioField, string>;
  if (!scenario.question.endsWith("?")) return { ok: false, reason: "schema" };
  if (Object.values(scenario).some((text) => text.length > SCENARIO_FIELD_MAX_CHARS)) return { ok: false, reason: "length" };
  return { ok: true, scenario };
}

export function validateChapter(input: ChapterInput, raw: string): Validation {
  const value = extractJson(raw);
  if (typeof value !== "object" || value === null) return { ok: false, reason: "not_json" };
  const record = value as Record<string, unknown>;
  const read = input.chapter === "scenario" ? readScenario(record) : readProse(record);
  if (!read.ok) return read;
  const chapter: GeneratedChapter =
    "scenario" in read ? { id: input.chapter, source: "ai", scenario: read.scenario } : { id: input.chapter, source: "ai", paragraphs: read.paragraphs };
  const text = [...(chapter.paragraphs ?? []), ...Object.values(chapter.scenario ?? {})].join("\n");
  if (findStopPhrases(text).length > 0) return { ok: false, reason: "stop_words" };
  return { ok: true, chapter };
}
