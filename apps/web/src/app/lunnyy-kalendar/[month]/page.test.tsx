import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Page, { generateMetadata, generateStaticParams } from "./page";

const TITLE_SUFFIX = " — Твой оракул";
const params = (month: string) => ({ params: Promise.resolve({ month }) });
const render = async (month = "noyabr-2026") => renderToStaticMarkup(await Page(params(month)));
const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;
const visibleText = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-17T09:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("the November 2026 page", () => {
  test("has one h1 and the place", async () => {
    const html = await render();
    expect(count(html, /<h1/g)).toBe(1);
    expect(/<h1[^>]*>Лунный календарь на ноябрь 2026<\/h1>/.test(html)).toBe(true);
    expect(html).toContain("По Москве");
  });

  test("shows the grid of 30 day cells, the curve, the ribbon and a table of 30 rows", async () => {
    const html = await render();
    expect(count(html, /<td[^>]*data-date="2026-11-\d\d"/g)).toBe(30);
    expect(html).toContain("moon-curve__line");
    expect(count(html, /class="moon-curve__event"/g)).toBeGreaterThanOrEqual(4);
    expect(count(html, /class="moon-ribbon__seg"/g)).toBeGreaterThanOrEqual(11);
    expect(count(html, /class="moon-days__row"/g)).toBe(30);
  });

  test("carries the natal glyph sprite once, so the glyphs of the ribbon can be drawn", async () => {
    const html = await render();
    expect(count(html, /class="natal-sprite"/g)).toBe(1);
    expect(count(html, /moon-ribbon__glyph/g)).toBeGreaterThanOrEqual(11);
  });

  test("the ribbon segments run from 0 to 1 in a row", async () => {
    const html = await render();
    const pairs = [...html.matchAll(/--from:\s*([\d.]+);\s*--to:\s*([\d.]+)/g)].map((match) => [Number(match[1]), Number(match[2])] as const);
    expect(pairs[0]![0]).toBe(0);
    expect(pairs[pairs.length - 1]![1]).toBe(1);
    pairs.forEach(([from, to], index) => {
      expect(to).toBeGreaterThan(from);
      if (index > 0) expect(from).toBeCloseTo(pairs[index - 1]![1], 3);
    });
  });

  test("links the neighbouring months and marks the current one", async () => {
    const html = await render();
    expect(html).toContain('href="/lunnyy-kalendar/oktyabr-2026"');
    expect(html).toContain('href="/lunnyy-kalendar/dekabr-2026"');
    expect(count(html, /aria-current="page"/g)).toBe(1);
    expect(count(html, /class="moon-month__prev"/g)).toBe(1);
    expect(count(html, /class="moon-month__next"/g)).toBe(1);
  });

  test("has breadcrumbs in JSON-LD, but no FAQ and no intro until the owner accepts the texts", async () => {
    const html = await render();
    const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
    expect(json).toContain("BreadcrumbList");
    expect(json).not.toContain("FAQPage");
    expect(html).not.toContain("moon-faq");
    expect(html).not.toContain("moon-month__intro");
  });

  test("has links onward, the disclaimer and no forbidden words", async () => {
    const html = await render();
    expect(html).toContain('href="/luna-segodnya"');
    expect(html).toContain('href="/taro/karta-dnya"');
    expect(html).toContain('href="/natalnaya-karta"');
    const text = visibleText(html);
    expect(text).toContain("самопознания");
    for (const word of FORBIDDEN_MOON_WORDS) expect(text, word).not.toContain(word);
  });
});

describe("metadata and params", () => {
  test("the canonical path is the month page; the title and description fit snippet limits", async () => {
    const metadata = await generateMetadata(params("noyabr-2026"));
    expect(metadata.alternates?.canonical).toBe("/lunnyy-kalendar/noyabr-2026");
    expect(String(metadata.title).length + TITLE_SUFFIX.length).toBeLessThanOrEqual(60);
    expect(String(metadata.description).length).toBeGreaterThanOrEqual(90);
    expect(String(metadata.description).length).toBeLessThanOrEqual(175);
  });

  test("builds the 15 months of the window ahead of time", async () => {
    const list = await generateStaticParams();
    expect(list).toHaveLength(15);
    expect(list[0]).toEqual({ month: "oktyabr-2026" });
    expect(list[14]).toEqual({ month: "dekabr-2027" });
  });

  test("a month outside the window, or a malformed slug, is a real 404", async () => {
    for (const slug of ["sentyabr-2026", "yanvar-2028", "Noyabr-2026", "noyabr-26", "nothing"]) {
      await expect(Page(params(slug)), slug).rejects.toMatchObject({ digest: expect.stringContaining("404") });
      await expect(generateMetadata(params(slug)), slug).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    }
  });
});
