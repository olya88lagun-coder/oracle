import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import Page, { generateMetadata, generateStaticParams } from "./page";

const NOW = new Date("2026-11-20T09:00:00Z");
const render = async (slug: string) => renderToStaticMarkup(await Page({ params: Promise.resolve({ slug }) }));
const visibleText = (markup: string) => markup.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
const graphOf = (markup: string) => {
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(markup)?.[1] ?? "";
  return JSON.parse(json.replace(/</g, "<"))["@graph"] as { "@type": string }[];
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  mocks.notFound.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("year pages", () => {
  test("the full moon page has one h1, a table of 13 rows with times, signs and distances, and a supermoon mark", async () => {
    const markup = await render("polnoluniya-2026");
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("<h1>Полнолуния 2026</h1>");
    expect(markup.match(/class="moon-days__row"/g)).toHaveLength(13);
    expect(markup).toContain("24 ноября, 17:54");
    expect(markup).toContain("тыс. км");
    expect(markup).toContain("суперлуние");
    expect(markup).toContain('href="/lunnyy-kalendar/noyabr-2026"');
  });

  test("the new moon page lists 12 new moons and has no supermoon mark", async () => {
    const markup = await render("novoluniya-2026");
    expect(markup.match(/class="moon-days__row"/g)).toHaveLength(12);
    expect(markup).not.toContain("суперлуние");
  });

  test("metadata: canonical path and a title with the year", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "polnoluniya-2027" }) });
    expect(metadata.alternates?.canonical).toBe("/luna/polnoluniya-2027");
    expect(String(metadata.title)).toContain("2027");
  });

  test("JSON-LD has the page, the FAQ and breadcrumbs, and the page shows the intro and four questions", async () => {
    const markup = await render("polnoluniya-2026");
    expect(graphOf(markup).map((entry) => entry["@type"])).toEqual(["WebPage", "FAQPage", "BreadcrumbList"]);
    expect(markup).toContain("moon-month__intro");
    expect(markup.match(/<details/g)).toHaveLength(4);
  });

  test("a year outside the window and a malformed slug are a real 404", async () => {
    for (const slug of ["novoluniya-2030", "novoluniya-2020", "novoluniya-26", "Novoluniya-2026", "fazy-luny-2026", "luna"]) {
      await expect(render(slug), slug).rejects.toThrow("NEXT_NOT_FOUND");
    }
  });

  test("the visible text has no forbidden word and carries the disclaimer", async () => {
    const text = visibleText(await render("polnoluniya-2026"));
    for (const word of FORBIDDEN_MOON_WORDS) expect(text, word).not.toContain(word);
    expect(text).toContain("самопознания");
  });
});

describe("the phases page", () => {
  test("shows the current phase, eight phases in a row, four upcoming main phases and eight text cards", async () => {
    const markup = await render("fazy-luny");
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("<h1>Фазы Луны</h1>");
    expect(markup.match(/class="moon-phases__item"/g)?.length).toBe(8);
    expect(markup.match(/moon-events__item--phase/g)).toHaveLength(4);
    expect(markup.match(/class="moon-text__block"/g)).toHaveLength(8);
    expect(markup).toContain("Сейчас:");
  });

  test("does not link to itself in the continue block", async () => {
    expect(await render("fazy-luny")).not.toContain('<a href="/luna/fazy-luny">');
  });
});

describe("static params", () => {
  test("the phases page and two pages for each of the three years", () => {
    const slugs = generateStaticParams().map((item) => item.slug);
    expect(slugs).toHaveLength(7);
    expect(slugs).toContain("fazy-luny");
    expect(slugs).toContain("novoluniya-2025");
    expect(slugs).toContain("polnoluniya-2027");
  });
});
