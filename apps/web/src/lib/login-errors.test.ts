import { describe, expect, test } from "vitest";
import { loginErrorMessage } from "./login-errors";

describe("loginErrorMessage", () => {
  test("is silent without an error", () => {
    expect(loginErrorMessage(null)).toBeNull();
  });

  test("explains known errors in plain words", () => {
    expect(loginErrorMessage("consent_required")).toMatch(/согласие/);
    expect(loginErrorMessage("vk_state_mismatch")).toMatch(/слишком много времени/);
  });

  test("falls back to a generic message and never shows the raw code", () => {
    const message = loginErrorMessage("vk_invalid_grant");

    expect(message).toMatch(/VK ID/);
    expect(message).not.toMatch(/invalid_grant/);
  });
});
