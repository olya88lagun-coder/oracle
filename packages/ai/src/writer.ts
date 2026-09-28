import type { ChapterId, ScenarioField } from "@oracle/core";

export type Prompt = { system: string; user: string };
export type ReportWriter = { readonly name: string; complete(prompt: Prompt, signal: AbortSignal): Promise<string> };

// Та же форма, что StoredChapter в @oracle/db: пакет ИИ не зависит от базы
export type GeneratedChapter = {
  id: ChapterId;
  source: "ai" | "fallback";
  paragraphs?: string[];
  scenario?: Record<ScenarioField, string>;
};
