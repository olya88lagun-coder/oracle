import { ACCEPTED_BATCHES, NATAL_PAGES } from "@oracle/content/natal";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import NatalMeaningPage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;
// Принятые партии открыты, остальные (если ещё есть) закрыты настоящим 404
const accepted = NATAL_PAGES.filter((page) => ACCEPTED_BATCHES.has(page.batch));
const closed = NATAL_PAGES.find((page) => !ACCEPTED_BATCHES.has(page.batch));

describe("/natalnaya-karta/[slug]", () => {
  test("builds only the pages of the accepted batches and answers 404 to everything else", () => {
    expect(dynamicParams).toBe(false);
    const slugs = generateStaticParams().map((item) => item.slug);
    expect(slugs).toHaveLength(accepted.length);
    expect(slugs).toContain("solntse-v-ovne");
    if (closed) expect(slugs).not.toContain(closed.slug);
  });

  test("an address of a closed batch or an unknown one is a real 404", async () => {
    if (closed) {
      await expect(NatalMeaningPage(params(closed.slug))).rejects.toThrow(NOT_FOUND);
      expect(await generateMetadata(params(closed.slug))).toEqual({});
    }
    await expect(NatalMeaningPage(params("net-takoy"))).rejects.toThrow(NOT_FOUND);
    expect(await generateMetadata(params("net-takoy"))).toEqual({});
  });

  test("has its own title, a description of up to 160 characters, a canonical address and index,follow", async () => {
    const metadata = await generateMetadata(params("solntse-v-ovne"));
    expect(metadata.title).toBe("Солнце в Овне: значение в натальной карте");
    expect(String(metadata.description).length).toBeLessThanOrEqual(160);
    expect(String(metadata.description).length).toBeGreaterThan(60);
    expect(metadata.alternates?.canonical).toBe("/natalnaya-karta/solntse-v-ovne");
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  test("every accepted page has a different title and description", async () => {
    const seen = new Set<string>();
    for (const { slug } of generateStaticParams()) {
      const metadata = await generateMetadata(params(slug));
      seen.add(`${String(metadata.title)}|${String(metadata.description)}`);
    }
    expect(seen.size).toBe(accepted.length);
  });

  test("renders the Article and BreadcrumbList markup before the page", async () => {
    const markup = renderToStaticMarkup(await NatalMeaningPage(params("luna-v-rake")));
    const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(markup)?.[1] ?? "";
    const graph = JSON.parse(json.replace(/\\u003c/g, "<"))["@graph"] as { "@type": string; headline?: string; itemListElement?: { name: string }[] }[];
    expect(graph.map((item) => item["@type"])).toEqual(["Article", "BreadcrumbList"]);
    expect(graph[0]?.headline).toBe("Луна в Раке: значение в натальной карте");
    expect(graph[1]?.itemListElement?.map((item) => item.name)).toEqual(["Натальная карта", "Луна в Раке"]);
    expect(markup.indexOf("application/ld+json")).toBeLessThan(markup.indexOf("<main"));
  });
});
