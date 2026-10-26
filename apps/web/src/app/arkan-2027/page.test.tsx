import { ARCANA, arcanumByNumber } from "@oracle/content";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import Page, { metadata } from "./page";
import { arcanumPath } from "@/lib/arcana-paths";
import { PUBLIC_PATHS } from "@/lib/seo";
import { YEAR_FAQ, YEAR_PATH } from "@/lib/year-arcana";

const TITLE_SUFFIX = " — Твой оракул";
const SERP_TITLE_LIMIT = 60;

test("title and description use the wording people search for, within snippet limits", () => {
  const title = String(metadata.title);
  const description = String(metadata.description);
  expect(title.startsWith("Аркан на 2027 год")).toBe(true);
  expect(title).toContain("рассчитать");
  expect(title).toContain("по дате рождения");
  expect(title.length + TITLE_SUFFIX.length).toBeLessThanOrEqual(SERP_TITLE_LIMIT);
  expect(description).toContain("Какой аркан на 2027 год");
  expect(description).toContain("по дате рождения");
  expect(description).toContain("Бесплатно");
  expect(description.length).toBeGreaterThan(100);
  expect(description.length).toBeLessThanOrEqual(160);
});

test("the FAQ answers the searched questions: how to calculate and which arcanum the year itself is", () => {
  const questions = YEAR_FAQ.map((item) => item.question);
  expect(questions[0]).toBe("Как рассчитать аркан на 2027 год по дате рождения?");
  const yearQuestion = YEAR_FAQ.find((item) => item.question === "Под каким арканом будет 2027 год?");
  expect(yearQuestion).toBeDefined();
  expect(yearQuestion!.answer).toContain("2 + 0 + 2 + 7 = 11");
  expect(yearQuestion!.answer).toContain(arcanumByNumber(11)!.name);
  expect(yearQuestion!.answer).toMatch(/не предсказывают/);
  expect(new Set(questions).size).toBe(questions.length);
});

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
