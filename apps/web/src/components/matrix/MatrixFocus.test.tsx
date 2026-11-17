import { calculateMatrix } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { FIRST_KEY_POINT, isKeyPoint, MatrixFocus } from "./MatrixFocus";

const matrix = calculateMatrix({ day: 14, month: 9, year: 1988 });
const noop = () => {};

describe("MatrixFocus", () => {
  test("starts on Личность and offers the three free positions as pressed-state buttons", () => {
    expect(FIRST_KEY_POINT).toBe("A");
    const html = renderToStaticMarkup(<MatrixFocus matrix={matrix} selected="A" onSelect={noop} />);
    for (const label of ["Личность", "Центр", "Задача"]) expect(html).toContain(`>${label}</button>`);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toContain("Личность · точка A");
  });

  test("shows the chosen arcanum and its link", () => {
    const html = renderToStaticMarkup(<MatrixFocus matrix={matrix} selected="E" onSelect={noop} />);
    expect(html).toContain("Центр · точка E");
    expect(html).toContain("Читать об аркане");
  });

  test("only A, E and D are key points", () => {
    expect(["A", "E", "D"].every((p) => isKeyPoint(p as never))).toBe(true);
    expect(isKeyPoint("B" as never)).toBe(false);
  });
});
