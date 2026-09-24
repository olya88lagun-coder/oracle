import { describe, expect, test } from "vitest";
import { readEnv } from "./env";

const VALID = {
  APP_URL: "https://oracle.test",
  DATABASE_URL: "postgres://u:p@db:5432/oracle",
  SESSION_SECRET: "x".repeat(32),
  VK_CLIENT_ID: "54770000",
};

describe("readEnv", () => {
  test("accepts a complete environment and drops unrelated variables", () => {
    expect(readEnv({ ...VALID, PATH: "/usr/bin" })).toEqual(VALID);
  });

  test("names the invalid variables without printing their values", () => {
    const run = () => readEnv({ ...VALID, SESSION_SECRET: "short", VK_CLIENT_ID: undefined });

    expect(run).toThrow(/SESSION_SECRET/);
    expect(run).toThrow(/VK_CLIENT_ID/);
    expect(run).not.toThrow(/short/);
  });
});
