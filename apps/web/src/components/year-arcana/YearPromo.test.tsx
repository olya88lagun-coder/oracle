import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { YEAR_PATH } from "@/lib/year-arcana";
import { YEAR_PROMO } from "@/lib/year-arcana-promo";
import { YearPromo } from "./YearPromo";

describe("YearPromo", () => {
  test.each(["home", "taro"] as const)("%s: a labelled aside with a heading, its own text and one link to the free calculation", (context) => {
    const markup = renderToStaticMarkup(<YearPromo context={context} id="promo" />);
    expect(markup).toContain('aria-labelledby="promo"');
    expect(markup).toContain(`<h2 id="promo">${YEAR_PROMO[context].title}</h2>`);
    expect(markup).toContain(YEAR_PROMO[context].text);
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(markup).toContain(`href="${YEAR_PATH}"`);
    expect(markup).toContain(`>${YEAR_PROMO.cta}</a>`);
  });

  test("never promises events: says it is a symbol, not a forecast", () => {
    for (const context of ["home", "taro"] as const) expect(YEAR_PROMO[context].text).toMatch(/не прогноз/);
  });

  test("the internal link carries no campaign tags (they belong to outbound shares only)", () => {
    expect(renderToStaticMarkup(<YearPromo context="home" id="promo" />)).not.toContain("utm_");
  });
});
