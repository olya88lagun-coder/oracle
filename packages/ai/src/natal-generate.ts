import type { NatalChart } from "@oracle/core/natal";
import { completeWithTimeout, GENERATION_ATTEMPTS, GENERATION_CONCURRENCY, GENERATION_TIMEOUT_MS, mapLimited, TimeoutError, type GenerateOptions } from "./generate";
import type { NatalChapter } from "./natal-fallback";
import { buildNatalChapterInputs, type NatalChapterInput } from "./natal-input";
import type { NatalBlocks } from "./natal-fallback";
import { buildNatalPrompt } from "./natal-prompt";
import { validateNatalChapter } from "./natal-validate";
import { describeAnswer, type ValidationFailure } from "./validate";
import type { ReportWriter } from "./writer";

// Глава без ИИ: вступление и готовые тексты как есть (так же собирает запасной вариант fallbackNatalReport); у итоговой главы — черновик полей
export function fallbackNatalChapter(input: NatalChapterInput): NatalChapter {
  if (input.scenarioDraft) return { id: input.chapter, source: "fallback", scenario: input.scenarioDraft };
  return { id: input.chapter, source: "fallback", paragraphs: [input.intro, ...input.material] };
}

// До трёх попыток; не прошёл проверку, истёк таймаут или ошибка провайдера — запасная глава. В лог не идёт ничего, кроме размеров и краёв ответа
export async function generateNatalChapter(writer: ReportWriter | null, input: NatalChapterInput, options: GenerateOptions = {}): Promise<NatalChapter> {
  if (!writer) return fallbackNatalChapter(input);
  const attempts = options.attempts ?? GENERATION_ATTEMPTS;
  let failure: ValidationFailure | undefined;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const prompt = buildNatalPrompt(input, failure);
    failure = undefined;
    let reason: string;
    let facts: Record<string, unknown> = {};
    try {
      const raw = await completeWithTimeout(writer, prompt, options.timeoutMs ?? GENERATION_TIMEOUT_MS);
      const checked = validateNatalChapter(input, raw);
      if (checked.ok) return checked.chapter;
      reason = checked.reason;
      failure = checked.reason;
      facts = describeAnswer(raw);
    } catch (error) {
      reason = error instanceof TimeoutError ? "timeout" : `error: ${String(error)}`;
    }
    options.log?.("natal chapter attempt rejected", { chapter: input.chapter, writer: writer.name, attempt, reason, ...facts });
  }
  return fallbackNatalChapter(input);
}

const opening = (chapter: NatalChapter) => chapter.paragraphs?.[0] ?? "";

// Главы 1–8 пишутся независимо (по `concurrency` одновременно), итоговая — после них: ей дают первые абзацы уже написанных глав
export async function generateNatalReport(writer: ReportWriter | null, chart: NatalChart, options: GenerateOptions = {}, blocks?: NatalBlocks): Promise<NatalChapter[]> {
  const inputs = buildNatalChapterInputs(chart, blocks);
  const scenario = inputs.find((input) => input.chapter === "scenario");
  const rest = inputs.filter((input) => input.chapter !== "scenario");
  const chapters = await mapLimited(rest, options.concurrency ?? GENERATION_CONCURRENCY, (input) => generateNatalChapter(writer, input, options));
  if (!scenario) return chapters;
  const last = await generateNatalChapter(writer, { ...scenario, previous: chapters.map(opening) }, options);
  return [...chapters, last];
}
