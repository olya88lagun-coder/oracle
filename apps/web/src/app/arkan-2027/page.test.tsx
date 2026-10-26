import { ARCANA } from "@oracle/content";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import Page, { metadata } from "./page";
import { arcanumPath } from "@/lib/arcana-paths";
import { PUBLIC_PATHS } from "@/lib/seo";
import { YEAR_FAQ, YEAR_PATH } from "@/lib/year-arcana";

test("indexable canonical page includes calculator, truthful offer and identical FAQ JSON-LD", () => {
  const html = renderToStaticMarkup(<Page />);
  expect(metadata.alternates?.canonical).toBe(YEAR_PATH);
  expect(metadata.description).toContain("2027");
  expect(PUBLIC_PATHS.filter((path) => path === YEAR_PATH)).toHaveLength(1);
  expect((html.match(/<h1[ >]/g) ?? []).length).toBe(1);
  expect(html).toContain('type="date"');
  expect(html).toContain("390");
  expect(html).toContain("не прогноз");
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]!);
  const faq = schema["@graph"].find((item: { "@type": string }) => item["@type"] === "FAQPage");
  expect(html.indexOf('id="year-catalog-title"')).toBeGreaterThan(html.indexOf('id="year-guide-title"'));
  expect(html.indexOf('id="year-catalog-title"')).toBeLessThan(html.indexOf('id="year-faq-title"'));
  expect(ARCANA.every((arcanum) => html.includes(`href="${arcanumPath(arcanum)}"`))).toBe(true);
  expect(faq.mainEntity).toEqual(YEAR_FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })));
});
