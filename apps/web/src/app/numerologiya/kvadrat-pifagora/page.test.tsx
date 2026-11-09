import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { PYTHAGORAS_PATH, SQUARE_FAQ } from "@/lib/pythagoras";
import Page, { metadata } from "./page";

const html = renderToStaticMarkup(<Page />);

test("metadata answers «квадрат пифагора по дате рождения»", () => {
  const title = String(metadata.title);
  expect(title.startsWith("Квадрат Пифагора по дате рождения")).toBe(true);
  expect(title.length + " — Твой оракул".length).toBeLessThanOrEqual(60);
  const description = String(metadata.description);
  expect(description.length).toBeGreaterThanOrEqual(90);
  expect(description.length).toBeLessThanOrEqual(175);
  expect(metadata.alternates?.canonical).toBe(PYTHAGORAS_PATH);
});

test("one h1, the form, JSON-LD and no links to closed pages", () => {
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
  expect(html).toContain(">Дата рождения</label>");
  expect(html).toContain(">Построить квадрат</button>");
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  const graph = JSON.parse(json.replace(/</g, "<"))["@graph"] as { "@type": string; mainEntity?: { name: string }[] }[];
  expect(graph.map((i) => i["@type"])).toEqual(["WebApplication", "FAQPage", "BreadcrumbList"]);
  expect(graph[1]?.mainEntity?.map((q) => q.name)).toEqual(SQUARE_FAQ.map((q) => q.question));
  expect(html).toContain('href="/numerologiya"');
});

test("the square is public and linked from the numerology hub", async () => {
  const { PUBLIC_PATHS } = await import("@/lib/seo");
  const { default: NumerologyPage } = await import("@/app/numerologiya/page");
  const { acceptedSquarePaths } = await import("@/lib/numerology-pages");
  expect(PUBLIC_PATHS).toContain(PYTHAGORAS_PATH);
  for (const path of acceptedSquarePaths()) expect(PUBLIC_PATHS).toContain(path);
  expect(renderToStaticMarkup(<NumerologyPage />)).toContain(`href="${PYTHAGORAS_PATH}"`);
});
