import { findStopPhrases } from "@oracle/content";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { NATAL_FAQ, NatalGuide, natalFaqJsonLd } from "./NatalGuide";

const text = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("NatalGuide", () => {
  const html = renderToStaticMarkup(<NatalGuide />);

  test("shows every question once and publishes the same ones as FAQPage markup", () => {
    for (const item of NATAL_FAQ) expect(html.split(item.question)).toHaveLength(2);
    const ld = natalFaqJsonLd();
    expect(ld["@type"]).toBe("FAQPage");
    const entities = ld.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(entities.map((entity) => entity.name)).toEqual(NATAL_FAQ.map((item) => item.question));
    expect(entities.map((entity) => entity.acceptedAnswer.text)).toEqual(NATAL_FAQ.map((item) => item.answer));
  });

  test("answers the question about an unknown birth time and says what is lost", () => {
    const item = NATAL_FAQ.find((entry) => entry.question === "Что делать, если я не знаю время рождения?");
    expect(item?.answer).toContain("Время рождения неизвестно");
    expect(item?.answer).toMatch(/асцендент/);
    expect(item?.answer).toMatch(/домов/);
    expect(item?.answer).toMatch(/аспекты Луны/);
  });

  test("explains why charts on different sites differ, with the settings used here, and links to the methodology", () => {
    const item = NATAL_FAQ.find((entry) => entry.question === "Почему на разных сайтах карта получается разной?");
    expect(item?.answer).toContain("Плацидус");
    expect(item?.answer).toContain("средний");
    expect(html).toContain('href="/metodika"');
  });

  test("says that nothing is stored until the person decides to", () => {
    const item = NATAL_FAQ.find((entry) => entry.question === "Куда уходят дата, время и место рождения?");
    expect(item?.answer).toContain("Расчёт идёт в вашем браузере");
    expect(item?.answer).toMatch(/поиск города/);
  });

  test("keeps one section with its own h2, no h1, no prediction stop phrases and no promises", () => {
    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html).not.toMatch(/<h1/);
    expect(findStopPhrases(text(html))).toEqual([]);
    expect(text(html)).not.toMatch(/гарант|всегда точн|предскажем/i);
  });

  test("reuses the details-based FAQ markup, the first question open", () => {
    expect(html.match(/<details/g)).toHaveLength(NATAL_FAQ.length);
    expect(html.match(/<details open/g)).toHaveLength(1);
  });
});
