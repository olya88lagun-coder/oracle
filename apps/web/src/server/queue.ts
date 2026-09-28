import { GENERATE_JOB_OPTIONS, generateReportJobKey, QUEUES, type GenerateReportJob } from "@oracle/core";
import { jobIdFor } from "@oracle/db";
import { PgBoss } from "pg-boss";
import { getEnv } from "./env";

const holder = globalThis as typeof globalThis & { __oracleQueue?: Promise<PgBoss> };

function queue(): Promise<PgBoss> {
  holder.__oracleQueue ??= (async () => {
    // Только отправка: схему pg-boss и очередь создаёт воркер
    const boss = new PgBoss({ connectionString: getEnv().DATABASE_URL, max: 1, supervise: false, schedule: false, migrate: false });
    boss.on("error", (error) => console.error("queue error", String(error)));
    await boss.start();
    return boss;
  })().catch((error: unknown) => {
    holder.__oracleQueue = undefined;
    throw error;
  });
  return holder.__oracleQueue;
}

export async function enqueueGenerate(job: GenerateReportJob): Promise<void> {
  try {
    const boss = await queue();
    // Одинаковый id задачи для одной покупки: повторная постановка со страницы ожидания не создаст дубль
    await boss.send(QUEUES.generateReport, job, { ...GENERATE_JOB_OPTIONS, id: jobIdFor(generateReportJobKey(job)) });
  } catch (error) {
    // Оплата уже зафиксирована; страница ожидания поставит задачу заново
    console.error("enqueue generate failed", { purchaseId: job.purchaseId, error: String(error) });
  }
}
