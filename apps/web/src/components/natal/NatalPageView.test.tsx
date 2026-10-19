import { natalText } from "@oracle/content/natal";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { acceptedNatalPage } from "@/lib/natal-pages";
import { NatalPageView } from "./NatalPageView";

function render(slug: string): string {
  const page = acceptedNatalPage(slug);
  const text = natalText(slug);
  if (!page || !text) throw new Error(`нет страницы ${slug}`);
  return renderToStaticMarkup(<NatalPageView page={page} text={text} />);
}

const count = (markup: string, pattern: RegExp): number => markup.match(pattern)?.length ?? 0;

describe("NatalPageView: Sun in Aries", () => {
  const markup = render("solntse-v-ovne");

  test("has one main, one h1 with the name of the position and the keywords under it", () => {
    expect(count(markup, /<main/g)).toBe(1);
    expect(count(markup, /<h1/g)).toBe(1);
    expect(markup).toContain('<h1 id="meaning-title">Солнце в Овне</h1>');
    expect(markup).toContain('<p class="natal-meaning-hero__intro">Инициатива · прямота · первый шаг</p>');
  });

  test("shows the five sections with their titles, in order, and links the table of contents to them", () => {
    const titles = ["Суть", "Как это может проявляться", "Подводные камни", "Вопросы для размышления", "Границы трактовки"];
    const positions = titles.map((title) => markup.indexOf(`>${title}</h2>`));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(count(markup, /class="natal-section"/g)).toBe(5);
    for (const key of ["essence", "manifestation", "pitfalls", "questions", "limits"]) expect(markup).toContain(`href="#sun-${key}"`);
    expect(count(markup, /<li>В какой|<li>Какие|<li>Что/g)).toBeGreaterThan(0);
  });

  test("the emblem pairs the Sun glyph with the sign glyph and has an accessible name", () => {
    expect(markup).toContain('data-variant="sun" role="img" aria-label="Солнце и знак Овна"');
    expect(markup).toContain('<use href="#glyph-sun"></use>');
    expect(markup).toContain("<figcaption>Солнце · Овен</figcaption>");
  });

  test("invites to the calculator with a link, and lists the Sun in all twelve signs with the current one marked", () => {
    expect(markup).toContain('<h2 id="sun-calculate">Рассчитайте свою карту</h2>');
    expect(markup).toContain('<a class="natal-button natal-button--calculate" href="/natalnaya-karta">Рассчитать карту</a>');
    expect(count(markup, /class="natal-signs-grid__item"/g)).toBe(12);
    expect(count(markup, /aria-current="page"/g)).toBe(2); // хлебная крошка и текущий знак
    expect(markup).toContain('href="/natalnaya-karta/solntse-v-rybah"');
    expect(markup).toContain("<span>Солнце во Льве</span>");
  });

  test("the pager names the previous and the next sign", () => {
    expect(markup).toContain("Предыдущий знак</span>Солнце в Рыбах");
    expect(markup).toContain("Следующий знак</span>Солнце в Тельце");
  });

  test("puts the sprite once, ends with the disclaimer and carries no calculator data", () => {
    expect(count(markup, /class="natal-sprite"/g)).toBe(1);
    expect(markup.endsWith('<p class="natal-disclaimer">Практики — инструмент самопознания, а не предсказание и не консультация.</p></main>')).toBe(true);
    expect(markup).not.toContain("natal-form");
  });

  test("every id on the page is unique", () => {
    const ids = [...markup.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("NatalPageView: ascendant in Cancer", () => {
  const markup = render("ascendent-v-rake");

  test("uses the AC mark instead of a body glyph and the ascendant wording", () => {
    expect(markup).toContain('<h1 id="meaning-title">Асцендент в Раке</h1>');
    expect(markup).toContain('data-variant="asc" role="img" aria-label="Асцендент и знак Рака"');
    expect(markup).toContain('<span class="natal-emblem__axis" aria-hidden="true">AC</span>');
    expect(markup).toContain("<figcaption>Асцендент · Рак</figcaption>");
    expect(markup).toContain('href="#ascendant-essence"');
  });
});

describe("NatalPageView: Leo", () => {
  test("says «во Льве» in the title of the page and in the links", () => {
    const markup = render("luna-vo-lve");
    expect(markup).toContain('<h1 id="meaning-title">Луна во Льве</h1>');
    expect(markup).toContain("<span>Луна во Льве</span>");
  });
});
