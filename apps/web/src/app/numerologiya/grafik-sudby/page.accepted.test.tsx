import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import NumerologyPage from "@/app/numerologiya/page";
import { THREAD_FAQ, THREAD_PATH } from "@/lib/life-thread";
import { PERSONAL_YEAR_PATH } from "@/lib/numerology";
import { acceptedThreadPaths } from "@/lib/numerology-pages";
import { PUBLIC_PATHS } from "@/lib/seo";
import Page, { metadata } from "./page";

// Страница читает вошедшего и флаги продажи: в тестах гость без продажи
vi.mock("@/server/viewer", () => ({ currentUser: async () => null }));
vi.mock("@/server/owner", () => ({ isOwnerUser: async () => false }));
vi.mock("@/server/payments-deps", () => ({ salesEnabled: () => false }));

vi.mock("@oracle/content/numerology", async (importOriginal) => (await import("./thread-fixtures")).mockThreadAccepted(importOriginal as never));

test("with batch 9 accepted the page, the site map and the hub all open", () => {
  expect(acceptedThreadPaths()).toEqual([THREAD_PATH]);
  expect(PUBLIC_PATHS).toContain(THREAD_PATH);
  expect(renderToStaticMarkup(<NumerologyPage />)).toContain(`href="${THREAD_PATH}"`);
});

test("metadata answers «график судьбы по дате рождения»", () => {
  const title = String(metadata.title);
  expect(title.startsWith("График судьбы по дате рождения")).toBe(true);
  expect(title.length + " — Твой оракул".length).toBeLessThanOrEqual(60);
  const description = String(metadata.description);
  expect(description.length).toBeGreaterThanOrEqual(90);
  expect(description.length).toBeLessThanOrEqual(175);
  expect(metadata.alternates?.canonical).toBe(THREAD_PATH);
});

test("one h1, JSON-LD with the app, the FAQ and the breadcrumbs, and a link to the personal year", async () => {
  const html = renderToStaticMarkup(await Page());
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
  const graph = JSON.parse(json.replace(/</g, "<"))["@graph"] as { "@type": string; mainEntity?: { name: string }[] }[];
  expect(graph.map((item) => item["@type"])).toEqual(["WebApplication", "FAQPage", "BreadcrumbList"]);
  expect(graph[1]?.mainEntity?.map((q) => q.name)).toEqual(THREAD_FAQ.map((q) => q.question));
  expect(html).toContain(`href="${PERSONAL_YEAR_PATH}"`);
});
