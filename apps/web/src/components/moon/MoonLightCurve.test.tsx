import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { buildMonthPage, CURVE_HEIGHT, CURVE_WIDTH } from "@/lib/lunar-calendar";
import { MoonLightCurve } from "./MoonLightCurve";

const page = buildMonthPage(2026, 11, new Date("2026-11-17T09:00:00Z"));
const html = renderToStaticMarkup(<MoonLightCurve curve={page.curve} width={CURVE_WIDTH} height={CURVE_HEIGHT} />);

describe("MoonLightCurve", () => {
  test("draws a clean line and area, hidden from screen readers, with the size of the view box", () => {
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(`data-width="${CURVE_WIDTH}"`);
    expect(html).toContain(`data-height="${CURVE_HEIGHT}"`);
    expect(html).toContain('pathLength="1"');
    expect(html).not.toContain("NaN");
  });

  test("marks the four key dates on the curve, each of its kind, and keeps a line for the present moment", () => {
    expect(html.match(/class="moon-curve__event"/g)).toHaveLength(4);
    for (const kind of ["new", "firstQuarter", "full", "lastQuarter"]) expect(html).toContain(`data-kind="${kind}"`);
    expect(html).toContain("moon-curve__now");
  });

  test("draws the key dates as HTML dots placed by percent, so a stretched curve cannot turn them into ovals", () => {
    expect(html).not.toContain("<circle");
    const positions = [...html.matchAll(/class="moon-curve__event"[^>]*style="left:([\d.]+)%;top:([\d.]+)%"/g)].map((match) => [Number(match[1]), Number(match[2])] as const);
    expect(positions).toHaveLength(4);
    for (const [left, top] of positions) {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(100);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(100);
    }
  });

  test("has a caption", () => {
    expect(html).toContain("<figcaption");
  });
});
