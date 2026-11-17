import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { MOON_PATH } from "@/lib/moon-today";
import Page, { metadata } from "./page";

const TITLE_SUFFIX = " — Твой оракул";
const html = () => renderToStaticMarkup(<Page />);
const visibleText = (markup: string) => markup.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
const graphOf = (markup: string) => {
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(markup)?.[1] ?? "";
  return JSON.parse(json.replace(/\u003c/g, "<"))["@graph"] as { "@type": string }[];
};

test("metadata: canonical path, title and description within snippet limits", () => {
  expect(metadata.alternates?.canonical).toBe(MOON_PATH);
  expect(String(metadata.title).length + TITLE_SUFFIX.length).toBeLessThanOrEqual(60);
  expect(String(metadata.description).length).toBeGreaterThanOrEqual(90);
  expect(String(metadata.description).length).toBeLessThanOrEqual(175);
});

test("one h1 that starts with «Луна сегодня,» and says it is for Moscow", () => {
  const markup = html();
  expect(markup.match(/<h1/g)).toHaveLength(1);
  expect(/<h1[^>]*>Луна сегодня, [^<]+<\/h1>/.test(markup)).toBe(true);
  expect(markup).toContain("По Москве");
});

test("JSON-LD has the page, a FAQ and breadcrumbs", () => {
  const types = graphOf(html()).map((entry) => entry["@type"]);
  expect(types).toEqual(expect.arrayContaining(["WebPage", "FAQPage", "BreadcrumbList"]));
});

test("shows the disc with eight ticks, four tiles, the next phase and a 14-day strip", () => {
  const markup = html();
  expect(markup).toContain("moon-disc");
  expect(markup.match(/class="moon-disc__tick( is-current)?"/g)).toHaveLength(8);
  expect(markup.match(/class="moon-tile"/g)).toHaveLength(4);
  expect(markup).toContain("moon-next");
  expect(markup.match(/class="moon-strip__day/g)).toHaveLength(14);
});

test("links to the card of the day, the natal chart and the Moon's sign page", () => {
  const markup = html();
  expect(markup).toContain('href="/taro/karta-dnya"');
  expect(markup).toContain('href="/natalnaya-karta"');
  expect(markup).toMatch(/href="\/natalnaya-karta\/luna-v-[a-z]+"/);
});

test("hides the text blocks and leaves no empty placeholders until the texts are accepted", () => {
  const markup = html();
  expect(markup).not.toContain("moon-text");
  expect(markup).not.toContain("<h3></h3>");
});

test("the visible text has no forbidden word and carries the disclaimer", () => {
  const text = visibleText(html());
  for (const word of FORBIDDEN_MOON_WORDS) expect(text, word).not.toContain(word);
  expect(text).toContain("самопознания");
});
