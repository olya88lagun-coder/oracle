import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { collectArcana } from "../scripts/build-arcana.mjs";
import houseRaw from "./generated/natal-house-pages.json";
import raw from "./generated/natal.json";
import { checkNatalHousePages, checkNatalPages } from "./natal-check";
import { NATAL_HOUSE_PAGE_SLUGS } from "./natal-keys";
import { ACCEPTED_BATCHES, ASPECT_TEXTS, HOUSE_PAGES_BATCH, HOUSE_TEXTS, NATAL_HOUSE_PAGES, NATAL_HOUSE_TEXTS, NATAL_PAGES, NATAL_TEXTS, natalHousePageSlug, natalHouseText, natalPageFile, natalText } from "./natal-texts";
import { findStopPhrases } from "./check";

describe("natal texts data", () => {
  test("the committed natal.json matches the markdown files — run pnpm content:build after editing texts", () => {
    expect(raw).toEqual(collectArcana(fileURLToPath(new URL("../natal", import.meta.url))));
  });

  test("file names follow the manifest order", () => {
    for (const page of NATAL_TEXTS) expect(Object.keys(raw)).toContain(natalPageFile(page.slug).replace(/\.md$/, ""));
  });

  test("every written text passes the checks (volume, stop phrases, templating)", () => {
    expect(checkNatalPages(NATAL_TEXTS)).toEqual([]);
  });

  test("all five batches are written: 144 pages (1: Sun, Moon, ascendant; 2: Mercury, Venus, Mars; 3: Jupiter, Saturn; 4: Uranus, Neptune, Pluto; 5: north node)", () => {
    const sizes: Record<number, number> = { 1: 36, 2: 36, 3: 24, 4: 36, 5: 12 };
    for (const [batch, size] of Object.entries(sizes)) {
      const pages = NATAL_PAGES.filter((page) => page.batch === Number(batch));
      expect(pages, `партия ${batch}`).toHaveLength(size);
      for (const page of pages) expect(natalText(page.slug), page.slug).toBeDefined();
    }
    expect(NATAL_TEXTS).toHaveLength(144);
  });

  test("only existing batches are accepted, and every page of an accepted batch has its text", () => {
    const batches = new Set([...NATAL_PAGES, ...NATAL_HOUSE_PAGES].map((page) => page.batch));
    for (const batch of ACCEPTED_BATCHES) expect(batches.has(batch), `партия ${batch}`).toBe(true);
    for (const page of NATAL_PAGES.filter((item) => ACCEPTED_BATCHES.has(item.batch))) expect(natalText(page.slug), page.slug).toBeDefined();
  });
});

describe("planet in house pages (pilot, batch 6)", () => {
  test("the committed natal-house-pages.json matches the markdown files — run pnpm content:build after editing texts", () => {
    expect(houseRaw).toEqual(collectArcana(fileURLToPath(new URL("../natal-house-pages", import.meta.url))));
  });

  test("twelve pilot pages, one file per manifest entry, slugs like venera-v-7-dome", () => {
    expect(NATAL_HOUSE_PAGES).toHaveLength(12);
    expect(natalHousePageSlug("venus", 7)).toBe("venera-v-7-dome");
    expect(Object.keys(houseRaw).sort()).toEqual(NATAL_HOUSE_PAGES.map((page) => page.slug).sort());
    for (const page of NATAL_HOUSE_PAGES) expect(natalHouseText(page.slug), page.slug).toBeDefined();
    const signSlugs = new Set(NATAL_PAGES.map((page) => page.slug));
    for (const page of NATAL_HOUSE_PAGES) expect(signSlugs.has(page.slug), page.slug).toBe(false);
  });

  test("every text passes the checks of the sign pages and does not repeat them", () => {
    expect(checkNatalHousePages(NATAL_HOUSE_TEXTS, NATAL_TEXTS)).toEqual([]);
  });

  test("the batch is accepted: the calculator links every house page", () => {
    expect(ACCEPTED_BATCHES.has(HOUSE_PAGES_BATCH)).toBe(true);
    expect(Object.values(NATAL_HOUSE_PAGE_SLUGS).sort()).toEqual(NATAL_HOUSE_PAGES.map((page) => page.slug).sort());
  });
});

describe("house and aspect texts", () => {
  const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

  test("twelve houses and five aspects, 40–90 words each", () => {
    expect(Object.keys(HOUSE_TEXTS)).toHaveLength(12);
    expect(Object.keys(ASPECT_TEXTS).sort()).toEqual(["conjunction", "opposition", "sextile", "square", "trine"]);
    for (const text of [...Object.values(HOUSE_TEXTS), ...Object.values(ASPECT_TEXTS)]) {
      expect(words(text)).toBeGreaterThanOrEqual(40);
      expect(words(text)).toBeLessThanOrEqual(90);
      expect(findStopPhrases(text)).toEqual([]);
    }
  });
});
