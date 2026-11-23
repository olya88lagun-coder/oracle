import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { THREAD_LEVELS } from "@/lib/life-thread-curve";
import { ThreadLegend, THREAD_LEGEND } from "./ThreadLegend";

describe("ThreadLegend", () => {
  test("renders every term in a definition list under a heading", () => {
    const markup = renderToStaticMarkup(<ThreadLegend />);
    expect(markup).toContain("Как читать график");
    expect((markup.match(/<dt>/g) ?? []).length).toBe(THREAD_LEGEND.length);
    expect(markup).not.toMatch(/<h[12]/);
  });

  test("the stated peak and quiet years match the curve scale", () => {
    const levels = Object.entries(THREAD_LEVELS);
    expect(Math.max(...levels.map(([, v]) => v))).toBe(THREAD_LEVELS[8]);
    expect(Math.min(...levels.map(([, v]) => v))).toBe(THREAD_LEVELS[2]);
    const height = THREAD_LEGEND[0]!.text;
    expect(height).toContain("Год 8");
    expect(height).toContain("год 2");
  });

  test("no prediction or good/bad wording", () => {
    for (const item of THREAD_LEGEND) expect(`${item.term} ${item.text}`).not.toMatch(/предскаж|прогноз|удачн(ый|ое) год|неудач|плохой год(?!ом)/i);
  });
});
