import { SCENARIO_FIELDS, type ScenarioField } from "@oracle/core";
import { findStopPhrases } from "@oracle/content";
import type { ChapterInput } from "./input";
import { PROSE_LIMITS, SCENARIO_FIELD_MAX_CHARS } from "./prompt";
import type { GeneratedChapter } from "./writer";

export type ProseLimits = { minParagraphs: number; maxParagraphs: number; minChars: number; maxChars: number };
export type ValidationFailure = "not_json" | "schema" | "length" | "stop_words" | "missing_data" | "gendered" | "filler" | "occupation" | "vague" | "repeat";
export type Validation = { ok: true; chapter: GeneratedChapter } | { ok: false; reason: ValidationFailure };

// Модель часто пишет абзацы с настоящими переводами строки внутри строк JSON; для JSON.parse это ошибка
const CONTROL_ESCAPES: Readonly<Record<string, string>> = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };

function escapeControlCharsInStrings(json: string): string {
  let inString = false;
  let escaped = false;
  let out = "";
  for (const char of json) {
    if (inString && char < " ") out += CONTROL_ESCAPES[char] ?? " ";
    else out += char;
    if (escaped) escaped = false;
    else if (char === "\\") escaped = inString;
    else if (char === '"') inString = !inString;
  }
  return out;
}

// Модель иногда оборачивает JSON в ```json или добавляет фразу до и после
export function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return undefined;
  const candidate = raw.slice(start, end + 1);
  for (const text of [candidate, escapeControlCharsInStrings(candidate)]) {
    try {
      return JSON.parse(text);
    } catch {
      // пробуем следующий вариант
    }
  }
  return undefined;
}

// Что можно записать в лог об отклонённом ответе: размеры и по нескольку знаков с краёв.
// Во входе модели нет личных данных, поэтому эти знаки безопасны; целиком текст в лог не идёт
export function describeAnswer(raw: string): Record<string, unknown> {
  const facts: Record<string, unknown> = { chars: raw.length, head: raw.slice(0, 16), tail: raw.slice(-16) };
  const found = proseParagraphs(raw);
  if (found.ok) {
    const paragraphs = found.items.filter((item): item is string => typeof item === "string");
    facts.paragraphs = paragraphs.length;
    facts.textChars = paragraphs.join("").length;
  }
  return facts;
}

const cleanText = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

