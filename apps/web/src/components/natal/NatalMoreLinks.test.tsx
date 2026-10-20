import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { NatalMoreLinks } from "./NatalMoreLinks";

describe("NatalMoreLinks", () => {
  const markup = renderToStaticMarkup(<NatalMoreLinks />);

  test("has a heading, a named navigation and three links without prefetch noise", () => {
    expect(markup).toContain("<nav");
    expect(markup).toContain('aria-labelledby="natal-more-title"');
    expect(markup).toContain('<h2 id="natal-more-title">Быстрые расчёты и словарь</h2>');
    expect(markup.match(/<a /g)).toHaveLength(3);
  });

  test("links go to the ascendant, the Moon sign and the glossary", () => {
    for (const href of ["/natalnaya-karta/ascendent", "/natalnaya-karta/lunnyy-znak", "/natalnaya-karta/slovar-terminov"]) expect(markup).toContain(`href="${href}"`);
    expect(markup).toContain(">Асцендент<");
    expect(markup).toContain(">Лунный знак<");
    expect(markup).toContain(">Словарь терминов натальной карты<");
  });
});
