import { findStopPhrases } from "@oracle/content";
import { describe, expect, test } from "vitest";
import { GLOSSARY, GLOSSARY_PATH, glossaryJsonLd, glossaryLetters, glossaryText } from "./natal-glossary";
import { PUBLIC_PATHS } from "./seo";

describe("GLOSSARY", () => {
  test("has at least twenty terms in alphabetical order, each with its own address-safe id", () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(20);
    const names = GLOSSARY.map((entry) => entry.term);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "ru")));
    const ids = GLOSSARY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  test("every definition is a real short answer: a sentence or two, not a stub and not an essay", () => {
    for (const entry of GLOSSARY) {
      expect(entry.definition.length, entry.term).toBeGreaterThan(60);
      expect(entry.definition.length, entry.term).toBeLessThan(520);
      expect(entry.definition, entry.term).toMatch(/[.!]$/);
    }
  });

  test("never predicts or promises", () => {
    const text = glossaryText();
    expect(findStopPhrases(text)).toEqual([]);
    expect(text).not.toMatch(/будет|ждёт|судьб|обязательно|всегда|никогда|гарант/i);
  });

  test("links lead only to pages that exist on the site", () => {
    const known = new Set(PUBLIC_PATHS.concat(["/metodika"]));
    for (const entry of GLOSSARY) for (const link of entry.links ?? []) expect(known.has(link.href), `${entry.term}: ${link.href}`).toBe(true);
  });

  test("the terms that the site itself uses are all explained", () => {
    const names = GLOSSARY.map((entry) => entry.term.toLowerCase());
    for (const term of ["асцендент", "аспект", "дом", "куспид", "лунный знак", "лунный узел", "оппозиция", "орбис", "обратное движение", "стеллиум", "транзит", "трин", "эфемериды"]) expect(names, term).toContain(term);
  });

  test("lists the letters that have terms, in order, and the page path is in the sitemap", () => {
    const letters = glossaryLetters();
    expect(letters).toEqual([...letters].sort((a, b) => a.localeCompare(b, "ru")));
    expect(new Set(letters).size).toBe(letters.length);
    expect(GLOSSARY.every((entry) => letters.includes(entry.term[0]?.toUpperCase() ?? ""))).toBe(true);
    expect(PUBLIC_PATHS).toContain(GLOSSARY_PATH);
  });

  test("the structured data repeats every term with its definition", () => {
    const ld = glossaryJsonLd();
    expect(ld["@type"]).toBe("DefinedTermSet");
    const terms = ld.hasDefinedTerm as { name: string; description: string }[];
    expect(terms.map((term) => term.name)).toEqual(GLOSSARY.map((entry) => entry.term));
    expect(terms.map((term) => term.description)).toEqual(GLOSSARY.map((entry) => entry.definition));
  });
});
