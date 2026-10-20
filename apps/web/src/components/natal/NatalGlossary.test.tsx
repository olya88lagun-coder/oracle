import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { GLOSSARY, glossaryLetters } from "@/lib/natal-glossary";
import { NatalGlossary } from "./NatalGlossary";

describe("NatalGlossary", () => {
  const markup = renderToStaticMarkup(<NatalGlossary />);

  test("has one section with an id and an h2 for every term, and no h1", () => {
    for (const entry of GLOSSARY) expect(markup).toContain(`<section id="${entry.id}" class="natal-quick__section natal-glossary__entry"><h2>${entry.term}</h2>`);
    expect(markup.match(/<h2/g)).toHaveLength(GLOSSARY.length);
    expect(markup).not.toMatch(/<h1/);
  });

  test("the letter index points at the first term of every letter that has terms", () => {
    const anchors = markup.match(/<a href="#[a-z-]+">[А-ЯЁ]<\/a>/g) ?? [];
    expect(anchors).toHaveLength(glossaryLetters().length);
    for (const anchor of anchors) {
      const id = /href="#([a-z-]+)"/.exec(anchor)?.[1];
      expect(markup).toContain(`id="${id}"`);
    }
  });

  test("links from a term lead to the calculator, the quick pages or the methodology", () => {
    expect(markup).toContain('href="/natalnaya-karta/ascendent"');
    expect(markup).toContain('href="/natalnaya-karta/lunnyy-znak"');
    expect(markup).toContain('href="/metodika"');
  });
});
