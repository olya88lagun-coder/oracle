import { expect, test } from "vitest";
import { createWriter } from "./ai";
import { readWorkerEnv } from "./env";

const BASE = { DATABASE_URL: "postgres://u:p@db/oracle" };

test("works without an AI provider — reports are built from the blocks", () => {
  expect(readWorkerEnv(BASE)).toEqual({
    DATABASE_URL: BASE.DATABASE_URL,
    poolMax: 3,
    ai: { provider: "none" },
    aiConcurrency: 1,
    receipts: { ownerVkId: null, appUrl: null, vkGroupToken: null, dryRun: false },
  });
  expect(createWriter({ provider: "none" }, fetch)).toBeNull();
});

test("reads GigaChat with its defaults", () => {
  const env = readWorkerEnv({ ...BASE, AI_PROVIDER: "gigachat", GIGACHAT_AUTH_KEY: "auth", DATABASE_POOL_MAX: "1" });

  expect(env.ai).toEqual({ provider: "gigachat", authKey: "auth", scope: "GIGACHAT_API_PERS", model: "GigaChat" });
  expect(env.poolMax).toBe(1);
  expect(createWriter(env.ai, fetch)?.name).toBe("gigachat");
});

test("chapters are written one at a time unless AI_CONCURRENCY says otherwise", () => {
  expect(readWorkerEnv({ ...BASE, AI_CONCURRENCY: "3" }).aiConcurrency).toBe(3);
  expect(() => readWorkerEnv({ ...BASE, AI_CONCURRENCY: "0" })).toThrow(/AI_CONCURRENCY/);
});

test("names missing or invalid variables without printing values", () => {
  expect(() => readWorkerEnv({ ...BASE, AI_PROVIDER: "gigachat" })).toThrow(/GIGACHAT_AUTH_KEY/);
  const run = () => readWorkerEnv({ DATABASE_URL: "", AI_PROVIDER: "secret-provider" });
  expect(run).toThrow(/DATABASE_URL/);
  expect(run).toThrow(/AI_PROVIDER/);
  expect(run).not.toThrow(/secret-provider/);
});

test("reads what the receipts reminder needs, and names an invalid owner id or site address", () => {
  const env = readWorkerEnv({ ...BASE, OWNER_VK_ID: "555", APP_URL: "https://tvoy-orakul.ru", VK_GROUP_TOKEN: "vk-token", NOTIFICATIONS_DRY_RUN: "1" });

  expect(env.receipts).toEqual({ ownerVkId: "555", appUrl: "https://tvoy-orakul.ru", vkGroupToken: "vk-token", dryRun: true });
  expect(() => readWorkerEnv({ ...BASE, OWNER_VK_ID: "vk:555" })).toThrow(/OWNER_VK_ID/);
  expect(() => readWorkerEnv({ ...BASE, APP_URL: "not a url" })).toThrow(/APP_URL/);
});
