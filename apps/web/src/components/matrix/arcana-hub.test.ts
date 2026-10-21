import { ARCANA } from "@oracle/content";
import { findStopPhrases } from "@oracle/content";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ARCANA_HUB_PATH, arcanumPath } from "@/lib/arcana-paths";
import { PUBLIC_PATHS } from "@/lib/seo";
import { ARCANA_HUB_FAQ, ArcanaHubGrid, ArcanaHubGuide, arcanaHubJsonLd } from "./ArcanaHub";

const text = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("ArcanaHub", () => {
  test("lists all 22 arcana with a link to each page", () => {
    const html = renderToStaticMarkup(createElement(ArcanaHubGrid));
    expect(ARCANA).toHaveLength(22);
    for (const arcanum of ARCANA) {
      expect(html).toContain(`href="${arcanumPath(arcanum)}"`);
      expect(html).toContain(arcanum.name);
    }
  });

  test("publishes the same ItemList and FAQ questions as structured data", () => {
    const graph = arcanaHubJsonLd()["@graph"] as { "@type": string; mainEntity: unknown }[];
    const list = graph.find((node) => node["@type"] === "CollectionPage")?.mainEntity as { itemListElement: unknown[] };
    expect(list.itemListElement).toHaveLength(22);
    const faq = graph.find((node) => node["@type"] === "FAQPage")?.mainEntity as { name: string }[];
    expect(faq.map((entity) => entity.name)).toEqual(ARCANA_HUB_FAQ.map((item) => item.question));
  });

  test("is in the sitemap and has no prediction stop phrases", () => {
    expect(PUBLIC_PATHS).toContain(ARCANA_HUB_PATH);
    const html = renderToStaticMarkup(createElement("div", null, createElement(ArcanaHubGrid), createElement(ArcanaHubGuide)));
    expect(findStopPhrases(text(html))).toEqual([]);
  });
});
