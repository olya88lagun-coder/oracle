import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import FatePage, { generateMetadata, generateStaticParams } from "./page";

vi.mock("../../../../../../../packages/content/src/numerology-manifest", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  NUMEROLOGY_ACCEPTED_BATCHES: new Set([1, 2]),
}));

const params = (n: string) => ({ params: Promise.resolve({ n }) });

test("12 pages including masters", () => {
  expect(generateStaticParams().map((p) => p.n)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "22", "33"]);
});

test("own title, description, canonical and index,follow; all different", async () => {
  const m = await generateMetadata(params("7"));
  expect(m.title).toBe("Число судьбы 7 — значение в нумерологии");
  expect(m.alternates?.canonical).toBe("/numerologiya/chislo-sudby/7");
  expect(m.robots).toEqual({ index: true, follow: true });
  const seen = new Set<string>();
  for (const { n } of generateStaticParams()) {
    const meta = await generateMetadata(params(n));
    seen.add(`${String(meta.title)}|${String(meta.description)}`);
  }
  expect(seen.size).toBe(12);
});

test("renders Article + BreadcrumbList, sections, links to neighbours and the calculator", async () => {
  const html = renderToStaticMarkup(await FatePage(params("11")));
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  const graph = JSON.parse(json.replace(/\u003c/g, "<"))["@graph"] as { "@type": string; itemListElement?: { name: string }[] }[];
  expect(graph.map((item) => item["@type"])).toEqual(["Article", "BreadcrumbList"]);
  expect(graph[1]?.itemListElement?.map((i) => i.name)).toEqual(["Нумерология", "Число судьбы 11"]);
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
  for (const title of ["Суть", "Сильные стороны", "Сложности", "Отношения", "Дело", "Вопрос для себя"]) expect(html).toContain(`>${title}</h2>`);
  expect(html).toContain('href="/numerologiya/chislo-sudby/9"');
  expect(html).toContain('href="/numerologiya/chislo-sudby/22"');
  expect(html).toContain('href="/numerologiya"');
});
