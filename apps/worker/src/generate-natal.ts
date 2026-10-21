import { generateNatalReport, type ReportWriter } from "@oracle/ai";
import type { GenerateNatalReportJob } from "@oracle/core";
import { computeNatalChart } from "@oracle/core/natal";
import { findPaidPurchase, getPurchase, getReport, saveReport, type Database } from "@oracle/db";
import type { Logger } from "./log";

// writer — ИИ-редактор глав; null (ключа нет или AI_PROVIDER=none) — главы собираются из готовых текстов без ИИ
export type GenerateNatalDeps = { db: Database; log: Logger; writer?: ReportWriter | null; concurrency?: number };

// Натальный разбор: карта считается из снимка данных рождения в покупке, главы собираются из готовых текстов, а ИИ-редактор связывает их в текст
// (не прошёл проверку — глава остаётся из готовых текстов). Модели уходят только знаки, дома, аспекты и общие тексты про них.
// В лог попадают только id покупки и причины: дата, время, место, e-mail и текст ответов — никогда
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
  const chapters = await generateNatalReport(deps.writer ?? null, chart, {
    concurrency: deps.concurrency,
    log: (message, extra) => deps.log("warn", message, { purchaseId: purchase.id, ...extra }),
  });
  const { created } = await saveReport(deps.db, { purchaseId: purchase.id, chapters });
  deps.log("info", "natal report generated", { purchaseId: purchase.id, created, sources: chapters.map((chapter) => chapter.source) });
}
