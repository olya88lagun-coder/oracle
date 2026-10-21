import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { TARO_SPREADS } from "@/lib/taro-spreads";
import { GLYPH_BOX, GLYPH_LAYOUTS, SpreadGlyph } from "./SpreadGlyph";

type Rect = { x: number; y: number };
const overlap = (a: Rect, b: Rect) => a.x < b.x + GLYPH_BOX.card.w && b.x < a.x + GLYPH_BOX.card.w && a.y < b.y + GLYPH_BOX.card.h && b.y < a.y + GLYPH_BOX.card.h;

describe("spread glyphs", () => {
  test("each spread has a drawing with one card per position", () => {
    expect(Object.keys(GLYPH_LAYOUTS).sort()).toEqual(TARO_SPREADS.map((spread) => spread.slug).sort());
    for (const spread of TARO_SPREADS) expect(GLYPH_LAYOUTS[spread.slug]).toHaveLength(spread.positions.length);
  });

  test("cards stay inside the picture and never overlap", () => {
    for (const [slug, layout] of Object.entries(GLYPH_LAYOUTS)) {
      const rects = layout.map(([x, y]) => ({ x, y }));
      for (const rect of rects) {
        expect(rect.x, slug).toBeGreaterThanOrEqual(0);
        expect(rect.y, slug).toBeGreaterThanOrEqual(0);
        expect(rect.x + GLYPH_BOX.card.w, slug).toBeLessThanOrEqual(GLYPH_BOX.width);
        expect(rect.y + GLYPH_BOX.card.h, slug).toBeLessThanOrEqual(GLYPH_BOX.height);
      }
      rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => expect(overlap(a, b), slug).toBe(false)));
    }
  });

  test("the drawing is decorative: hidden from assistive technology and without text", () => {
    const markup = renderToStaticMarkup(<SpreadGlyph slug="vybor" />);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup.match(/<rect/g)).toHaveLength(5);
    expect(markup).not.toContain("<text");
  });

  test("an unknown slug draws nothing", () => {
    expect(renderToStaticMarkup(<SpreadGlyph slug="net" />).match(/<rect/g)).toBeNull();
  });
});
