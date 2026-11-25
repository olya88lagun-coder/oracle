import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { WeekdayWeekBar } from "@/components/weekday/WeekdayWeekBar";
import { WEEKDAY_FAQ, WEEKDAY_PATH, WEEKDAY_PLANETS, WEEKDAY_TRADITION } from "@/lib/weekday-planets";
import Page, { metadata } from "./page";

const TITLE_SUFFIX = " — Твой оракул";
const html = () => renderToStaticMarkup(<Page />);

test("metadata: canonical path, title and description within snippet limits", () => {
  expect(metadata.alternates?.canonical).toBe(WEEKDAY_PATH);
  expect(String(metadata.title).length + TITLE_SUFFIX.length).toBeLessThanOrEqual(60);
  expect(String(metadata.description).length).toBeGreaterThanOrEqual(90);
  expect(String(metadata.description).length).toBeLessThanOrEqual(175);
});

test("one h1, seven day cards with anchors, exactly one marked as today", () => {
  const markup = html();
  expect(markup.match(/<h1/g)).toHaveLength(1);
  for (const slug of ["ponedelnik", "vtornik", "sreda", "chetverg", "pyatnitsa", "subbota", "voskresenie"]) expect(markup).toContain(`id="${slug}"`);
  expect(markup.match(/class="weekday-card"/g)).toHaveLength(7);
  expect(markup.match(/aria-current="date"/g)).toHaveLength(1);
  expect(markup.match(/weekday-card__badge/g)).toHaveLength(1);
});

test("shows the today block, the wheel and a FAQ; the disclaimer is there", () => {
  const markup = html();
  expect(markup).toMatch(/Сегодня [а-яё]+ — день [А-Яа-яё]+/);
  expect(markup).toContain("weekday-wheel");
  expect(markup).toContain("<details>");
  expect(markup).toContain("moon-disclaimer");
});

test("the week bar has seven links to the card anchors, one of them marked as today", () => {
  const markup = html();
  const bar = markup.slice(markup.indexOf("weekday-bar"), markup.indexOf("weekday-week"));
  expect(bar.match(/class="weekday-bar__day"/g)).toHaveLength(7);
  for (const { slug } of WEEKDAY_PLANETS) expect(bar).toContain(`href="#${slug}"`);
  expect(bar.match(/aria-current="true"/g)).toHaveLength(1);
});

test("every day card and the planet strip carry data-planet", () => {
  const markup = html();
  expect(markup.match(/class="weekday-card" data-planet="[a-z]+"/g)).toHaveLength(7);
  expect(markup).toMatch(/class="weekday-strip weekday-now"[^>]*data-planet="[a-z]+"/);
});

test("the first screen shows what day it is and does not repeat the question of the day; each card has an action and a name origin", () => {
  const markup = html();
  const hero = markup.slice(markup.indexOf('class="weekday-hero"'), markup.indexOf('class="weekday-bar"'));
  expect(hero).toContain("weekday-now__actions");
  expect(hero).toContain("weekday-now__neighbours");
  expect(hero).not.toContain("weekday-strip__question");
  expect(markup.match(/class="weekday-card__action"/g)).toHaveLength(7);
  expect(markup.match(/class="weekday-card__etymology"/g)).toHaveLength(7);
  expect(markup.match(/class="weekday-card__focus"/g)).toHaveLength(7);
  expect(markup.match(/class="weekday-card__themes"/g)).toHaveLength(7);
  expect(markup).toContain("weekday-how__icon");
  expect(markup).toContain("weekday-card__fold");
});

test("shows a week overview, the tradition note and an expanded FAQ", () => {
  const markup = html();
  expect(markup).toContain("weekday-overview");
  expect(markup.match(/class="weekday-overview__row"/g)).toHaveLength(7);
  expect(markup).toContain("weekday-tradition");
  expect(markup).toContain(WEEKDAY_TRADITION.methodHref);
  expect(WEEKDAY_FAQ.length).toBeGreaterThanOrEqual(6);
  expect(markup.match(/<details>/g)?.length).toBe(WEEKDAY_FAQ.length);
});

test("the week bar marks the first and the last day of the week correctly", () => {
  for (const today of [0, 6]) {
    const bar = renderToStaticMarkup(<WeekdayWeekBar today={today} />);
    expect(bar.match(/aria-current="true"/g)).toHaveLength(1);
    expect(bar.indexOf('aria-current="true"')).toBeGreaterThan(bar.indexOf(`href="#${WEEKDAY_PLANETS[today]!.slug}"`));
  }
});

test("has the Moon ribbon with the weekday tab current", async () => {
  const markup = html();
  expect(markup).toContain('aria-label="Лунный раздел"');
  expect(markup.indexOf('aria-label="Лунный раздел"')).toBeLessThan(markup.indexOf("moon-breadcrumb"));
  expect(markup.match(/aria-current="page"[^>]*>Дни недели</g)).toHaveLength(1);
});

test("all seven planets use local raster artwork in the scene, navigation and cards", () => {
  const markup = html();
  for (const { glyph } of WEEKDAY_PLANETS) {
    expect(markup).toContain(`/images/weekday/${glyph}-160.webp`);
    expect(markup).toContain(`/images/weekday/${glyph}-384.webp`);
  }
  expect(markup.match(/weekday-system__centre/g)).toHaveLength(1);
  expect(markup.match(/weekday-system__companion/g)).toHaveLength(6);
  expect(markup).not.toContain("weekday-wheel__glyph");
});
