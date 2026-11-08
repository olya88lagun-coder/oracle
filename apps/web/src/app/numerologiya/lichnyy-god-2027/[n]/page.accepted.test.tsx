import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import YearNumberPage, { generateMetadata, generateStaticParams } from "./page";

vi.mock("../../../../../../../packages/content/src/numerology-manifest", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  NUMEROLOGY_ACCEPTED_BATCHES: new Set([1, 2]),
}));

const params = (n: string) => ({ params: Promise.resolve({ n }) });

test("9 pages with own metadata and crumbs, three advice items, links back", async () => {
  expect(generateStaticParams().map((p) => p.n)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  const m = await generateMetadata(params("4"));
  expect(m.alternates?.canonical).toBe("/numerologiya/lichnyy-god-2027/4");
  const html = renderToStaticMarkup(await YearNumberPage(params("4")));
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  const graph = JSON.parse(json.replace(/\u003c/g, "<"))["@graph"] as { "@type": string; itemListElement?: { name: string }[] }[];
  expect(graph[1]?.itemListElement?.map((i) => i.name)).toEqual(["Нумерология", "Личный год 2027", "Личный год 4"]);
  expect((html.match(/<li>/g) ?? []).length).toBeGreaterThanOrEqual(3);
  expect(html).toContain('href="/numerologiya/lichnyy-god-2027"');
  expect(html).toContain('href="/numerologiya/lichnyy-god-2027/5"');
});
