import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { SITE_URL } from "@/lib/site";
import { SPREADS_HUB_FAQ, spreadPath, TARO_SPREADS } from "@/lib/taro-spreads";
import TaroSpreadsPage, { metadata } from "./page";

const markup = renderToStaticMarkup(<TaroSpreadsPage />);
const jsonLd = [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]!.replace(/\\u003c/g, "<")) as Record<string, unknown>);
const text = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();

describe("/taro/rasklady", () => {
  test("title leads with «Расклады Таро онлайн» and keeps «гадание» in the second part", () => {
    expect(metadata.title).toBe("Расклады Таро онлайн бесплатно — гадание без регистрации");
    expect(String(metadata.title).indexOf("Расклады Таро онлайн")).toBe(0);
    expect(String(metadata.title).indexOf("гадание")).toBeGreaterThan(String(metadata.title).indexOf("—"));
  });

  test("description is a snippet of up to 160 characters, with a canonical address and index,follow", () => {
    const description = String(metadata.description);
    expect(description.length).toBeGreaterThan(100);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toContain("расклады Таро онлайн");
    expect(metadata.alternates?.canonical).toBe("/taro/rasklady");
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  test("has one h1 and no promise of a prediction in the lead", () => {
    expect(markup.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(text(/<h1[\s\S]*?<\/h1>/.exec(markup)![0])).toBe("Расклады Таро онлайн");
    expect(text(markup)).toContain("не прогноз");
  });

  test("lists every spread with a link to its page and the number of cards", () => {
    for (const spread of TARO_SPREADS) {
      expect(markup).toContain(`href="${spreadPath(spread)}"`);
      expect(text(markup)).toContain(spread.name);
      expect(text(markup)).toContain(spread.teaser);
    }
    expect(markup.match(/<article/g)).toHaveLength(TARO_SPREADS.length);
    expect(text(markup)).toMatch(/3 карты/);
    expect(text(markup)).toMatch(/5 карт/);
  });

  test("links back to the card of the day and the card meanings", () => {
    expect(markup).toContain('href="/taro/karta-dnya"');
    expect(markup).toContain('href="/taro#znacheniya"');
  });

  test("the FAQ is on the page and in the FAQPage markup, word for word", () => {
    const faq = jsonLd.find((item) => item["@type"] === "FAQPage") as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(faq.mainEntity.map((item) => item.name)).toEqual(SPREADS_HUB_FAQ.map((item) => item.question));
    for (const item of SPREADS_HUB_FAQ) {
      expect(text(markup)).toContain(item.question);
      expect(text(markup)).toContain(item.answer);
    }
  });

  test("breadcrumbs lead from the tarot section to the spreads, before the page", () => {
    const crumbs = jsonLd.find((item) => item["@type"] === "BreadcrumbList") as { itemListElement: { name: string; item: string }[] };
    expect(crumbs.itemListElement.map((item) => item.name)).toEqual(["Таро", "Расклады"]);
    expect(crumbs.itemListElement.map((item) => item.item)).toEqual([`${SITE_URL}/taro`, `${SITE_URL}/taro/rasklady`]);
    expect(markup.indexOf("application/ld+json")).toBeLessThan(markup.indexOf("<main"));
  });
});
