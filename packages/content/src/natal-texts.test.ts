import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { collectArcana } from "../scripts/build-arcana.mjs";
import raw from "./generated/natal.json";
import { checkNatalPages } from "./natal-check";
import { ACCEPTED_BATCHES, ASPECT_TEXTS, HOUSE_TEXTS, NATAL_PAGES, NATAL_TEXTS, natalPageFile, natalText } from "./natal-texts";
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

  test("all four batches are written: 132 pages (1: Sun, Moon, ascendant; 2: Mercury, Venus, Mars; 3: Jupiter, Saturn; 4: Uranus, Neptune, Pluto)", () => {
    const sizes: Record<number, number> = { 1: 36, 2: 36, 3: 24, 4: 36 };
    for (const [batch, size] of Object.entries(sizes)) {
      const pages = NATAL_PAGES.filter((page) => page.batch === Number(batch));
      expect(pages, `партия ${batch}`).toHaveLength(size);
      for (const page of pages) expect(natalText(page.slug), page.slug).toBeDefined();
    }
    expect(NATAL_TEXTS).toHaveLength(132);
  });

  test("only existing batches are accepted, and every page of an accepted batch has its text", () => {
    const batches = new Set(NATAL_PAGES.map((page) => page.batch));
    for (const batch of ACCEPTED_BATCHES) expect(batches.has(batch), `партия ${batch}`).toBe(true);
    for (const page of NATAL_PAGES.filter((item) => ACCEPTED_BATCHES.has(item.batch))) expect(natalText(page.slug), page.slug).toBeDefined();
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
