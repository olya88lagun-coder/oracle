import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ClockLookup } from "./ClockLookup";

describe("ClockLookup", () => {
  const markup = renderToStaticMarkup(<ClockLookup times={[{ label: "11:11", href: "/numerologiya/chasy/11-11" }]} />);

  test("is a form with a labelled time field and a button; nothing is shown before the first search", () => {
    expect(markup).toContain('<label for="clock-lookup-input">Время на часах</label>');
    expect(markup).toContain("Найти значение");
    expect(markup).toContain('role="status"></div>');
    expect(markup).not.toContain('role="alert"');
  });
});
