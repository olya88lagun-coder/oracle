import { describe, expect, test } from "vitest";
import { readEnv } from "./env";

const VALID = {
  APP_URL: "https://oracle.test",
  DATABASE_URL: "postgres://u:p@db:5432/oracle",
  SESSION_SECRET: "x".repeat(32),
  VK_CLIENT_ID: "54770000",
};

describe("readEnv", () => {
  test("accepts a complete environment, drops unrelated variables and keeps sales off", () => {
    expect(readEnv({ ...VALID, PATH: "/usr/bin" })).toEqual({ ...VALID, payments: null, paidReports: false });
  });

  test("names the invalid variables without printing their values", () => {
    const run = () => readEnv({ ...VALID, SESSION_SECRET: "short", VK_CLIENT_ID: undefined });

    expect(run).toThrow(/SESSION_SECRET/);
    expect(run).toThrow(/VK_CLIENT_ID/);
    expect(run).not.toThrow(/short/);
  });

  test("reads YooKassa keys and the sales switch", () => {
    const env = readEnv({ ...VALID, PAYMENTS: "yookassa", YOOKASSA_SHOP_ID: "123456", YOOKASSA_SECRET_KEY: "live_secret", PAID_REPORTS: "on" });

    expect(env.payments).toEqual({ kind: "yookassa", shopId: "123456", secretKey: "live_secret" });
    expect(env.paidReports).toBe(true);
  });

  test("requires both YooKassa keys and names the missing one", () => {
    const run = () => readEnv({ ...VALID, PAYMENTS: "yookassa", YOOKASSA_SHOP_ID: "123456" });

    expect(run).toThrow(/YOOKASSA_SECRET_KEY/);
    expect(run).not.toThrow(/YOOKASSA_SHOP_ID/);
  });

  test("allows fake payments only next to the dev login and never in production", () => {
    expect(readEnv({ ...VALID, PAYMENTS: "fake", DEV_LOGIN: "1" }).payments).toEqual({ kind: "fake" });
    expect(() => readEnv({ ...VALID, PAYMENTS: "fake" })).toThrow(/PAYMENTS/);
    expect(() => readEnv({ ...VALID, PAYMENTS: "fake", DEV_LOGIN: "1", NODE_ENV: "production" })).toThrow(/PAYMENTS/);
  });
});