export const MARKDOWN_START = /^(#{1,6}\s|[-*•]\s|\d+[.)]\s)/;

// Абзацы разделены пустой строкой; если модель поставила только одиночные переводы строк, абзацем считается строка
export function splitParagraphs(text: string): string[] {
  const clean = text.trim();
  const join = (block: string) => block.replace(/\s*\n\s*/g, " ").trim();
  const byBlankLine = clean.split(/\n\s*\n/).map(join).filter(Boolean);
  const byLine = clean.split("\n").map((line) => line.trim()).filter(Boolean);
  return byBlankLine.length >= PROSE_LIMITS.minParagraphs || byBlankLine.length >= byLine.length ? byBlankLine : byLine;
}

// Глава приходит обычным текстом; JSON вида {"paragraphs": [...]} тоже принимаем — так отвечали ранние версии промпта
function proseParagraphs(raw: string): { ok: true; items: unknown[] } | { ok: false; reason: ValidationFailure } {
  const trimmed = raw.replace(/^```\w*\s*$/gm, "").trim();
  if (!trimmed) return { ok: false, reason: "not_json" };
  if (trimmed.startsWith("{")) {
    const value = extractJson(trimmed);
    if (typeof value !== "object" || value === null) return { ok: false, reason: "not_json" };
    const paragraphs = (value as { paragraphs?: unknown }).paragraphs;
    return Array.isArray(paragraphs) ? { ok: true, items: paragraphs } : { ok: false, reason: "schema" };
  }
  const items = splitParagraphs(trimmed);
  if (items.some((item) => MARKDOWN_START.test(item) || item.includes("**"))) return { ok: false, reason: "schema" };
  return { ok: true, items };
}

// limits — границы длины главы: у разбора матрицы и у натального разбора они разные
export function readProse(raw: string, limits: ProseLimits = PROSE_LIMITS): { ok: true; paragraphs: string[] } | { ok: false; reason: ValidationFailure } {
  const found = proseParagraphs(raw);
  if (!found.ok) return found;
  const paragraphs = found.items.map(cleanText);
  if (paragraphs.some((paragraph) => paragraph === null)) return { ok: false, reason: "schema" };
  const texts = paragraphs as string[];
  const chars = texts.join("").length;
  if (texts.length < limits.minParagraphs || texts.length > limits.maxParagraphs) return { ok: false, reason: "length" };
  if (chars < limits.minChars || chars > limits.maxChars) return { ok: false, reason: "length" };
  return { ok: true, paragraphs: texts };
}

// GigaChat ставит лишнюю «}» перед закрывающей кавычкой значения ("…силы?}"): JSON при этом верный, но вопрос не кончался на «?»,
// и все три попытки итоговой главы отклонялись, так что «Ваш сценарий» всегда уходил в запасной текст
const withoutStrayBrace = (value: unknown): unknown => (typeof value === "string" ? value.replace(/\s*\}+\s*$/, "") : value);

export function readScenario(value: Record<string, unknown>): { ok: true; scenario: Record<ScenarioField, string> } | { ok: false; reason: ValidationFailure } {
  const fields = SCENARIO_FIELDS.map((field) => [field, cleanText(withoutStrayBrace(value[field]))] as const);
  if (fields.some(([, text]) => text === null)) return { ok: false, reason: "schema" };
  const scenario = Object.fromEntries(fields) as Record<ScenarioField, string>;
  if (!scenario.question.endsWith("?")) return { ok: false, reason: "schema" };
  if (Object.values(scenario).some((text) => text.length > SCENARIO_FIELD_MAX_CHARS)) return { ok: false, reason: "length" };
  return { ok: true, scenario };
}

export function validateChapter(input: ChapterInput, raw: string): Validation {
  let read: ReturnType<typeof readProse> | ReturnType<typeof readScenario>;
  if (input.chapter === "scenario") {
    const value = extractJson(raw);
    if (typeof value !== "object" || value === null) return { ok: false, reason: "not_json" };
    read = readScenario(value as Record<string, unknown>);
  } else {
    read = readProse(raw);
  }
  if (!read.ok) return read;
  const chapter: GeneratedChapter =
    "scenario" in read ? { id: input.chapter, source: "ai", scenario: read.scenario } : { id: input.chapter, source: "ai", paragraphs: read.paragraphs };
  const text = [...(chapter.paragraphs ?? []), ...Object.values(chapter.scenario ?? {})].join("\n");
  if (findStopPhrases(text).length > 0) return { ok: false, reason: "stop_words" };
  if ((text.match(FILLER) ?? []).length > 0 || IMPORTANT_FORMULA.test(text)) return { ok: false, reason: "filler" };
  if (input.chapter === "scenario" && chapter.scenario && !concreteExperiment(chapter.scenario.experiment)) return { ok: false, reason: "vague" };
  const sources = input.arcana.flatMap((arcanum) => Object.values(arcanum.blocks).flat());
  if (input.chapter !== "scenario" && repeatsSource(sources, text)) return { ok: false, reason: "repeat" };
  return { ok: true, chapter };
}

const FILLER = /(?<![а-яё])(стоит|следует|важно|интересно|необходимо)\s+(заметить|отметить)(?![а-яё])|(?<![а-яё])таким\s+образом(?![а-яё])/i;
const IMPORTANT_FORMULA = /(?<![а-яё])важно\s+(?:помнить|осознавать|отметить|понимать|замечать)(?![а-яё])/i;
const EXPERIMENT_TIME = /\d{1,2}[:.]\d{2}|утр|вечер|перед сном/;
const EXPERIMENT_PLACE = /стол|кроват|кухн|дорог|душ|прогул|окн|блокнот|тетрад|телефон|кресл|комнат/;
const VAGUE_EXPERIMENT = /одно\s+(?:простое|небольшое)\s+действие|выполняйте\s+одно|семь\s+дней\s+подряд\s+—\s+одно/i;

export function concreteExperiment(text: string): boolean {
  return EXPERIMENT_TIME.test(text) && EXPERIMENT_PLACE.test(text) && !VAGUE_EXPERIMENT.test(text);
}

function normWords(text: string): string[] {
  return text.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, " ").split(" ").filter((word) => word.length > 3);
}

// Восемь подряд идущих слов из готового текста: глава пересказывает бесплатную страницу, а не собирает свой вывод
export function repeatsSource(sources: readonly string[], answer: string): boolean {
  const haystack = ` ${normWords(answer).join(" ")} `;
  for (const source of sources) {
    const words = normWords(source);
    for (let index = 0; index + 8 <= words.length; index += 1) {
      const slice = words.slice(index, index + 8).join(" ");
      if (slice.length >= 40 && haystack.includes(` ${slice} `)) return true;
    }
  }
  return false;
}
