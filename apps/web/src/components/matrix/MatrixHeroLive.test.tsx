import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { MatrixHeroLive } from "./MatrixHeroLive";

describe("MatrixHeroLive", () => {
  test("shows a hidden-from-readers example diagram before any date is typed", () => {
    const html = renderToStaticMarkup(<MatrixHeroLive value="" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-state="example"');
    expect(html).toContain("Пример · вымышленная дата");
    expect(html.match(/data-point="/g)).toHaveLength(28);
    for (const label of ["Личность", "Центр", "Задача"]) expect(html).toContain(label);
    expect(html.match(/class="matrix-live__key( is-lit)?"/g)).toHaveLength(3);
  });

  test("without script everything is already lit: names bright, nodes warm, no pass running", () => {
    const html = renderToStaticMarkup(<MatrixHeroLive value="" />);
    expect(html).toContain('data-pass="idle"');
    expect(html).toContain('data-lit="3"');
    expect(html.match(/matrix-live__key is-lit"/g)).toHaveLength(3);
    expect(html.match(/matrix-live__point--key is-lit"/g)).toHaveLength(3);
    expect(html).not.toContain("is-flash");
  });

  test("defines the metal gradient that the stylesheet strokes the lines with", () => {
    const html = renderToStaticMarkup(<MatrixHeroLive value="" />);
    expect(html).toContain('<linearGradient id="matrix-live-metal"');
  });

  test("shows the visitor's matrix for a valid date", () => {
    const html = renderToStaticMarkup(<MatrixHeroLive value="1990-03-07" />);
    expect(html).toContain('data-state="date"');
    expect(html).toContain("Ваша матрица · 7 марта 1990");
    expect(html).toMatch(/data-point="E"[^>]*>(?:(?!<\/g>).)*<text[^>]*>4</);
  });
});
