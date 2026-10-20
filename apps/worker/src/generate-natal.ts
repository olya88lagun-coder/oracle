import { fallbackNatalReport } from "@oracle/ai";
import type { GenerateNatalReportJob } from "@oracle/core";
import { computeNatalChart } from "@oracle/core/natal";
import { findPaidPurchase, getPurchase, getReport, saveReport, type Database } from "@oracle/db";
import type { Logger } from "./log";

export type GenerateNatalDeps = { db: Database; log: Logger };

// Натальный разбор: карта считается из снимка данных рождения в покупке, главы собираются из готовых текстов.
// В лог попадают только id покупки и причины: дата, время, место и e-mail — никогда
export async function runGenerateNatal(job: GenerateNatalReportJob, deps: GenerateNatalDeps): Promise<void> {
  if (await getReport(deps.db, job.purchaseId)) return;
  const purchase = await getPurchase(deps.db, job.purchaseId);
  const natal = purchase?.natalInput ?? null;
  if (!purchase || purchase.status !== "succeeded" || !natal) {
    deps.log("info", "natal report skipped", { purchaseId: job.purchaseId, reason: !purchase ? "no_purchase" : purchase.status !== "succeeded" ? "not_paid" : "data_deleted" });
    return;
  }
  // Сайт не ставит задачу для второй оплаты тех же данных; проверяем ещё раз — задачу могли поставить до того, как нашлась первая
  const first = await findPaidPurchase(deps.db, { userId: purchase.userId, product: purchase.product, birthDate: natal.date, inputKey: purchase.inputKey });
  if (first && first.id !== purchase.id) {
    deps.log("warn", "duplicate paid purchase — refund manually", { purchaseId: purchase.id });
    return;
  }
  const chart = computeNatalChart({ instant: new Date(natal.instant), latitude: natal.latitude, longitude: natal.longitude, timeKnown: true });
  const chapters = fallbackNatalReport(chart);
  const { created } = await saveReport(deps.db, { purchaseId: purchase.id, chapters });
  deps.log("info", "natal report generated", { purchaseId: purchase.id, created, sources: chapters.map((chapter) => chapter.source) });
}
