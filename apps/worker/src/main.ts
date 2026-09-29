import { LILA_QUEUES, QUEUES, type ConclusionJob, type GenerateReportJob, type GuideMoveJob } from "@oracle/core";
import { createDb } from "@oracle/db";
import { PgBoss } from "pg-boss";
import { createWriter, limitConcurrency } from "./ai";
import { readWorkerEnv } from "./env";
import { runGenerate } from "./generate";
import { runConclusion, runGuideMove } from "./lila";
import { log } from "./log";

const SHUTDOWN_TIMEOUT_MS = 20_000;

const env = readWorkerEnv();
const db = createDb(env.DATABASE_URL, { maxConnections: env.poolMax });
// Один ограничитель на все очереди: запросов к модели одновременно не больше AI_CONCURRENCY
const writer = limitConcurrency(createWriter(env.ai, fetch), env.aiConcurrency);

const boss = new PgBoss({ connectionString: env.DATABASE_URL, max: env.poolMax });
boss.on("error", (error) => log("error", "pg-boss error", { error: String(error) }));
await boss.start();
await boss.createQueue(QUEUES.generateReport);
await boss.createQueue(LILA_QUEUES.guideMove);
await boss.createQueue(LILA_QUEUES.conclusion);

await boss.work<GenerateReportJob>(QUEUES.generateReport, async ([job]) => {
  if (!job) return;
  try {
    await runGenerate(job.data, { db, writer, log, concurrency: env.aiConcurrency });
  } catch (error) {
    // pg-boss пометит задачу для повтора, но в лог контейнера без этого ничего не попадёт.
    // У ошибок Drizzle в тексте только запрос, а причина (ECONNRESET, нарушение ограничения) лежит в cause
    log("warn", "generate job failed", { purchaseId: job.data.purchaseId, error: String(error), cause: error instanceof Error ? String(error.cause) : undefined });
    throw error;
  }
});

await boss.work<GuideMoveJob>(LILA_QUEUES.guideMove, async ([job]) => {
  if (!job) return;
  try {
    await runGuideMove(job.data, { db, writer, log });
  } catch (error) {
    log("warn", "guide job failed", { gameId: job.data.gameId, n: job.data.n, error: String(error) });
    throw error;
  }
});

await boss.work<ConclusionJob>(LILA_QUEUES.conclusion, async ([job]) => {
  if (!job) return;
  try {
    await runConclusion(job.data, { db, writer, log });
  } catch (error) {
    log("warn", "conclusion job failed", { gameId: job.data.gameId, error: String(error) });
    throw error;
  }
});

log("info", "worker started", { ai: env.ai.provider });

let stopping = false;
async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  log("info", "worker stopping", { signal });
  await boss.stop({ graceful: true, timeout: SHUTDOWN_TIMEOUT_MS });
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
