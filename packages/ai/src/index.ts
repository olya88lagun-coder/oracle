export { fallbackChapter } from "./fallback";
export { generateChapter, generateReport, GENERATION_ATTEMPTS, GENERATION_CONCURRENCY, GENERATION_TIMEOUT_MS, type GenerateLog, type GenerateOptions } from "./generate";
export { buildChapterInputs, buildScenarioInput, type ChapterArcanum, type ChapterInput } from "./input";
export { buildPrompt } from "./prompt";
export { createGigaChatWriter, GIGACHAT_CHAT_URL, GIGACHAT_OAUTH_URL } from "./providers/gigachat";
export { extractJson, validateChapter, type ValidationFailure } from "./validate";
export type { GeneratedChapter, Prompt, ReportWriter } from "./writer";
