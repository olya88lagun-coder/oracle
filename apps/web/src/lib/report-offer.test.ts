import type { StoredChapter } from "@oracle/db";
import { describe, expect, test } from "vitest";
import { EMAIL_ERROR, EMAIL_PATTERN, formatIsoDate, offerState, orderedChapters, purchaseErrorMessage, reportPath, teaserText } from "./report-offer";

const DATE = "1988-11-18";
const BASE = { enabled: true, signedIn: true, date: DATE, profileDate: DATE, paid: [] };

describe("offerState", () => {
  test.each([
    ["sales are off", { ...BASE, enabled: false }, { kind: "hidden" }],
    ["nothing is calculated", { ...BASE, date: null }, { kind: "hidden" }],
    ["a guest", { ...BASE, signedIn: false, profileDate: null }, { kind: "guest" }],
    ["the portrait is empty", { ...BASE, profileDate: null }, { kind: "buy" }],
    ["the portrait has this date", BASE, { kind: "buy" }],
    ["the portrait has another date", { ...BASE, profileDate: "1990-05-14" }, { kind: "save_first" }],
    ["this date is already bought", { ...BASE, paid: [{ birthDate: DATE, purchaseId: "p1" }] }, { kind: "open", purchaseId: "p1" }],
    ["another date is bought", { ...BASE, paid: [{ birthDate: "1990-05-14", purchaseId: "p1" }] }, { kind: "buy" }],
  ])("%s", (_case, input, expected) => {
    expect(offerState(input)).toEqual(expected);
  });
});

describe("purchase helpers", () => {
  test("report pages live in the portrait", () => {
    expect(reportPath("p1")).toBe("/portret/razbor/p1");
  });

  test("e-mail check lets through ordinary addresses only", () => {
    expect(EMAIL_PATTERN.test("a@b.ru")).toBe(true);
    expect(EMAIL_PATTERN.test("a@b")).toBe(false);
    expect(EMAIL_PATTERN.test("a b@c.ru")).toBe(false);
  });

  test("server errors become plain Russian messages", () => {
    expect(purchaseErrorMessage("invalid_email")).toBe(EMAIL_ERROR);
    expect(purchaseErrorMessage("payment_failed")).toMatch(/Попробуйте ещё раз/);
    expect(purchaseErrorMessage(undefined)).toMatch(/Попробуйте ещё раз/);
  });

  test("the teaser keeps short texts and cuts long ones on a word boundary", () => {
    expect(teaserText("Коротко.", 20)).toBe("Коротко.");
    expect(teaserText("Колесница в отношениях — это движение, общие цели", 30)).toBe("Колесница в отношениях — это…");
    expect(teaserText("Колесница в отношениях — это движение, общие цели", 25)).toBe("Колесница в отношениях…");
  });

  test("dates are shown as dd.mm.yyyy", () => {
    expect(formatIsoDate(DATE)).toBe("18.11.1988");
  });

  test("chapters come in table-of-contents order and missing ones are skipped", () => {
    const chapters: StoredChapter[] = [
      { id: "scenario", source: "ai" },
      { id: "core", source: "ai", paragraphs: ["a"] },
      { id: "love", source: "fallback", paragraphs: ["b"] },
    ];

    expect(orderedChapters(chapters).map((chapter) => chapter.id)).toEqual(["core", "love", "scenario"]);
  });
});
