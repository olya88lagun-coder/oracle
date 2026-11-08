import { NUMEROLOGY_ACCEPTED_BATCHES } from "@oracle/content/numerology";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { FATE_FAQ, NUMEROLOGY_PATH } from "@/lib/numerology";
import { PUBLIC_PATHS } from "@/lib/seo";
import Page, { metadata } from "./page";

const TITLE_SUFFIX = " — Твой оракул";
const SERP_TITLE_LIMIT = 60;

const graphOf = (html: string) => {
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  return JSON.parse(json.replace(/\\u003c/g, "<"))["@graph"] as { "@type": string; mainEntity?: { name: string }[] }[];
};

test("title and description answer «число судьбы рассчитать по дате рождения» within snippet limits", () => {
  const title = String(metadata.title);
  const description = String(metadata.description);
  expect(title.startsWith("Число судьбы по дате рождения")).toBe(true);
  expect(title.length + TITLE_SUFFIX.length).toBeLessThanOrEqual(SERP_TITLE_LIMIT);
  expect(description).toContain("по дате рождения");
  expect(description).toContain("без регистрации");
  expect(description.length).toBeGreaterThanOrEqual(90);
  expect(description.length).toBeLessThanOrEqual(175);
  expect(metadata.alternates?.canonical).toBe(NUMEROLOGY_PATH);
});

test("JSON-LD has the calculator, FAQ from FATE_FAQ and breadcrumbs, before <main>", () => {
  const html = renderToStaticMarkup(<Page />);
  const graph = graphOf(html);
  expect(graph.map((item) => item["@type"])).toEqual(["WebApplication", "FAQPage", "BreadcrumbList"]);
  expect(graph[1]?.mainEntity?.map((q) => q.name)).toEqual(FATE_FAQ.map((q) => q.question));
  expect(html.indexOf("application/ld+json")).toBeLessThan(html.indexOf("<main"));
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
});

test("the section is public; the catalog links only to accepted numbers", () => {
  expect(PUBLIC_PATHS).toContain(NUMEROLOGY_PATH);
  const html = renderToStaticMarkup(<Page />);
  const links = html.match(/href="\/numerologiya\/chislo-sudby\/\d+"/g) ?? [];
  expect(links.length).toBe(NUMEROLOGY_ACCEPTED_BATCHES.has(1) ? 12 : 0);
  expect(html).toContain('href="/matrica-sudby"');
});
