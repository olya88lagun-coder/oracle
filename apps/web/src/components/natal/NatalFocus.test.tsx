import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { FOCUS_REPORT_LINE } from "@/lib/natal-focus";
import { NatalFocus } from "./NatalFocus";
import { NatalResult } from "./NatalResult";
import { SAMPLE_BIRTH, sampleChart } from "./sample-chart.test-support";

const chart = sampleChart(true);

describe("NatalFocus", () => {
  const markup = renderToStaticMarkup(<NatalFocus chart={chart} />);

  test("is a section with its own heading, the aspect and the stellium", () => {
    expect(markup).toMatch(/^<section class="natal-focus"><h3>Главная точка карты<\/h3>/);
    expect(markup).toContain('data-kind="aspect"');
    expect(markup).toContain("Солнце — Плутон: трин");
    expect(markup).toContain("точность 1°11′");
    expect(markup).toContain('data-kind="stellium"');
    expect(markup).toContain("Четыре планеты в Козероге");
  });

  test("adds no h1 or h2 and no live region", () => {
    expect(markup).not.toMatch(/<h[12]|aria-live|role=/);
  });

  test("mentions the paid report only when it is shown", () => {
    expect(markup).not.toContain(FOCUS_REPORT_LINE);
    expect(renderToStaticMarkup(<NatalFocus chart={chart} reportShown />)).toContain(FOCUS_REPORT_LINE);
  });

  test("renders nothing for a chart without aspects and without a stellium", () => {
    const plain = { ...chart, aspects: [], points: chart.points.map((point, index) => ({ ...point, sign: (["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] as const)[index % 12] ?? "aries" })) };
    expect(renderToStaticMarkup(<NatalFocus chart={plain} />)).toBe("");
  });
});

describe("NatalResult with the focus block", () => {
  const render = (props: { offer?: React.ReactNode; time?: boolean } = {}) =>
    renderToStaticMarkup(<NatalResult chart={sampleChart(props.time ?? true)} birth={props.time === false ? { ...SAMPLE_BIRTH, time: null } : SAMPLE_BIRTH} offer={props.offer} />);

  test("stands after the wheel and the table and before the aspects list", () => {
    const markup = render();
    const order = ["natal-wheel-explorer", "natal-positions", "natal-focus", "natal-aspects"].map((name) => markup.indexOf(`class="${name}`));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test("points to the paid report only when the offer is shown and the time is known", () => {
    expect(render()).not.toContain(FOCUS_REPORT_LINE);
    expect(render({ offer: <div className="offer" /> })).toContain(FOCUS_REPORT_LINE);
    expect(render({ offer: <div className="offer" />, time: false })).not.toContain(FOCUS_REPORT_LINE);
  });
});
