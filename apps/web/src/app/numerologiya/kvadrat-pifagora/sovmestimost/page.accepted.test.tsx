import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { PYTHAGORAS_COMPAT_PATH } from "@/lib/pythagoras-compat";
import { PUBLIC_PATHS } from "@/lib/seo";
import PairPage, { generateMetadata } from "./page";

vi.mock("@oracle/content/numerology", async (importOriginal) => (await import("../square-fixtures")).mockPairAccepted(importOriginal as never));

test("one h1, intro sections, faq, JSON-LD with FAQPage and three breadcrumbs", () => {
  const html = renderToStaticMarkup(<PairPage />);
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
  expect(html).toContain("Совместимость по квадрату Пифагора</h1>");
  expect(html).toContain("Как считается совместимость по квадрату");
  expect(html).toContain("Первый абзац: Как читать сравнение.");
  expect(html).toContain("Частые вопросы");
  expect(html).toContain("Первый вопрос?");
  const jsonLd = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)?.[1] ?? "{}");
  const types = jsonLd["@graph"].map((item: { "@type": string }) => item["@type"]);
  expect(types).toEqual(["WebApplication", "FAQPage", "BreadcrumbList"]);
  expect(jsonLd["@graph"][2].itemListElement).toHaveLength(3);
});

test("metadata title and canonical; the address is in the sitemap", async () => {
  const metadata = await generateMetadata();
  expect(String(metadata.title)).toContain("Совместимость по квадрату Пифагора онлайн");
  expect(String(metadata.alternates?.canonical)).toContain(PYTHAGORAS_COMPAT_PATH);
  expect(PUBLIC_PATHS).toContain(PYTHAGORAS_COMPAT_PATH);
});
