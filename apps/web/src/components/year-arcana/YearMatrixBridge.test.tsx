import { arcanumByNumber } from "@oracle/content";
import { calculateMatrix, parseBirthDate } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { FREE_MATRIX_CTA } from "@/lib/practices";
import { YearMatrixBridge } from "./YearMatrixBridge";

test("the bridge names the three key arcana of the person's matrix and offers the free calculation", () => {
  const markup = renderToStaticMarkup(<YearMatrixBridge iso="1988-11-18" />);
  const matrix = calculateMatrix(parseBirthDate("1988-11-18", new Date("2026-11-14"))!);
  expect(markup).toContain("Он вырос из вашей матрицы");
  for (const point of ["A", "E", "D"] as const) expect(markup).toContain(arcanumByNumber(matrix[point]).name);
  expect(markup).toContain(FREE_MATRIX_CTA);
  expect(markup).toContain('href="/matrica-sudby"');
  // Дата в разметке и в адресе не появляется
  expect(markup).not.toContain("1988");
});

test("a broken date renders nothing", () => {
  expect(renderToStaticMarkup(<YearMatrixBridge iso="not-a-date" />)).toBe("");
});
