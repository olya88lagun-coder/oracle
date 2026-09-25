import { describe, expect, test } from "vitest";
import { isDevLoginEnabled } from "./dev-login";

describe("isDevLoginEnabled", () => {
  test("works only when explicitly switched on outside production", () => {
    expect(isDevLoginEnabled({ DEV_LOGIN: "1", NODE_ENV: "development" })).toBe(true);
    expect(isDevLoginEnabled({ DEV_LOGIN: "1", NODE_ENV: "production" })).toBe(false);
    expect(isDevLoginEnabled({ NODE_ENV: "development" })).toBe(false);
  });
});
