import { ARCANA } from "@oracle/content";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { arcanumPath } from "@/lib/arcana-paths";
import { YearArcanaCatalog } from "./YearArcanaCatalog";

const markup = renderToStaticMarkup(<YearArcanaCatalog />);

describe("YearArcanaCatalog", () => {
  test("is a labelled section with one h2 and a list of all 22 arcana", () => {
    expect(markup).toContain('aria-labelledby="year-catalog-title"');
    expect(markup.match(/<h2[\s>]/g)).toHaveLength(1);
    expect(markup.match(/<li[\s>]/g)).toHaveLength(22);
  });

  test("links every arcanum page exactly once, in order, with its number, name and keywords as static text", () => {
    const hrefs = [...markup.matchAll(/<a [^>]*href="([^"]+)"/g)].map((match) => match[1]);
    expect(hrefs).toEqual(ARCANA.map(arcanumPath));
    for (const arcanum of ARCANA) {
      expect(markup).toContain(arcanum.name);
      expect(markup).toContain(arcanum.keywords.join(" · "));
    }
  });

  test("states that the arcana text is a symbol for reflection, not a forecast", () => {
    expect(markup).toMatch(/не прогноз/);
  });

  test("uses own-origin thumbnails with empty alt (the name is already in the link)", () => {
    expect(markup.match(/<img /g)).toHaveLength(22);
    expect(markup).not.toMatch(/alt="[^"]+"/);
    expect(markup).not.toContain("http");
  });
});
