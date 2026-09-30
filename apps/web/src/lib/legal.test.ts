import { describe, expect, test } from "vitest";
import { DATA_RECIPIENTS, DISCLAIMER, DOCUMENT_PATHS, formatRubles, LEGAL_VERSIONS, LOGIN_CONSENT_RECIPIENTS, OPERATOR } from "./legal";

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

  test("payment and report recipients work under the offer and stay out of the login consent", () => {
    const contract = DATA_RECIPIENTS.filter((recipient) => recipient.basis === "contract").map((recipient) => recipient.name);

    expect(contract).toEqual(["ЮKassa (НКО «ЮМани» (ООО))", "GigaChat (ПАО Сбербанк)"]);
    expect(LOGIN_CONSENT_RECIPIENTS).toEqual([]);
  });

  test("the text service gets no name, birth date or contacts", () => {
    const what = DATA_RECIPIENTS.find((recipient) => recipient.name.startsWith("GigaChat"))?.what ?? "";
    expect(what).toMatch(/Имя, дата рождения, e-mail и контакты не передаются/);
  });

  test("the text service is told about the Lila intention and the notes of a paid game", () => {
    const what = DATA_RECIPIENTS.find((recipient) => recipient.name.startsWith("GigaChat"))?.what ?? "";
    expect(what).toMatch(/намерение/);
    expect(what).toMatch(/записи мыслей/);
    expect(what.replace(/Имя, дата рождения, e-mail и контакты не передаются/, "")).not.toMatch(/дата рождения/);
  });

  test("the disclaimer rules out predictions and professional advice", () => {
    expect(DISCLAIMER).toMatch(/не предсказани/);
    expect(DISCLAIMER).toMatch(/консультаци/);
  });

  test("documents live at stable addresses", () => {
    expect(DOCUMENT_PATHS).toEqual(["/contacts", "/privacy", "/consent", "/oferta"]);
  });

  test("prices are shown in rubles", () => {
    expect(formatRubles(29_000)).toBe("290 ₽");
  });
});
