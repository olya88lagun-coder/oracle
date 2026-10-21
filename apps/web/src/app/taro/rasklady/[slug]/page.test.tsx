import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { SITE_URL } from "@/lib/site";
import { spreadPath, TARO_SPREADS } from "@/lib/taro-spreads";
import TaroSpreadPage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;
const text = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
const render = async (slug: string) => renderToStaticMarkup(await TaroSpreadPage(params(slug)));
const ldOf = (markup: string) => [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]!.replace(/\\u003c/g, "<")) as Record<string, unknown>);

describe("/taro/rasklady/[slug]", () => {
  test("builds a page for every spread and answers 404 to anything else", async () => {
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams().map((item) => item.slug)).toEqual(TARO_SPREADS.map((spread) => spread.slug));
    await expect(TaroSpreadPage(params("net-takogo"))).rejects.toThrow(NOT_FOUND);
    expect(await generateMetadata(params("net-takogo"))).toEqual({});
  });

  test("every spread has its own title and description, a canonical address and index,follow", async () => {
    const seen = new Set<string>();
    for (const spread of TARO_SPREADS) {
      const metadata = await generateMetadata(params(spread.slug));
      expect(metadata.title).toBe(spread.title);
      expect(String(metadata.description).length).toBeLessThanOrEqual(160);
      expect(metadata.alternates?.canonical).toBe(spreadPath(spread));
      expect(metadata.robots).toEqual({ index: true, follow: true });
      seen.add(`${String(metadata.title)}|${String(metadata.description)}`);
    }
    expect(seen.size).toBe(TARO_SPREADS.length);
  });

  test("shows one h1, the positions, the lead and a face-down card for each position", async () => {
    for (const spread of TARO_SPREADS) {
      const markup = await render(spread.slug);
      expect(markup.match(/<h1[\s>]/g)).toHaveLength(1);
      expect(text(/<h1[\s\S]*?<\/h1>/.exec(markup)![0])).toBe(spread.name);
      expect(text(markup)).toContain(spread.lead);
      spread.positions.forEach((position, index) => {
        expect(text(markup)).toContain(position.title);
        expect(text(markup)).toContain(position.hint);
        expect(markup).toContain(`aria-label="Позиция ${index + 1}: ${position.title}"`);
      });
      expect(markup.match(/class="taro-pick taro-spread-pick"/g)).toHaveLength(spread.positions.length);
    }
  });

  test("keeps the question field, the hint to open the cards and the privacy note", async () => {
    const markup = await render("tri-karty");
    expect(text(markup)).toContain("Ваш вопрос (необязательно)");
    expect(text(markup)).toContain("Откройте карты по очереди: нажмите на рубашку.");
    expect(text(markup)).toContain("Вопрос остаётся в вашем браузере и никуда не отправляется.");
  });

  test("the FAQ is on the page and in the FAQPage markup, word for word", async () => {
    for (const spread of TARO_SPREADS) {
      const markup = await render(spread.slug);
      const faq = ldOf(markup).find((item) => item["@type"] === "FAQPage") as { mainEntity: { name: string }[] };
      expect(faq.mainEntity.map((item) => item.name)).toEqual(spread.faq.map((item) => item.question));
      for (const item of spread.faq) {
        expect(text(markup)).toContain(item.question);
        expect(text(markup)).toContain(item.answer);
      }
    }
  });

  test("breadcrumbs lead from the tarot section through the spreads to this spread, before the page", async () => {
    const markup = await render("vybor");
    const crumbs = ldOf(markup).find((item) => item["@type"] === "BreadcrumbList") as { itemListElement: { name: string; item: string }[] };
    expect(crumbs.itemListElement.map((item) => item.name)).toEqual(["Таро", "Расклады", "Расклад на выбор из двух"]);
    expect(crumbs.itemListElement.map((item) => item.item)).toEqual([`${SITE_URL}/taro`, `${SITE_URL}/taro/rasklady`, `${SITE_URL}/taro/rasklady/vybor`]);
    expect(markup.indexOf("application/ld+json")).toBeLessThan(markup.indexOf("<main"));
  });

  test("links to the other spreads but not to itself", async () => {
    const markup = await render("tri-karty");
    expect(markup).toContain('href="/taro/rasklady/otnosheniya"');
    expect(markup).toContain('href="/taro/rasklady"');
    expect(markup).not.toContain('href="/taro/rasklady/tri-karty"');
  });
});
