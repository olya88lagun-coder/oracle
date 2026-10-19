import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import NatalMeaningPage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("/natalnaya-karta/[slug]", () => {
  test("builds only the 36 pages of the accepted batch and answers 404 to everything else", () => {
    expect(dynamicParams).toBe(false);
    const slugs = generateStaticParams().map((item) => item.slug);
    expect(slugs).toHaveLength(36);
    expect(slugs).toContain("solntse-v-ovne");
    expect(slugs).not.toContain("merkuriy-v-ovne");
  });

  test("an address of a closed batch or an unknown one is a real 404", async () => {
    await expect(NatalMeaningPage(params("merkuriy-v-ovne"))).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
    await expect(NatalMeaningPage(params("net-takoy"))).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
    expect(await generateMetadata(params("merkuriy-v-ovne"))).toEqual({});
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
    expect(seen.size).toBe(36);
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
