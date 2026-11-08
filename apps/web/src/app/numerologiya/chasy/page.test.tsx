import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import NumerologyPage from "@/app/numerologiya/page";
import { CLOCK_FAQ, CLOCK_PATH } from "@/lib/numerology";
import { PUBLIC_PATHS } from "@/lib/seo";
import Page, { metadata } from "./page";

const html = renderToStaticMarkup(<Page />);
const group = (id: string) => html.slice(html.indexOf(`id="${id}"`), html.indexOf("</section>", html.indexOf(`id="${id}"`)));

test("metadata answers «одинаковое и зеркальное время на часах»", () => {
  const title = String(metadata.title);
  expect(title).toContain("время на часах");
  expect(title.length + " — Твой оракул".length).toBeLessThanOrEqual(60);
  const description = String(metadata.description);
  expect(description.length).toBeGreaterThanOrEqual(90);
  expect(description.length).toBeLessThanOrEqual(175);
  expect(metadata.alternates?.canonical).toBe(CLOCK_PATH);
  expect(PUBLIC_PATHS).toContain(CLOCK_PATH);
});

test("two groups; 00:00, 11:11 and 22:22 stand in both", () => {
  const repeat = group("clock-repeat");
  const mirror = group("clock-mirror");
  for (const label of ["00:00", "11:11", "22:22", "07:07", "19:19"]) expect(repeat).toContain(label);
  for (const label of ["00:00", "11:11", "22:22", "12:21", "01:10"]) expect(mirror).toContain(label);
  expect(repeat).not.toContain("12:21");
  expect(mirror).not.toContain("07:07");
  expect(html).toContain('href="/numerologiya/chasy/11-11"');
});

test("one h1, FAQ + breadcrumbs JSON-LD, link to and from the calculator", () => {
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  const graph = JSON.parse(json.replace(/</g, "<"))["@graph"] as { "@type": string; mainEntity?: { name: string }[] }[];
  expect(graph.map((i) => i["@type"])).toEqual(["FAQPage", "BreadcrumbList"]);
  expect(graph[0]?.mainEntity?.map((q) => q.name)).toEqual(CLOCK_FAQ.map((q) => q.question));
  expect(html).toContain('href="/numerologiya"');
  expect(renderToStaticMarkup(<NumerologyPage />)).toContain(`href="${CLOCK_PATH}"`);
});
