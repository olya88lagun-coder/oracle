import { createGigaChatWriter, type ReportWriter } from "@oracle/ai";
import type { AiConfig } from "./env";

// Без провайдера разборы собираются из блоков — так работают локальная разработка и сквозные тесты
export function createWriter(config: AiConfig, fetchFn: typeof fetch): ReportWriter | null {
  if (config.provider === "gigachat") return createGigaChatWriter({ authKey: config.authKey, scope: config.scope, model: config.model, fetchFn });
  return null;
}
