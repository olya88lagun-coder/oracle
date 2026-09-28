import { QUEUES, type GenerateReportJob } from "@oracle/core";
import { createDb } from "@oracle/db";
import { PgBoss } from "pg-boss";
import { createWriter } from "./ai";
import { readWorkerEnv } from "./env";
import { runGenerate } from "./generate";
import { log } from "./log";

const SHUTDOWN_TIMEOUT_MS = 20_000;

const env = readWorkerEnv();
const db = createDb(env.DATABASE_URL, { maxConnections: env.poolMax });
const writer = createWriter(env.ai, fetch);

const boss = new PgBoss({ connectionString: env.DATABASE_URL, max: env.poolMax });
boss.on("error", (error) => log("error", "pg-boss error", { error: String(error) }));
await boss.start();
await boss.createQueue(QUEUES.generateReport);

await boss.work<GenerateReportJob>(QUEUES.generateReport, async ([job]) => {
  if (!job) return;
  try {
    await runGenerate(job.data, { db, writer, log });
  } catch (error) {
    // pg-boss пометит задачу для повтора, но в лог контейнера без этого ничего не попадёт.
    // У ошибок Drizzle в тексте только запрос, а причина (ECONNRESET, нарушение ограничения) лежит в cause
    log("warn", "generate job failed", { purchaseId: job.data.purchaseId, error: String(error), cause: error instanceof Error ? String(error.cause) : undefined });
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
