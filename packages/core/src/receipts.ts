// Чек «Мой налог» владелица отправляет вручную (ЮKassa прекратила передавать чеки самозанятых), поэтому после оплаты ей уходит напоминание
export const RECEIPTS_QUEUE = "receipts-pending";
export type ReceiptsReminderJob = { bucket: number };

// Напоминание не критично: одна повторная попытка, и всё
export const RECEIPTS_JOB_OPTIONS = { retryLimit: 2, retryDelay: 60, expireInSeconds: 300 } as const;

// Серия оплат подряд даёт одно сообщение: задача на окно ставится один раз (по ключу) и откладывается до конца окна,
// чтобы в сообщение попали и оплаты, пришедшие позже первой
export const RECEIPTS_REMINDER_WINDOW_MS = 600_000;

export const receiptsReminderJobKey = (job: ReceiptsReminderJob): string => `receipts-pending:${job.bucket}`;

export function receiptsReminderWindow(now: Date): { bucket: number; delaySeconds: number } {
  const bucket = Math.floor(now.getTime() / RECEIPTS_REMINDER_WINDOW_MS);
  const endsAt = (bucket + 1) * RECEIPTS_REMINDER_WINDOW_MS;
  return { bucket, delaySeconds: Math.max(1, Math.ceil((endsAt - now.getTime()) / 1000)) };
}
