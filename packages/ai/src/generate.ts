import type { Matrix } from "@oracle/core";
import { fallbackChapter } from "./fallback";
import { buildChapterInputs, buildScenarioInput, type ChapterInput } from "./input";
import { buildPrompt } from "./prompt";
import { describeAnswer, validateChapter } from "./validate";
import type { GeneratedChapter, Prompt, ReportWriter } from "./writer";

export type GenerateLog = (message: string, extra: Record<string, unknown>) => void;
export type GenerateOptions = { timeoutMs?: number; attempts?: number; concurrency?: number; log?: GenerateLog };

export const GENERATION_TIMEOUT_MS = 60_000;
export const GENERATION_ATTEMPTS = 3;
// Бесплатный тариф GigaChat принимает один запрос за раз, поэтому по умолчанию главы пишутся по очереди
export const GENERATION_CONCURRENCY = 1;

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
    let facts: Record<string, unknown> = {};
    try {
      const raw = await completeWithTimeout(writer, prompt, options.timeoutMs ?? GENERATION_TIMEOUT_MS);
      const checked = validateChapter(input, raw);
      if (checked.ok) return checked.chapter;
      reason = checked.reason;
      facts = describeAnswer(raw);
    } catch (error) {
      reason = error instanceof TimeoutError ? "timeout" : `error: ${String(error)}`;
    }
    // Текст ответа в лог не пишется: в нём может оказаться то, что проверка как раз не пропустила; только размеры и края
    options.log?.("chapter attempt rejected", { chapter: input.chapter, writer: writer.name, attempt, reason, ...facts });
  }
  return fallbackChapter(input);
}

const opening = (chapter: GeneratedChapter) => chapter.paragraphs?.[0] ?? "";

// Порядок результатов совпадает с порядком входа; одновременно идёт не больше `limit` задач
async function mapLimited<T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker));
  return results;
}

export async function generateReport(writer: ReportWriter | null, matrix: Matrix, options: GenerateOptions = {}): Promise<GeneratedChapter[]> {
  const chapters = await mapLimited(buildChapterInputs(matrix), options.concurrency ?? GENERATION_CONCURRENCY, (input) => generateChapter(writer, input, options));
  const scenario = await generateChapter(writer, buildScenarioInput(matrix, chapters.map(opening)), options);
  return [...chapters, scenario];
}
