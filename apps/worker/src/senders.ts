import type { Logger } from "./log";

export type SendOutcome = "sent" | "rejected" | "failed";
export type Sender = (vkUserId: string, text: string) => Promise<SendOutcome>;

// Локально сообщения не уходят наружу: токен сообщества в .env не нужен
export function dryRunSender(log: Logger): Sender {
  return async (vkUserId, text) => {
    log("info", "dry run notification", { vkUserIdLength: vkUserId.length, text });
    return "sent";
  };
}
