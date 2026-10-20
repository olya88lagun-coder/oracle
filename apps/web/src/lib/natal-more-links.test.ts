import { describe, expect, test } from "vitest";
import { PUBLIC_PATHS } from "./seo";
import { MORE_LINKS } from "./natal-more-links";

describe("links from the main natal page", () => {
  test("lead to the two quick pages and the glossary, each once", () => {
    expect(MORE_LINKS.map((link) => link.href)).toEqual(["/natalnaya-karta/ascendent", "/natalnaya-karta/lunnyy-znak", "/natalnaya-karta/slovar-terminov"]);
  });

  test("every link leads to a page that is in the sitemap and has a title and a short text", () => {
    for (const link of MORE_LINKS) {
      expect(PUBLIC_PATHS, link.href).toContain(link.href);
      expect(link.title.length).toBeGreaterThan(3);
      expect(link.text.length).toBeGreaterThan(30);
      expect(link.text.length).toBeLessThan(160);
    }
  });
});
