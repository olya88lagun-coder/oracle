import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { buildMonthPage } from "@/lib/lunar-calendar";
import { MoonSignRibbon } from "./MoonSignRibbon";

const page = buildMonthPage(2026, 11, new Date("2026-11-17T09:00:00Z"));
const html = renderToStaticMarkup(<MoonSignRibbon segments={page.ribbon} />);

describe("MoonSignRibbon", () => {
  test("gives every sign segment its glyph from the natal sprite, hidden from screen readers", () => {
    const glyphs = [...html.matchAll(/<use href="#glyph-([a-z]+)"/g)].map((match) => match[1]);
    expect(glyphs).toEqual(page.ribbon.map((segment) => segment.sign));
    expect(html.match(/class="natal-glyph moon-ribbon__glyph"/g)).toHaveLength(page.ribbon.length);
    expect(html).toContain('aria-hidden="true"');
  });

  test("keeps the sign name and the time as text, so the glyph never carries the meaning alone", () => {
    for (const segment of page.ribbon) {
      expect(html).toContain(segment.signName);
      expect(html).toContain(segment.label);
    }
  });
});
