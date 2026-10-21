import { findStopPhrases } from "@oracle/content";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { LilaFaq, lilaFaq, lilaFaqJsonLd } from "./LilaFaq";

const text = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("LilaFaq", () => {
  test("shows every question and publishes the same ones as FAQPage markup", () => {
    for (const guided of [false, true]) {
      const html = renderToStaticMarkup(createElement(LilaFaq, { guided }));
      for (const item of lilaFaq(guided)) expect(html).toContain(item.question.replace("«", "«"));
      const names = (lilaFaqJsonLd(guided).mainEntity as { name: string }[]).map((entity) => entity.name);
      expect(names).toEqual(lilaFaq(guided).map((item) => item.question));
    }
  });

  test("talks about the guide only when the paid game is on", () => {
    expect(lilaFaq(false).some((item) => /проводник/i.test(item.question))).toBe(false);
    expect(lilaFaq(false).some((item) => /GigaChat/.test(item.answer))).toBe(false);
    expect(lilaFaq(true).some((item) => /проводник/i.test(item.question))).toBe(true);
    expect(lilaFaq(true).some((item) => /GigaChat/.test(item.answer))).toBe(true);
  });

  test("has no prediction stop phrases and says the game is not a prediction", () => {
    for (const guided of [false, true]) expect(findStopPhrases(text(renderToStaticMarkup(createElement(LilaFaq, { guided }))))).toEqual([]);
    expect(lilaFaq(false).find((item) => item.question.includes("гадание"))?.answer).toContain("Нет.");
  });
});
