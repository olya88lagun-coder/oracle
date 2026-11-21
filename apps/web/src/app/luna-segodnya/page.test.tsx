import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { buildMoonToday, MOON_PATH } from "@/lib/moon-today";
import Page, { metadata } from "./page";

const TITLE_SUFFIX = " — Твой оракул";
const html = () => renderToStaticMarkup(<Page />);
const visibleText = (markup: string) => markup.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
const graphOf = (markup: string) => {
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(markup)?.[1] ?? "";
  return JSON.parse(json.replace(/\u003c/g, "<"))["@graph"] as { "@type": string }[];
};

test("metadata: canonical path, title and description within snippet limits", () => {
  expect(metadata.alternates?.canonical).toBe(MOON_PATH);
  expect(String(metadata.title).length + TITLE_SUFFIX.length).toBeLessThanOrEqual(60);
  expect(String(metadata.description).length).toBeGreaterThanOrEqual(90);
  expect(String(metadata.description).length).toBeLessThanOrEqual(175);
});

test("one h1 that starts with «Луна сегодня,» and says it is for Moscow", () => {
  const markup = html();
  expect(markup.match(/<h1/g)).toHaveLength(1);
  expect(/<h1[^>]*>Луна сегодня, [^<]+<\/h1>/.test(markup)).toBe(true);
  expect(markup).toContain("По Москве");
});

test("JSON-LD has the page, a FAQ and breadcrumbs", () => {
  const types = graphOf(html()).map((entry) => entry["@type"]);
  expect(types).toEqual(expect.arrayContaining(["WebPage", "FAQPage", "BreadcrumbList"]));
});

test("shows the disc with eight ticks, four tiles, the next phase and a 14-day strip", () => {
  const markup = html();
  expect(markup).toContain("moon-disc");
  expect(markup.match(/class="moon-disc__tick( is-current)?"/g)).toHaveLength(8);
  expect(markup.match(/class="moon-tile"/g)).toHaveLength(4);
  expect(markup).toContain("moon-next");
  expect(markup.match(/class="moon-strip__day/g)).toHaveLength(14);
});

test("links to the card of the day, the natal chart and the Moon's sign page", () => {
  const markup = html();
  expect(markup).toContain('href="/taro/karta-dnya"');
  expect(markup).toContain('href="/natalnaya-karta"');
  expect(markup).toMatch(/href="\/natalnaya-karta\/luna-v-[a-z]+"/);
});

test("shows the three accepted text blocks: the phase, the lunar day and the Moon's sign, with a question for oneself", () => {
  const markup = html();
  expect(markup).toContain("moon-text");
  expect(markup.match(/class="moon-text__block"/g)).toHaveLength(3);
  expect(markup).toContain("moon-text__question");
  expect(markup).not.toContain("<h3></h3>");
});

test("the visible text has no forbidden word and carries the disclaimer", () => {
  const text = visibleText(html());
  for (const word of FORBIDDEN_MOON_WORDS) expect(text, word).not.toContain(word);
  expect(text).toContain("самопознания");
});

test("links to the lunar calendar page of the current month", () => {
  const markup = html();
  expect(markup).toMatch(/<a [^>]*href="\/lunnyy-kalendar\/[a-z]+-\d{4}"[^>]*>Лунный календарь на месяц<\/a>/);
});

test("shows the question of the day under the Moon, with no write button before the browser takes over", () => {
  const markup = html();
  const question = buildMoonToday(new Date()).texts.day?.question ?? buildMoonToday(new Date()).texts.phase?.question;
  expect(question).toBeTruthy();
  expect(markup).toContain("moon-ask__question");
  expect(markup).toContain(question!);
  expect(markup).not.toContain("Записать мысль на сегодня");
});

test("the question comes after the disc and before the 14-day strip", () => {
  const markup = html();
  const ask = markup.indexOf('class="moon-ask"');
  expect(ask).toBeGreaterThan(markup.indexOf("moon-disc__caption"));
  expect(ask).toBeLessThan(markup.indexOf("moon-strip__list"));
});

const card = (markup: string, kind: string) => new RegExp(`<article class="moon-text__block" data-kind="${kind}">([\\s\\S]*?)</article>`).exec(markup)?.[1] ?? "";

test("each of the three cards has a picture area: engravings for the phase and the sign, the day number while the day engravings are not ready", () => {
  const markup = html();
  expect(markup.match(/class="moon-text__art"/g)).toHaveLength(3);
  expect(card(markup, "phase")).toMatch(/src="\/luna\/phases\/[a-zA-Z]+-480\.webp"/);
  expect(card(markup, "sign")).toMatch(/src="\/luna\/signs\/[a-z]+-480\.webp"/);
  const day = card(markup, "day");
  expect(day).not.toContain("<img");
  expect(day).toContain(`<span class="moon-text__numeral">${buildMoonToday(new Date()).lunarDay.number}</span>`);
});

test("the cards carry the same small labels as the tiles", () => {
  const markup = html();
  expect(card(markup, "phase")).toContain(">Фаза<");
  expect(card(markup, "day")).toContain(">Лунные сутки<");
  expect(card(markup, "sign")).toContain(">Знак Луны<");
});
