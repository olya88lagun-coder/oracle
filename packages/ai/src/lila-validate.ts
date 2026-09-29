import { findStopPhrases } from "@oracle/content";
import { CONCLUSION_LIMITS, GUIDE_LIMITS } from "./lila-prompt";
import { MARKDOWN_START, splitParagraphs } from "./validate";

export type LilaValidationFailure = "empty" | "format" | "length" | "stop_words";

const clean = (raw: string) => raw.replace(/^```\w*\s*$/gm, "").trim();
const looksFormatted = (paragraphs: readonly string[], raw: string) => raw.startsWith("{") || paragraphs.some((item) => MARKDOWN_START.test(item) || item.includes("**"));

export function validateGuideText(raw: string): { ok: true; text: string } | { ok: false; reason: LilaValidationFailure } {
  const text = clean(raw);
  if (!text) return { ok: false, reason: "empty" };
  const paragraphs = splitParagraphs(text);
  if (looksFormatted(paragraphs, text) || paragraphs.length > GUIDE_LIMITS.maxParagraphs) return { ok: false, reason: "format" };
  const joined = paragraphs.join("\n\n");
  if (joined.length < GUIDE_LIMITS.minChars || joined.length > GUIDE_LIMITS.maxChars) return { ok: false, reason: "length" };
  if (findStopPhrases(joined).length > 0) return { ok: false, reason: "stop_words" };
  return { ok: true, text: joined };
}

export function validateConclusionChapter(raw: string): { ok: true; paragraphs: string[] } | { ok: false; reason: LilaValidationFailure } {
  const text = clean(raw);
  if (!text) return { ok: false, reason: "empty" };
  const paragraphs = splitParagraphs(text);
  if (looksFormatted(paragraphs, text)) return { ok: false, reason: "format" };
  if (paragraphs.length < CONCLUSION_LIMITS.minParagraphs || paragraphs.length > CONCLUSION_LIMITS.maxParagraphs) {
    return { ok: false, reason: paragraphs.length < CONCLUSION_LIMITS.minParagraphs ? "format" : "length" };
  }
  const chars = paragraphs.join("").length;
  if (chars < CONCLUSION_LIMITS.minChars || chars > CONCLUSION_LIMITS.maxChars) return { ok: false, reason: "length" };
  if (findStopPhrases(paragraphs.join("\n")).length > 0) return { ok: false, reason: "stop_words" };
  return { ok: true, paragraphs };
}
