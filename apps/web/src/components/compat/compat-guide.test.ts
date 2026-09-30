import { findStopPhrases } from "@oracle/content";
import { calculateCompatibility } from "@oracle/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { COMPAT_CALC_ID, COMPAT_FAQ, COMPAT_METHOD_ID, compatFaqJsonLd, CompatCta, CompatGuide, CompatPreview } from "./CompatGuide";
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

describe("CompatPreview and CompatCta", () => {
  test("promise the three result blocks and have no prediction stop phrases", () => {
    const html = renderToStaticMarkup(createElement(CompatPreview));
    for (const title of ["Аркан вашей пары", "Вы и партнёр", "Сходства и различия"]) expect(html).toContain(title);
    expect(findStopPhrases(text(html))).toEqual([]);
  });

  test("the final call is made of links to the form and the method, not a second calculate button", () => {
    const html = renderToStaticMarkup(createElement(CompatCta));
    expect(html).toContain(`href="#${COMPAT_CALC_ID}"`);
    expect(html).toContain(`href="#${COMPAT_METHOD_ID}"`);
    expect(html).not.toContain("<button");
    expect(findStopPhrases(text(html))).toEqual([]);
  });

  test("the method section carries the anchor id and the FAQ opens with the first question", () => {
    const html = renderToStaticMarkup(createElement(CompatGuide));
    expect(html).toContain(`id="${COMPAT_METHOD_ID}"`);
    expect(html.match(/<details open/g)).toHaveLength(1);
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
