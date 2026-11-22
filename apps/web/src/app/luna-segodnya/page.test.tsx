import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { buildMoonToday, MOON_PATH } from "@/lib/moon-today";
import Page, { generateMetadata } from "./page";

const TITLE_SUFFIX = " — Твой оракул";
const html = () => renderToStaticMarkup(<Page />);
const visibleText = (markup: string) => markup.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
const graphOf = (markup: string) => {
  const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(markup)?.[1] ?? "";
  return JSON.parse(json.replace(/\u003c/g, "<"))["@graph"] as { "@type": string }[];
};

test("metadata: canonical path, title and description within snippet limits", () => {
  const metadata = generateMetadata();
  expect(metadata.alternates?.canonical).toBe(MOON_PATH);
  expect(String(metadata.title).length + TITLE_SUFFIX.length).toBeLessThanOrEqual(60);
  expect(String(metadata.description).length).toBeGreaterThanOrEqual(90);
  expect(String(metadata.description).length).toBeLessThanOrEqual(175);
});

test("the link to the sign page says it is about the birth chart, not about today's Moon", () => {
  const markup = html();
  expect(markup).toMatch(/<a [^>]*href="\/natalnaya-karta\/luna-v-[a-z]+"[^>]*>Что означает Луна [^<]+ в карте рождения<\/a>/);
  expect(markup).not.toContain("Значение: Луна");
});

test("the title carries today's date and stays within 60 characters on the longest date", () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date("2026-09-30T09:00:00Z"));
    const title = String(generateMetadata().title);
    expect(title).toContain("30 сентября");
    expect(title.length + TITLE_SUFFIX.length).toBeLessThanOrEqual(60);
  } finally {
    vi.useRealTimers();
  }
});

test("has the «Ваша Луна» bridge to the moon-sign calculator", () => {
  const markup = html();
  expect(markup).toContain('class="moon-bridge"');
  expect(markup).toContain('href="/natalnaya-karta/lunnyy-znak"');
});

test("the share preview has a moon engraving and JSON-LD says when the data was computed", () => {
  const metadata = generateMetadata();
  expect(JSON.stringify(metadata.openGraph?.images)).toMatch(/\/luna\/phases\/[A-Za-z]+\.webp/);
  expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  const page = graphOf(html()).find((entry) => entry["@type"] === "WebPage") as { dateModified?: string };
  expect(page.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\+03:00$/);
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

test("each of the three cards has a picture area with an engraving: the phase, the lunar day and the sign", () => {
  const markup = html();
  expect(markup.match(/class="moon-text__art"/g)).toHaveLength(3);
  expect(card(markup, "phase")).toMatch(/src="\/luna\/phases\/[a-zA-Z]+-480\.webp"/);
  expect(card(markup, "sign")).toMatch(/src="\/luna\/signs\/[a-z]+-480\.webp"/);
  const day = card(markup, "day");
  expect(day).toMatch(/src="\/luna\/days\/[0-9]{2}-[a-z-]+-480\.webp"/);
  expect(day).toContain(`/luna/days/${String(buildMoonToday(new Date()).lunarDay.number).padStart(2, "0")}-`);
  expect(day).not.toContain("moon-text__numeral");
});

test("the cards carry the same small labels as the tiles", () => {
  const markup = html();
  expect(card(markup, "phase")).toContain(">Фаза<");
  expect(card(markup, "day")).toContain(">Лунные сутки<");
  expect(card(markup, "sign")).toContain(">Знак Луны<");
});

test("has the Moon album after the cards and before the natal bridge", () => {
  const markup = html();
  expect(markup).toMatch(/<h2[^>]*>Лунный альбом<\/h2>/);
  expect(markup.match(/class="moon-album__bead[ "]/g)).toHaveLength(14);
  expect(markup.match(/class="moon-album__slot[ "]/g)).toHaveLength(20);
  expect(markup.indexOf("moon-text-title")).toBeLessThan(markup.indexOf('id="moon-album"'));
  expect(markup.indexOf('id="moon-album"')).toBeLessThan(markup.indexOf("moon-bridge"));
});

test("has the Moon ribbon with the today tab current", async () => {
  const markup = html();
  expect(markup).toContain('aria-label="Лунный раздел"');
  expect(markup.indexOf('aria-label="Лунный раздел"')).toBeLessThan(markup.indexOf("moon-breadcrumb"));
  expect(markup.match(/aria-current="page"[^>]*>Сегодня</g)).toHaveLength(1);
});
