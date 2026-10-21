import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { TARO_FAQ } from "@/components/taro/TaroGuide";
import TaroPage, { metadata } from "./page";

const markup = renderToStaticMarkup(<TaroPage />);
const jsonLd = [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]!.replace(/\\u003c/g, "<")) as Record<string, unknown>);
const text = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
const faqSection = /<section[^>]*aria-labelledby="taro-faq"[\s\S]*?<\/section>/.exec(markup)?.[0] ?? "";

describe("/taro", () => {
  test("title leads with «Таро онлайн» and names the card of the day and the 78 cards", () => {
    expect(metadata.title).toBe("Таро онлайн: карта дня и значения 78 карт");
  });

  test("description is a snippet of up to 160 characters, with a canonical address and index,follow", () => {
    const description = String(metadata.description);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description.length).toBeGreaterThan(100);
    expect(description).toContain("Карта дня онлайн");
    expect(description).toContain("78 карт");
    expect(description).toContain("Бесплатно");
    expect(metadata.alternates?.canonical).toBe("/taro");
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  test("keeps the single «Таро и карта дня» heading that the e2e tests rely on", () => {
    expect(markup.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(text(/<h1[\s\S]*?<\/h1>/.exec(markup)![0])).toBe("Таро и карта дня");
  });

  test("the FAQ has at least seven questions and each one is on the page and in the FAQPage markup, word for word", () => {
    expect(TARO_FAQ.length).toBeGreaterThanOrEqual(7);
    const faq = jsonLd.find((item) => item["@type"] === "FAQPage") as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(faq.mainEntity.map((item) => item.name)).toEqual(TARO_FAQ.map((item) => item.question));
    expect(faq.mainEntity.map((item) => item.acceptedAnswer.text)).toEqual(TARO_FAQ.map((item) => item.answer));
    for (const item of TARO_FAQ) {
      expect(text(faqSection)).toContain(item.question);
      expect(text(faqSection)).toContain(item.answer);
    }
  });

  test("answers the search words «расклад» and «гадание» honestly: only the card of the day and the card meanings exist", () => {
    const item = TARO_FAQ.find((entry) => /расклад/i.test(entry.question) && /погадать/i.test(entry.question));
    expect(item?.answer).toMatch(/бесплатно и без регистрации/);
    expect(item?.answer).toMatch(/пока не делаем/);
    expect(item?.answer).toMatch(/не предсказывает/);
  });

  test("does not promise a prediction", () => {
    expect(text(faqSection)).not.toMatch(/точн(ый|ое|ого) (прогноз|ответ)|гарантир|узнаете будущее|вернётся ли|что он чувствует/i);
  });
});
