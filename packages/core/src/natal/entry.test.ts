import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("natal entry point", () => {
  test("the main @oracle/core entry does not import the natal module, so astronomy-engine stays out of other pages", () => {
    const index = readFileSync(new URL("../index.ts", import.meta.url), "utf8");
    expect(index).not.toMatch(/natal|astronomy-engine/);
  });
});
