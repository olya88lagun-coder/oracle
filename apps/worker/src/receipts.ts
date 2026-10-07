import type { ReceiptsReminderJob } from "@oracle/core";
import { summarizeReceiptsToSend, type Database } from "@oracle/db";
import type { Logger } from "./log";
import type { Sender } from "./senders";

export type ReceiptsDeps = { db: Database; send: Sender | null; ownerVkId: string | null; appUrl: string | null; log: Logger };

const KOPECKS_IN_RUBLE = 100;

export const receiptsReminderText = (count: number, totalKopecks: number, url: string): string =>
  `Оракул: чеков к отправке: ${count} на ${(totalKopecks / KOPECKS_IN_RUBLE).toLocaleString("ru-RU")} ₽. Открыть: ${url}`;

// Число и сумма считаются в момент отправки: в окне могло накопиться несколько оплат. Данных покупателей в сообщении нет
export async function runReceiptsReminder(job: ReceiptsReminderJob, deps: ReceiptsDeps): Promise<void> {
  const { send, ownerVkId, appUrl, log } = deps;
  if (!send || !ownerVkId || !appUrl) {
    log("warn", "receipts reminder is not configured", { bucket: job.bucket, sender: send !== null, owner: ownerVkId !== null, appUrl: appUrl !== null });
    return;
  }
  const { count, totalKopecks } = await summarizeReceiptsToSend(deps.db);
  if (count === 0) return;
  const outcome = await send(ownerVkId, receiptsReminderText(count, totalKopecks, new URL("/admin/receipts", appUrl).toString()));
  // Отказ ВК (сообщения от сообщества не разрешены) повтором не лечится, временный сбой — лечится
  if (outcome === "rejected") log("warn", "receipts reminder refused by VK: the owner has not allowed messages from the community", { bucket: job.bucket });
  if (outcome === "failed") throw new Error("receipts reminder delivery failed");
}
