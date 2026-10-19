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

  test("the first batch is complete: Sun, Moon and the ascendant in all twelve signs", () => {
    const first = NATAL_PAGES.filter((page) => page.batch === 1);
    expect(first).toHaveLength(36);
    for (const page of first) expect(natalText(page.slug), page.slug).toBeDefined();
  });

  test("no batch is accepted before the owner has read it", () => {
    expect([...ACCEPTED_BATCHES]).toEqual([]);
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
