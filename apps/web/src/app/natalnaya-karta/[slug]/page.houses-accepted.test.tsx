import { NATAL_HOUSE_PAGES } from "@oracle/content/natal";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import sitemap from "../../sitemap";
import NatalMeaningPage, { generateMetadata, generateStaticParams } from "./page";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("/natalnaya-karta/[slug] «planet in house» pages (batch 6, accepted)", () => {
  test("all twelve house pages are built and listed in the sitemap", () => {
    const slugs = generateStaticParams().map((item) => item.slug);
    const urls = sitemap().map((entry) => entry.url);
    for (const page of NATAL_HOUSE_PAGES) {
      expect(slugs).toContain(page.slug);
      expect(urls.some((url) => url.endsWith(`/natalnaya-karta/${page.slug}`)), page.slug).toBe(true);
    }
    expect(slugs).toContain("solntse-v-ovne");
  });

  test("has its own title and canonical address", async () => {
    const metadata = await generateMetadata(params("venera-v-7-dome"));
    expect(metadata.title).toBe("Венера в 7 доме: значение в натальной карте");
    expect(metadata.alternates?.canonical).toBe("/natalnaya-karta/venera-v-7-dome");
    expect(String(metadata.description).length).toBeLessThanOrEqual(160);
  });

  test("renders one h1, the «planet in house» label, the emblem without a cover and links to other open houses", async () => {
    const markup = renderToStaticMarkup(await NatalMeaningPage(params("venera-v-7-dome")));
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('<h1 id="meaning-title">Венера в 7 доме</h1>');
    expect(markup).toContain("Планета в доме");
    expect(markup).toContain('aria-label="Венера и 7 дом"');
    expect(markup).toContain("Венера в других домах");
    expect(markup).toContain('href="/natalnaya-karta/venera-v-4-dome"');
    expect(markup).toContain('href="/natalnaya-karta/venera-v-10-dome"');
    expect(markup).toContain("Соседние дома");
    expect(markup).not.toContain("natal-node-axis");
    expect(markup).not.toContain("natal-cover");
  });

  test("the sign page of the same planet links to its open house pages", async () => {
    const markup = renderToStaticMarkup(await NatalMeaningPage(params("venera-v-vesah")));
    expect(markup).toContain("Венера в домах");
    for (const house of [1, 4, 7, 10]) expect(markup).toContain(`href="/natalnaya-karta/venera-v-${house}-dome"`);
    expect(markup).not.toContain('href="/natalnaya-karta/mars-v-1-dome"');
  });
});
