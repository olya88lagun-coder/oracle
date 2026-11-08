import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import ClockPage, { generateMetadata, generateStaticParams } from "./page";

vi.mock("../../../../../../../packages/content/src/numerology-manifest", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  NUMEROLOGY_ACCEPTED_BATCHES: new Set([1, 2, 3, 4, 5]),
}));

const params = (time: string) => ({ params: Promise.resolve({ time }) });

test("all 37 times, own metadata, all different", async () => {
  const all = generateStaticParams().map((p) => p.time);
  expect(all).toHaveLength(37);
  expect(all).toContain("11-11");
  const m = await generateMetadata(params("11-11"));
  expect(m.title).toBe("11:11 на часах — значение в нумерологии");
  expect(m.alternates?.canonical).toBe("/numerologiya/chasy/11-11");
  const seen = new Set<string>();
  for (const time of all) seen.add(String((await generateMetadata(params(time))).description));
  expect(seen.size).toBe(37);
});

test("Article + FAQPage + BreadcrumbList, one h1, one FAQ block, links to the hub and neighbours", async () => {
  const html = renderToStaticMarkup(await ClockPage(params("12-21")));
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  const graph = JSON.parse(json.replace(/</g, "<"))["@graph"] as { "@type": string; mainEntity?: unknown[]; itemListElement?: { name: string }[] }[];
  expect(graph.map((i) => i["@type"])).toEqual(["Article", "FAQPage", "BreadcrumbList"]);
  expect(graph[1]?.mainEntity?.length).toBeGreaterThanOrEqual(2);
  expect(graph[2]?.itemListElement?.map((i) => i.name)).toEqual(["Нумерология", "Время на часах", "12:21"]);
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
  expect((html.match(/>Частые вопросы<\/h2>/g) ?? []).length).toBe(1);
  expect(html).toContain('href="/numerologiya/chasy"');
  expect(html).toMatch(/href="\/numerologiya\/chasy\/\d{2}-\d{2}"/);
});
