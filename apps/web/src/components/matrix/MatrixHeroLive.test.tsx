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
    expect(html.match(/matrix-live__key"/g)).toHaveLength(3);
  });

  test("shows the visitor's matrix for a valid date", () => {
    const html = renderToStaticMarkup(<MatrixHeroLive value="1990-03-07" />);
    expect(html).toContain('data-state="date"');
    expect(html).toContain("Ваша матрица · 7 марта 1990");
    expect(html).toMatch(/data-point="E"[^>]*>(?:(?!<\/g>).)*<text[^>]*>4</);
  });
});
