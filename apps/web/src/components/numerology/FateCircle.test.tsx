import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { FateCircle, fateRoot } from "./FateCircle";

describe("FateCircle", () => {
  test("draws nine numbers and lights exactly one of them", () => {
    const html = renderToStaticMarkup(<FateCircle value={7} />);
    expect(html.match(/<text /g)).toHaveLength(9);
    expect(html.match(/fate-circle__node is-active/g)).toHaveLength(1);
    expect(html).toMatch(/fate-circle__node is-active"><circle[^>]*><\/circle><text[^>]*>7</);
    expect(html).toContain('aria-hidden="true"');
  });

  test("a master number lights the digit it folds to", () => {
    expect([11, 22, 33].map(fateRoot)).toEqual([2, 4, 6]);
    expect(renderToStaticMarkup(<FateCircle value={22} />)).toMatch(/is-active"><circle[^>]*><\/circle><text[^>]*>4</);
  });

  test("every number from 1 to 9 and the masters have a node to light", () => {
    for (const value of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) expect(renderToStaticMarkup(<FateCircle value={value} />).match(/is-active"><circle/g), String(value)).toHaveLength(1);
  });
});
