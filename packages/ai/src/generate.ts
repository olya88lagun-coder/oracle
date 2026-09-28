import type { Matrix } from "@oracle/core";
import { fallbackChapter } from "./fallback";
import { buildChapterInputs, buildScenarioInput, type ChapterInput } from "./input";
import { buildPrompt } from "./prompt";
import { validateChapter } from "./validate";
import type { GeneratedChapter, Prompt, ReportWriter } from "./writer";

export type GenerateLog = (message: string, extra: Record<string, unknown>) => void;
export type GenerateOptions = { timeoutMs?: number; attempts?: number; log?: GenerateLog };

export const GENERATION_TIMEOUT_MS = 60_000;
export const GENERATION_ATTEMPTS = 3;

class TimeoutError extends Error {}

// Сигнал отменяет запрос у провайдера; гонка с таймером страхует, если провайдер сигнал не слушает
async function completeWithTimeout(writer: ReportWriter, prompt: Prompt, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError());
    }, timeoutMs);
  });
  try {
    return await Promise.race([writer.complete(prompt, controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function generateChapter(writer: ReportWriter | null, input: ChapterInput, options: GenerateOptions = {}): Promise<GeneratedChapter> {
  if (!writer) return fallbackChapter(input);
  const prompt = buildPrompt(input);
  const attempts = options.attempts ?? GENERATION_ATTEMPTS;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let reason: string;
    try {
      const checked = validateChapter(input, await completeWithTimeout(writer, prompt, options.timeoutMs ?? GENERATION_TIMEOUT_MS));
      if (checked.ok) return checked.chapter;
      reason = checked.reason;
    } catch (error) {
      reason = error instanceof TimeoutError ? "timeout" : `error: ${String(error)}`;
    }
    // Текст ответа в лог не пишется: в нём может оказаться то, что проверка как раз не пропустила
    options.log?.("chapter attempt rejected", { chapter: input.chapter, writer: writer.name, attempt, reason });
  }
  return fallbackChapter(input);
}

const opening = (chapter: GeneratedChapter) => chapter.paragraphs?.[0] ?? "";

export async function generateReport(writer: ReportWriter | null, matrix: Matrix, options: GenerateOptions = {}): Promise<GeneratedChapter[]> {
  const chapters = await Promise.all(buildChapterInputs(matrix).map((input) => generateChapter(writer, input, options)));
  const scenario = await generateChapter(writer, buildScenarioInput(matrix, chapters.map(opening)), options);
  return [...chapters, scenario];
}
