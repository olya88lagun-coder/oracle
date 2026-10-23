import { tarotCardText } from "@oracle/content/tarot";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { TARO_BRIDGE } from "@/lib/taro-bridge";
import { TaroCardView } from "./TaroCardView";
import { TaroMatrixBridge } from "./TaroMatrixBridge";

describe("TaroMatrixBridge", () => {
  test("is a labelled aside with a heading, the text for its context and one link to the free matrix calculation", () => {
    const markup = renderToStaticMarkup(<TaroMatrixBridge context="card" id="bridge" />);
    expect(markup).toContain('aria-labelledby="bridge"');
    expect(markup).toContain(`<h2 id="bridge">${TARO_BRIDGE.title}</h2>`);
    expect(markup).toContain(TARO_BRIDGE.text.card);
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(markup).toContain('href="/matrica-sudby"');
    expect(markup).toContain(`>${TARO_BRIDGE.cta}</a>`);
  });

  test("the card of the day gets its own text", () => {
    const markup = renderToStaticMarkup(<TaroMatrixBridge context="day" id="bridge" />);
    expect(markup).toContain(TARO_BRIDGE.text.day);
    expect(markup).not.toContain(TARO_BRIDGE.text.card);
  });
});

describe("a Taro card page", () => {
  test("ends with the bridge to the matrix, after the sections of the card", () => {
    const card = tarotCardText("mag");
    if (!card) throw new Error("no card");
    const markup = renderToStaticMarkup(<TaroCardView card={card} />);
    expect(markup).toContain(TARO_BRIDGE.text.card);
    expect(markup.indexOf(TARO_BRIDGE.text.card)).toBeGreaterThan(markup.lastIndexOf("detail-section"));
    expect(markup.match(new RegExp(`>${TARO_BRIDGE.cta}</a>`, "g"))).toHaveLength(1);
  });
});
