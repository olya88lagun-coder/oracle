import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { NatalAspects } from "./NatalAspects";
import { NatalResult } from "./NatalResult";
import { NatalSpheres } from "./NatalSpheres";
import { SAMPLE_BIRTH, sampleChart } from "./sample-chart.test-support";

const withTime = sampleChart(true);
const noTime = sampleChart(false);
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

describe("NatalSpheres", () => {
  const markup = renderToStaticMarkup(<NatalSpheres chart={withTime} />);

  test("is a section with its own h3 and six cards with an h4 each, and no h1 or h2", () => {
    expect(markup).toMatch(/^<section class="natal-spheres"><h3>Сферы жизни в вашей карте<\/h3>/);
    expect(markup.match(/<article class="natal-spheres__item"/g)).toHaveLength(6);
    expect(markup.match(/<h4/g)).toHaveLength(6);
    expect(markup).not.toMatch(/<h[12]/);
  });

  test("tells the house, its title, the sign on the cusp and the planets in it", () => {
    expect(text(markup)).toContain("7 дом");
    expect(text(markup)).toContain("Отношения");
    expect(text(markup)).toContain("Знак на границе дома: Козерог");
    expect(text(markup)).toContain("Планеты в доме: Марс, Сатурн, Нептун");
  });

  test("says that a house with no planets has none", () => {
    expect(text(markup)).toContain("Планет в этом доме нет");
  });

  test("renders nothing without the birth time", () => {
    expect(renderToStaticMarkup(<NatalSpheres chart={noTime} />)).toBe("");
  });
});

describe("NatalAspects groups", () => {
  const markup = renderToStaticMarkup(<NatalAspects chart={withTime} />);

  test("shows the supports, tensions and merges with a heading and a lead each", () => {
    for (const title of ["Опоры", "Напряжения", "Слияния"]) expect(markup).toContain(`<h4>${title}</h4>`);
    expect(markup).toContain("Трин и секстиль: темы двух планет поддерживают друг друга.");
  });

  test("keeps every aspect line once", () => {
    expect(markup.match(/class="natal-aspects__item"/g)).toHaveLength(withTime.aspects.length);
    expect(markup).toContain("Солнце — Плутон: трин, точность 1°11′");
  });

  test("puts the tense aspects under the tensions and the trines under the supports", () => {
    const tension = markup.slice(markup.indexOf("<h4>Напряжения</h4>"), markup.indexOf("<h4>Слияния</h4>"));
    expect(tension).toContain('data-aspect="opposition"');
    expect(tension).not.toContain('data-aspect="trine"');
  });

  test("keeps the empty state and the note about the Moon", () => {
    expect(renderToStaticMarkup(<NatalAspects chart={{ ...withTime, aspects: [] }} />)).toBe('<div class="natal-aspects-section"><h3>Аспекты</h3></div>');
    expect(renderToStaticMarkup(<NatalAspects chart={noTime} />)).toContain("Аспекты Луны без времени рождения не считаются.");
  });
});

describe("NatalResult with the spheres block", () => {
  test("stands after the main point and before the aspects", () => {
    const markup = renderToStaticMarkup(<NatalResult chart={withTime} birth={SAMPLE_BIRTH} />);
    const order = ["natal-focus", "natal-spheres", "natal-aspects-section"].map((name) => markup.indexOf(`class="${name}`));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test("has no spheres without the time", () => {
    expect(renderToStaticMarkup(<NatalResult chart={noTime} birth={{ ...SAMPLE_BIRTH, time: null }} />)).not.toContain("natal-spheres");
  });
});
