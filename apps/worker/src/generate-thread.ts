import { numerologyText } from "@oracle/content/numerology";
import { buildThreadReport, type ThreadTextReader } from "@oracle/content/thread-report";
import { calculateLifeThread, type GenerateThreadReportJob } from "@oracle/core";
import { findPaidPurchase, getPurchase, getReport, saveReport, type Database } from "@oracle/db";
import type { Logger } from "./log";

// now и read подменяются в тестах: настоящие тексты месяцев, прошлого и правил приходят отдельной партией
export type GenerateThreadDeps = { db: Database; log: Logger; now?: () => Date; read?: ThreadTextReader };

// Разбор нити: считается по дате рождения из покупки, главы собираются из готовых текстов без ИИ.
// Нет принятых текстов — сборщик бросает ошибку, и задача падает (повтор или отказ), а не сохраняет неполный разбор.
// В лог попадают только id покупки и причины: дата, e-mail и текст глав — никогда
export async function runGenerateThread(job: GenerateThreadReportJob, deps: GenerateThreadDeps): Promise<void> {
  if (await getReport(deps.db, job.purchaseId)) return;
  const purchase = await getPurchase(deps.db, job.purchaseId);
  const birthDate = purchase?.birthDate ?? null;
  if (!purchase || purchase.status !== "succeeded" || !birthDate) {
    deps.log("info", "thread report skipped", { purchaseId: job.purchaseId, reason: !purchase ? "no_purchase" : purchase.status !== "succeeded" ? "not_paid" : "data_deleted" });
    return;
  }
  // Сайт не ставит задачу для второй оплаты той же даты; проверяем ещё раз — задачу могли поставить до того, как нашлась первая
  const first = await findPaidPurchase(deps.db, { userId: purchase.userId, product: purchase.product, birthDate, inputKey: null });
  if (first && first.id !== purchase.id) {
    deps.log("warn", "duplicate paid purchase — refund manually", { purchaseId: purchase.id });
    return;
  }
  const thread = calculateLifeThread(birthDate, (deps.now ?? (() => new Date()))());
  if (!thread) throw new Error("thread report: bad birth date");
  const chapters = buildThreadReport(thread, deps.read ?? numerologyText);
  const { created } = await saveReport(deps.db, { purchaseId: purchase.id, chapters });
  deps.log("info", "thread report generated", { purchaseId: purchase.id, created });
}
