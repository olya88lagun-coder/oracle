import { generateReport, type ReportWriter } from "@oracle/ai";
import { calculateMatrix, parseBirthDate, type GenerateReportJob } from "@oracle/core";
import { findPaidPurchase, getPurchase, getReport, saveReport, type Database } from "@oracle/db";
import type { Logger } from "./log";

export type GenerateDeps = { db: Database; writer: ReportWriter | null; log: Logger; now?: () => Date };

export async function runGenerate(job: GenerateReportJob, deps: GenerateDeps): Promise<void> {
  if (await getReport(deps.db, job.purchaseId)) return;
  const purchase = await getPurchase(deps.db, job.purchaseId);
  if (!purchase || purchase.status !== "succeeded" || purchase.birthDate === null) {
    deps.log("info", "report skipped", { purchaseId: job.purchaseId, reason: !purchase ? "no_purchase" : purchase.status !== "succeeded" ? "not_paid" : "data_deleted" });
    return;
  }
  // Сайт не ставит задачу для второй оплаты той же даты; проверяем ещё раз — задачу могли поставить до того, как нашлась первая
  const first = await findPaidPurchase(deps.db, { userId: purchase.userId, product: purchase.product, birthDate: purchase.birthDate });
  if (first && first.id !== purchase.id) {
    deps.log("warn", "duplicate paid purchase — refund manually", { purchaseId: purchase.id });
    return;
  }
  // Дата из покупки уже проверялась при сохранении в портрет; прошлые даты не устаревают, поэтому «сегодня» не важно
  const birthDate = parseBirthDate(purchase.birthDate, (deps.now ?? (() => new Date()))());
  if (!birthDate) {
    deps.log("error", "report skipped", { purchaseId: purchase.id, reason: "bad_birth_date" });
    return;
  }
  const chapters = await generateReport(deps.writer, calculateMatrix(birthDate), {
    log: (message, extra) => deps.log("warn", message, { purchaseId: purchase.id, ...extra }),
  });
  const { created } = await saveReport(deps.db, { purchaseId: purchase.id, chapters });
  deps.log("info", "report generated", { purchaseId: purchase.id, created, sources: chapters.map((chapter) => chapter.source) });
}
