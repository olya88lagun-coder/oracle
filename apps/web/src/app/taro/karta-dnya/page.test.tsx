import { TAROT_CARDS } from "@oracle/content/tarot";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { TARO_DAY_FAQ } from "@/components/taro/TaroDayGuide";
import { SITE_URL } from "@/lib/site";
import TaroDayPage, { metadata } from "./page";

const markup = renderToStaticMarkup(<TaroDayPage />);
const jsonLd = [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]!.replace(/\\u003c/g, "<")) as Record<string, unknown>);
const text = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
const guide = /<div class="taro-day-info"[\s\S]*/.exec(markup)?.[0] ?? "";

describe("/taro/karta-dnya", () => {
  test("has a soft bridge to the free matrix calculation, once and below the instructions", () => {
    expect(markup.match(/>Рассчитать матрицу бесплатно<\/a>/g)).toHaveLength(1);
    expect(markup.indexOf("От карты к своей схеме")).toBeGreaterThan(markup.indexOf("Как пользоваться картой дня"));
  });

  test("links the free 2027 arcana once, right after the matrix bridge", () => {
    expect(markup.match(/href="\/arkan-2027"/g)).toHaveLength(1);
    expect(markup.indexOf('href="/arkan-2027"')).toBeGreaterThan(markup.indexOf("От карты к своей схеме"));
    expect(markup.indexOf('href="/arkan-2027"')).toBeLessThan(markup.indexOf("Карты дня по старшим арканам"));
  });

  test("title leads with the card of the day query and keeps «гадание» in the second part", () => {
    expect(metadata.title).toBe("Карта дня Таро на сегодня — гадание онлайн бесплатно");
    expect(String(metadata.title).indexOf("Карта дня Таро")).toBe(0);
    expect(String(metadata.title).indexOf("гадание")).toBeGreaterThan(String(metadata.title).indexOf("—"));
  });

  test("description is a snippet of up to 160 characters with the query words, a canonical address and index,follow", () => {
    const description = String(metadata.description);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description.length).toBeGreaterThan(100);
    expect(description).toContain("Карта дня Таро");
    expect(description).toContain("бесплатно");
    expect(metadata.alternates?.canonical).toBe("/taro/karta-dnya");
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  test("keeps the single «Карта дня» heading and the draw controls the e2e tests rely on", () => {
    expect(markup.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(text(/<h1[\s\S]*?<\/h1>/.exec(markup)![0])).toBe("Карта дня");
    expect(markup).toContain("Выберите одну из трёх карт.");
    for (const label of ["Карта 1", "Карта 2", "Карта 3"]) expect(markup).toContain(`aria-label="${label}"`);
    expect(markup).toContain("Как работает карта дня");
  });

  test("has readable text below the draw: what it is, how to use it, links by arcana and the FAQ", () => {
    const headings = [...guide.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((match) => text(match[1]!));
    expect(headings).toEqual(["Что такое карта дня Таро", "Как пользоваться картой дня", "От карты к своей схеме", "От карты дня — к символу года", "Карты дня по старшим арканам", "Частые вопросы о карте дня"]);
    expect(text(guide).split(" ").length).toBeGreaterThanOrEqual(400);
  });

  test("links to every major arcanum card page and to the whole deck", () => {
    const majors = TAROT_CARDS.filter((card) => card.suit === "major");
    expect(majors).toHaveLength(22);
    for (const card of majors) expect(guide).toContain(`href="/taro/karty/${card.slug}"`);
    expect(guide).toContain('href="/taro#znacheniya"');
  });

  test("leads to the spreads for a deeper look", () => {
    expect(guide).toContain('href="/taro/rasklady"');
  });

  test("the FAQ is on the page and in the FAQPage markup, word for word", () => {
    expect(TARO_DAY_FAQ.length).toBeGreaterThanOrEqual(6);
    const faq = jsonLd.find((item) => item["@type"] === "FAQPage") as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(faq.mainEntity.map((item) => item.name)).toEqual(TARO_DAY_FAQ.map((item) => item.question));
    for (const item of TARO_DAY_FAQ) {
      expect(text(guide)).toContain(item.question);
      expect(text(guide)).toContain(item.answer);
    }
  });

  test("the «гадание» word is answered honestly in the FAQ", () => {
    const question = TARO_DAY_FAQ.find((item) => item.question === "Это гадание?");
    expect(question?.answer).toMatch(/не обещаем/);
  });

  test("breadcrumbs lead from the tarot section to the card of the day, before the page", () => {
    const crumbs = jsonLd.find((item) => item["@type"] === "BreadcrumbList") as { itemListElement: { name: string; item: string }[] };
    expect(crumbs.itemListElement.map((item) => item.name)).toEqual(["Таро", "Карта дня"]);
    expect(crumbs.itemListElement.map((item) => item.item)).toEqual([`${SITE_URL}/taro`, `${SITE_URL}/taro/karta-dnya`]);
    expect(markup.indexOf("application/ld+json")).toBeLessThan(markup.indexOf("<main"));
  });

  test("does not promise a prediction", () => {
    expect(text(guide)).not.toMatch(/точн(ый|ое|ого) (прогноз|ответ)|гарантир|узнаете будущее|вернётся ли|что он чувствует/i);
  });
});
