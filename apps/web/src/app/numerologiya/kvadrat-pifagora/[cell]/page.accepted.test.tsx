import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import SquarePage, { generateMetadata, generateStaticParams } from "./page";

vi.mock("@oracle/content/numerology", async (importOriginal) => (await import("../square-fixtures")).mockSquareAccepted(importOriginal as never));

const params = (cell: string) => ({ params: Promise.resolve({ cell }) });
const graphOf = (html: string) => {
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  return JSON.parse(json.replace(/</g, "<"))["@graph"] as { "@type": string; itemListElement?: { name: string }[] }[];
};

test("9 cells and the lines page, each with its own canonical and description", async () => {
  expect(generateStaticParams().map((p) => p.cell)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "linii"]);
  const m = await generateMetadata(params("4"));
  expect(m.alternates?.canonical).toBe("/numerologiya/kvadrat-pifagora/4");
  const seen = new Set<string>();
  for (const { cell } of generateStaticParams()) seen.add(String((await generateMetadata(params(cell))).description));
  expect(seen.size).toBe(10);
});

test("cell 4: anchors for every variant, JSON-LD, links to the calculator, lines and neighbours", async () => {
  const html = renderToStaticMarkup(await SquarePage(params("4")));
  for (const id of ["pusto", "4", "44", "444", "4444", "44444"]) expect(html).toContain(`id="${id}"`);
  const graph = graphOf(html);
  expect(graph.map((i) => i["@type"])).toEqual(["Article", "FAQPage", "BreadcrumbList"]);
  expect(graph[2]?.itemListElement?.map((i) => i.name)).toEqual(["Нумерология", "Квадрат Пифагора", "Ячейка 4"]);
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora"');
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora/linii"');
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora/5"');
});

test("lines page: an anchor for every line", async () => {
  const html = renderToStaticMarkup(await SquarePage(params("linii")));
  for (const id of ["celeustremlennost", "semya", "privychki", "samoocenka", "byt", "talant", "duhovnost", "temperament"]) expect(html).toContain(`id="${id}"`);
  expect(graphOf(html)[2]?.itemListElement?.map((i) => i.name)).toEqual(["Нумерология", "Квадрат Пифагора", "Линии"]);
});
