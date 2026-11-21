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

  test("shows the stage: the scene of the chosen day, one slider over the days, the grid of 30 cells, and the table of 30 rows folded away", async () => {
    const html = await render();
    expect(count(html, /<td[^>]*data-date="2026-11-\d\d"/g)).toBe(30);
    expect(count(html, /class="moon-scene"/g)).toBe(1);
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuemax="30"');
    expect(html).toContain("moon-scrub__line");
    expect(count(html, /class="moon-scrub__event"/g)).toBeGreaterThanOrEqual(4);
    expect(count(html, /class="moon-scrub__sign"/g)).toBeGreaterThanOrEqual(11);
    // Таблица «день за днём» остаётся в разметке, но свёрнута и не повторяет сетку на экране
    expect(count(html, /class="moon-days__row"/g)).toBe(30);
    expect(/<details class="moon-fold" id="moon-days-data">[\s\S]*moon-days__row/.test(html)).toBe(true);
  });

  test("the sections that repeated the calendar are gone: the key dates, the events list, the separate curve and ribbon, the key point cards", async () => {
    const html = await render();
    for (const gone of ["moon-month__events", "moon-events__list", "moon-curve", "moon-ribbon", "moon-keypoints", "Ключевые даты", "События месяца", "Разделы страницы"]) expect(html, gone).not.toContain(gone);
  });

  test("carries the natal glyph sprite once, so the glyphs of the sign track can be drawn", async () => {
    const html = await render();
    expect(count(html, /class="natal-sprite"/g)).toBe(1);
    expect(count(html, /moon-scrub__glyph/g)).toBeGreaterThanOrEqual(11);
  });

  test("the sign segments share the track: their widths add up to the whole month", async () => {
    const html = await render();
    const grows = [...html.matchAll(/flex-grow:\s*([\d.]+)/g)].map((match) => Number(match[1]));
    expect(grows.length).toBeGreaterThanOrEqual(11);
    expect(grows.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 2);
  });

  test("links the neighbouring months and marks the current one", async () => {
    const html = await render();
    expect(html).toContain('href="/lunnyy-kalendar/oktyabr-2026"');
    expect(html).toContain('href="/lunnyy-kalendar/dekabr-2026"');
    expect(count(html, /aria-current="page"/g)).toBe(1);
    expect(count(html, /class="moon-month__prev"/g)).toBe(1);
    expect(count(html, /class="moon-month__next"/g)).toBe(1);
  });

  test("has the accepted intro and seven questions (four with real dates), folded text blocks, and breadcrumbs and FAQ in JSON-LD", async () => {
    const html = await render();
    const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
    expect(json).toContain("BreadcrumbList");
    expect(json).toContain("FAQPage");
    expect(html).toContain("moon-month__intro");
    // Семь вопросов и два свёрнутых блока: «О календаре» и таблица
    expect(count(html, /<details/g)).toBe(7 + 2);
    expect(count(html, /class="moon-fold"/g)).toBe(2);
    expect(html).toContain("В ноябре 2026 года новолуние — 9 ноября, 10:02");
    expect(html).toContain("moon-days__guide");
    expect(html).toContain("Когда полнолуние в ноябре 2026?");
    expect(html).toMatch(/24 ноября, 17:5\d/);
  });

  test("the scene opens on the first full moon of the month and shows its key point with the spread link", async () => {
    const html = await render();
    expect(html).toContain('aria-valuenow="24"');
    expect(html).toContain("Полнолуние · 24 ноября, 17:54");
    expect(html).toContain("Луна напротив Солнца");
    expect(html).toContain('href="/taro/rasklady/polnolunie"');
    expect(html).toContain("О лунных сутках →");
    expect(html).toContain("Картинка для сторис");
  });

  test("the diary and the collection wait for the browser: no notes on the server, the collection starts closed", async () => {
    const html = await render();
    expect(html).not.toContain("moon-diary");
    expect(html).toContain("Коллекция Луны");
    expect(count(html, /class="moon-collection__tile"/g) + count(html, /class="moon-collection__tile" /g)).toBeGreaterThanOrEqual(1);
    expect(count(html, /data-open="false"/g)).toBe(20);
    expect(html).toContain("Открыто 0 из 20");
  });

  test("the first screen holds the compact head and the stage; the long texts are folded below the collection", async () => {
    const html = await render();
    const at = (needle: string) => html.indexOf(needle);
    expect(html).toContain("moon-month__head moon-month__head--compact");
    expect(/moon-month__head[\s\S]*?<\/header>/.exec(html)?.[0]).not.toContain("moon-month__intro");
    expect(at('id="moon-calendar"')).toBeLessThan(at("moon-scrub"));
    expect(at("moon-scrub")).toBeLessThan(at("moon-month__grid"));
    expect(at("moon-month__grid")).toBeLessThan(at("moon-collection"));
    expect(at("moon-collection")).toBeLessThan(at('id="moon-about"'));
    expect(at('id="moon-about"')).toBeLessThan(at('id="moon-days-data"'));
    expect(at('id="moon-days-data"')).toBeLessThan(at("moon-faq"));
    expect(html).toContain("О календаре на ноябрь 2026");
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
