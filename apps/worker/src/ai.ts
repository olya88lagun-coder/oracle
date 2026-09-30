import { createGigaChatWriter, type ReportWriter } from "@oracle/ai";
import type { AiConfig } from "./env";

// Без провайдера разборы собираются из блоков — так работают локальная разработка и сквозные тесты
export function createWriter(config: AiConfig, fetchFn: typeof fetch): ReportWriter | null {
  if (config.provider === "gigachat") return createGigaChatWriter({ authKey: config.authKey, scope: config.scope, model: config.model, fetchFn });
  return null;
}

// Бесплатный тариф GigaChat принимает один запрос за раз, а очередей несколько (разборы, абзацы, итоги): общий ограничитель на writer
export function limitConcurrency(writer: ReportWriter | null, limit: number): ReportWriter | null {
  if (!writer) return null;
  let running = 0;
  const waiting: (() => void)[] = [];
  const acquire = (): Promise<void> => {
    if (running < limit) {
      running += 1;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) =>
      waiting.push(() => {
        running += 1;
        resolve();
      }),
    );
  };
  const release = () => {
    running -= 1;
    waiting.shift()?.();
  };
  return {
    name: writer.name,
    async complete(prompt, signal) {
      await acquire();
      try {
        return await writer.complete(prompt, signal);
      } finally {
        release();
      }
    },
  };
}
