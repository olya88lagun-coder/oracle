import { LILA_CONCLUSION_CHAPTERS } from "@oracle/core";
import { completeWithTimeout, TimeoutError, type GenerateOptions } from "./generate";
import { fallbackConclusionChapter, type GeneratedConclusionChapter } from "./lila-fallback";
import { type buildConclusionInputs, type ConclusionInput, type GuideInput } from "./lila-input";
import { buildConclusionPrompt, buildGuidePrompt } from "./lila-prompt";
import { validateConclusionChapter, validateGuideText } from "./lila-validate";
import type { ReportWriter } from "./writer";

const GUIDE_TIMEOUT_MS = 25_000;
const GUIDE_ATTEMPTS = 2;
const CONCLUSION_TIMEOUT_MS = 60_000;
const CONCLUSION_ATTEMPTS = 3;

export async function generateGuideText(writer: ReportWriter | null, input: GuideInput, options: GenerateOptions = {}): Promise<string | null> {
  if (!writer) return null;
  const prompt = buildGuidePrompt(input);
  const attempts = options.attempts ?? GUIDE_ATTEMPTS;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let reason: string;
    try {
      const raw = await completeWithTimeout(writer, prompt, options.timeoutMs ?? GUIDE_TIMEOUT_MS);
      const checked = validateGuideText(raw);
      if (checked.ok) return checked.text;
      reason = checked.reason;
    } catch (error) {
      reason = error instanceof TimeoutError ? "timeout" : `error: ${String(error)}`;
    }
    // Текст ответа и вход в лог не пишутся: там намерение и записи игрока
    options.log?.("guide attempt rejected", { writer: writer.name, attempt, reason });
  }
  return null;
}

async function generateChapter(writer: ReportWriter | null, input: ConclusionInput, options: GenerateOptions): Promise<GeneratedConclusionChapter> {
  if (!writer) return fallbackConclusionChapter(input);
  const prompt = buildConclusionPrompt(input);
  const attempts = options.attempts ?? CONCLUSION_ATTEMPTS;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let reason: string;
    try {
      const raw = await completeWithTimeout(writer, prompt, options.timeoutMs ?? CONCLUSION_TIMEOUT_MS);
      const checked = validateConclusionChapter(raw);
      if (checked.ok) return { id: input.chapter, source: "ai", paragraphs: checked.paragraphs };
      reason = checked.reason;
    } catch (error) {
      reason = error instanceof TimeoutError ? "timeout" : `error: ${String(error)}`;
    }
    options.log?.("conclusion chapter attempt rejected", { chapter: input.chapter, writer: writer.name, attempt, reason });
  }
  return fallbackConclusionChapter(input);
}

// Главы пишутся по очереди: бесплатный тариф GigaChat принимает один запрос за раз; последняя глава опирается на начала прежних
export async function generateConclusion(writer: ReportWriter | null, base: ReturnType<typeof buildConclusionInputs>, options: GenerateOptions = {}): Promise<GeneratedConclusionChapter[]> {
  const chapters: GeneratedConclusionChapter[] = [];
  for (const id of LILA_CONCLUSION_CHAPTERS) {
    const earlier = chapters.map((chapter) => chapter.paragraphs[0] ?? "");
    chapters.push(await generateChapter(writer, { ...base[id], earlier }, options));
  }
  return chapters;
}
