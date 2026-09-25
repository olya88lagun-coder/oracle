import { describe, expect, test } from "vitest";
import { DATA_RECIPIENTS, DISCLAIMER, DOCUMENT_PATHS, LEGAL_VERSIONS, LOGIN_CONSENT_RECIPIENTS, OPERATOR } from "./legal";

describe("legal constants", () => {
  test("the operator has a name, a 12-digit INN of a self-employed person and an e-mail", () => {
    expect(OPERATOR.name.split(" ")).toHaveLength(3);
    expect(OPERATOR.inn).toMatch(/^\d{12}$/);
    expect(OPERATOR.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });

  test("document versions share one format", () => {
    for (const version of Object.values(LEGAL_VERSIONS)) expect(version).toMatch(/^\d{4}-\d{2}-v\d+$/);
  });

  test("every recipient says what it receives and why", () => {
    for (const recipient of DATA_RECIPIENTS) {
      expect(recipient.name.length).toBeGreaterThan(0);
      expect(recipient.what.length).toBeGreaterThan(0);
      expect(recipient.why.length).toBeGreaterThan(0);
    }
  });

  test("Metrika is consented to separately in the cookie banner, not at login", () => {
    expect(DATA_RECIPIENTS.map((recipient) => recipient.name)).toContain("Яндекс.Метрика");
    expect(LOGIN_CONSENT_RECIPIENTS.map((recipient) => recipient.name)).not.toContain("Яндекс.Метрика");
  });

  test("the disclaimer rules out predictions and professional advice", () => {
    expect(DISCLAIMER).toMatch(/не предсказани/);
    expect(DISCLAIMER).toMatch(/консультаци/);
  });

  test("documents live at stable addresses", () => {
    expect(DOCUMENT_PATHS).toEqual(["/contacts", "/privacy", "/consent"]);
  });
});
