import { findStopPhrases } from "@oracle/content";
import { calculateCompatibility } from "@oracle/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { COMPAT_FAQ, compatFaqJsonLd, CompatGuide } from "./CompatGuide";
import { CompatResult } from "./CompatResult";

const text = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("CompatGuide", () => {
  test("shows every question and publishes the same ones as FAQPage markup", () => {
    const html = renderToStaticMarkup(createElement(CompatGuide));
    for (const item of COMPAT_FAQ) expect(html).toContain(item.question);
    const names = (compatFaqJsonLd().mainEntity as { name: string }[]).map((entity) => entity.name);
    expect(names).toEqual(COMPAT_FAQ.map((item) => item.question));
  });

  test("has no prediction stop phrases and does not promise to store dates", () => {
    const html = renderToStaticMarkup(createElement(CompatGuide));
    expect(findStopPhrases(text(html))).toEqual([]);
    expect(html).toContain("Нет. Даты остаются на вашем устройстве");
  });
});

describe("CompatResult", () => {
  test("shows the pair arcanum, both people and the summary, with the actions passed in", () => {
    const compat = calculateCompatibility({ year: 1988, month: 11, day: 18 }, { year: 2000, month: 1, day: 1 });
    const html = renderToStaticMarkup(createElement(CompatResult, { compat, actions: createElement("button", null, "Скачать PDF") }));
    expect(html).toContain("Аркан вашей пары");
    expect(html).toContain("Вы и партнёр");
    expect(html).toContain("Где вы похожи и где различаетесь");
    expect(html).toContain("Вопрос для двоих");
    expect(html).toContain("Скачать PDF");
    // аркан 19 — Солнце
    expect(html).toContain("Солнце");
    expect(findStopPhrases(text(html))).toEqual([]);
  });
});
