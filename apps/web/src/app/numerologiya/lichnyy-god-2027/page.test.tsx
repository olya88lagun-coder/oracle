import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import YearPage from "@/app/arkan-2027/page";
import { PERSONAL_YEAR_FAQ, PERSONAL_YEAR_PATH } from "@/lib/numerology";
import { PUBLIC_PATHS } from "@/lib/seo";
import Page, { metadata } from "./page";

test("metadata answers «личный год 2027 по дате рождения»", () => {
  const title = String(metadata.title);
  expect(title.startsWith("Личный год 2027 по дате рождения")).toBe(true);
  expect(title.length + " — Твой оракул".length).toBeLessThanOrEqual(60);
  const description = String(metadata.description);
  expect(description.length).toBeGreaterThanOrEqual(90);
  expect(description.length).toBeLessThanOrEqual(175);
  expect(metadata.alternates?.canonical).toBe(PERSONAL_YEAR_PATH);
  expect(PUBLIC_PATHS).toContain(PERSONAL_YEAR_PATH);
});

test("JSON-LD and links between the personal year and the arcanum of 2027 both ways", () => {
  const html = renderToStaticMarkup(<Page />);
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  const graph = JSON.parse(json.replace(/\u003c/g, "<"))["@graph"] as { "@type": string; mainEntity?: { name: string }[] }[];
  expect(graph.map((i) => i["@type"])).toEqual(["WebApplication", "FAQPage", "BreadcrumbList"]);
  expect(graph[1]?.mainEntity?.map((q) => q.name)).toEqual(PERSONAL_YEAR_FAQ.map((q) => q.question));
  expect(html).toContain('href="/arkan-2027"');
  expect(renderToStaticMarkup(<YearPage />)).toContain(`href="${PERSONAL_YEAR_PATH}"`);
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
});
