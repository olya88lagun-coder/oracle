import { findStopPhrases } from "@oracle/content";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { MATRIX_FAQ, matrixFaqJsonLd, MatrixGuide } from "./MatrixGuide";

const text = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("MatrixGuide", () => {
  test("publishes the same questions as FAQPage markup and has twelve of them", () => {
    expect(MATRIX_FAQ).toHaveLength(12);
    const names = (matrixFaqJsonLd().mainEntity as { name: string }[]).map((entity) => entity.name);
    expect(names).toEqual(MATRIX_FAQ.map((item) => item.question));
  });

  test("has no prediction stop phrases", () => {
    const html = renderToStaticMarkup(createElement(MatrixGuide));
    expect(findStopPhrases(text(html))).toEqual([]);
  });

  test("keeps the manual calculation on the page and does not hide it in a details block", () => {
    const html = renderToStaticMarkup(createElement(MatrixGuide));
    expect(html).toContain("Как рассчитать матрицу судьбы вручную");
    expect(html).not.toContain("Подробно о расчёте");
  });

  test("the refund answer follows the offer term", () => {
    const refund = MATRIX_FAQ.find((item) => item.question.includes("вернуть деньги"));
    expect(refund?.answer).toContain("14 дней");
  });
});
