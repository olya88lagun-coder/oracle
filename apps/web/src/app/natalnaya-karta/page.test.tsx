import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { PUBLIC_PATHS } from "@/lib/seo";
import NatalPage, { metadata } from "./page";

describe("/natalnaya-karta page", () => {
  const markup = renderToStaticMarkup(<NatalPage />);

  test("has one main and exactly one h1 with the intro under it", () => {
    expect(markup.match(/<main/g)).toHaveLength(1);
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain('<header class="natal-intro"><h1>Натальная карта</h1><p>Дата, время и место рождения — и вы увидите, в каких знаках стояли Солнце, Луна и планеты. Это символический язык самопознания, а не предсказание.</p></header>');
  });

  test("puts the sprite once, then the calculator form, then the disclaimer", () => {
    expect(markup.match(/class="natal-sprite"/g)).toHaveLength(1);
    expect(markup.indexOf("natal-sprite")).toBeLessThan(markup.indexOf('class="natal-form"'));
    expect(markup.indexOf('class="natal-form"')).toBeLessThan(markup.indexOf("natal-disclaimer"));
    expect(markup).toContain('<p class="natal-disclaimer">Практики — инструмент самопознания, а не предсказание и не консультация.</p>');
    expect(markup.endsWith("</p></main>")).toBe(true);
  });

  test("is server-rendered as an empty form: no result yet", () => {
    expect(markup).not.toContain("natal-result");
    expect(markup).toContain("Рассчитать карту");
  });

  test("is closed to search engines until the practice is launched, but keeps its canonical address", () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("/natalnaya-karta");
    expect(String(metadata.description)).not.toMatch(/предскажем|узнайте будущее|судьб/i);
  });

  test("is not added to the sitemap paths before launch", () => {
    expect(PUBLIC_PATHS).not.toContain("/natalnaya-karta");
  });
});
