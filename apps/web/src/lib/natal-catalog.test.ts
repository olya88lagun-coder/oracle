import { BODY_NAMES, SIGN_IDS } from "@oracle/content/natal";
import { describe, expect, test } from "vitest";
import { natalCatalog, PRIMER_LINK } from "./natal-catalog";
import { acceptedNatalPages } from "./natal-pages";
import { natalPagePath } from "./natal-paths";
import { PUBLIC_PATHS } from "./seo";

describe("catalog of natal meaning pages", () => {
  const groups = natalCatalog();
  const hrefs = groups.flatMap((group) => group.links.map((link) => link.href));

  test("links to every open page exactly once, so none of them hangs without a path from the main natal page", () => {
    const expected = acceptedNatalPages().map(natalPagePath);
    expect([...hrefs].sort()).toEqual([...expected].sort());
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test("has one group per body, titled with the body name, with the signs in zodiac order", () => {
    expect(groups.map((group) => group.title)).toEqual([...new Set(acceptedNatalPages().map((page) => BODY_NAMES[page.body].name))]);
    for (const group of groups) {
      expect(group.links).toHaveLength(SIGN_IDS.length);
      expect(group.links[0]?.text).toMatch(new RegExp(`^${group.title} (в|во) `));
    }
  });

  test("a link text names the planet and the sign, because that is the anchor search engines read", () => {
    expect(groups.flatMap((group) => group.links).find((link) => link.href === "/natalnaya-karta/solntse-v-ovne")?.text).toBe("Солнце в Овне");
    expect(groups.flatMap((group) => group.links).find((link) => link.href === "/natalnaya-karta/uran-vo-lve")?.text).toBe("Уран во Льве");
  });

  test("the example link leads to a page that is in the sitemap", () => {
    expect(PRIMER_LINK.href).toBe("/natalnaya-karta/primer");
    expect(PUBLIC_PATHS).toContain(PRIMER_LINK.href);
  });
});
