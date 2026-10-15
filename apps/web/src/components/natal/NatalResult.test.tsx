import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { NatalAspects } from "./NatalAspects";
import { NatalKeys } from "./NatalKeys";
import { NatalResult } from "./NatalResult";
import { NatalTable } from "./NatalTable";
import { SAMPLE_BIRTH, realChart } from "./sample-chart.test-support";

const withTime = realChart("Москва", "1990-03-07", "12:00");
const noTime = realChart("Москва", "1990-03-07", null);
const polar = realChart("Мурманск", "1990-03-07", "12:00");
const BIRTH_NO_TIME = { ...SAMPLE_BIRTH, time: null };

// Идентификаторы блоков «Что это значит» уникальны у каждого экземпляра (useId): в сравнениях отбрасываем префикс
const stableIds = (markup: string) => markup.replace(/id="[^"]*-meaning-(sun|moon|ascendant)"/g, 'id="meaning-$1"');
const count = (markup: string, pattern: RegExp) => markup.match(pattern)?.length ?? 0;
const rowsOf = (markup: string) => [...markup.matchAll(/<tr><td>([\s\S]*?)<\/tr>/g)].map((match) => match[1] as string);
const textOf = (markup: string) => markup.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

describe("NatalResult with a known time", () => {
  const markup = renderToStaticMarkup(<NatalResult chart={withTime} birth={SAMPLE_BIRTH} />);

  test("is a section labelled by its h2, with the title, the meta line and a focusable heading", () => {
    const titleId = /^<section class="natal-result" aria-labelledby="([^"]+)">/.exec(markup)?.[1];
    expect(titleId).toBeTruthy();
    expect(markup).toContain(`<div class="natal-result__heading"><h2 id="${titleId}">Ваша натальная карта</h2></div>`);
    expect(markup).toContain('<p class="natal-result__meta">Москва · 7 марта 1990 · 12:00</p>');
    expect(count(markup, /<h1/g)).toBe(0);
    expect(count(markup, /<h2/g)).toBe(1);
  });

  test("the summary lists Sun, Moon and Ascendant", () => {
    const summary = /<div class="natal-summary">([\s\S]*?)<\/div><div class="natal-result__details">/.exec(markup)?.[1] ?? "";
    expect(textOf(summary)).toBe("Солнце в Рыбах Луна в Раке AC Асцендент в Раке");
    expect(count(summary, /natal-summary__item"/g)).toBe(3);
    expect(summary).not.toContain("--muted");
    expect(summary).toContain('<span class="natal-summary__axis" aria-hidden="true">AC</span>');
  });

  test("the positions table has 13 rows, four columns and the houses caption", () => {
    expect(markup).toContain('<table class="natal-table" aria-label="Положения тел и точек">');
    expect(markup).toContain('<th scope="col">Тело</th><th scope="col">Знак</th><th scope="col">Градусы</th><th scope="col">Дом</th>');
    const rows = rowsOf(markup);
    expect(rows).toHaveLength(13);
    expect(textOf(rows[0] as string)).toBe("Солнце Рыбы 16°32′ 10");
    expect(textOf(rows[1] as string)).toBe("Луна Рак 28°07′ 2");
    expect(textOf(rows[5] as string)).toBe("Юпитер Рак 1°00′ 12");
    expect(textOf(rows[9] as string)).toBe("Плутон Скорпион 17°43′ обратное движение 5");
    expect(textOf(rows[10] as string)).toBe("Лунный узел (средний) Водолей 15°00′ обратное движение 9");
    // Асцендент образца в макете — 14°08′: он посчитан для округлённых координат Москвы (55.75, 37.62).
    // В базе городов Москва стоит в (55.752, 37.6178), поэтому настоящий расчёт даёт 14°07′. Точный образец проверяют тесты 7a.
    expect(textOf(rows[11] as string)).toBe("AC Асцендент Рак 14°07′ —");
    expect(textOf(rows[12] as string)).toBe("MC МС Рыбы 5°38′ —");
    expect(markup).toContain('<p class="natal-table__caption">Дома: Плацидус</p>');
  });

  test("marks retrograde bodies with the glyph and a hidden text, exactly as the mockup", () => {
    expect(markup).toContain(
      '<span class="natal-table__degree">17°43′<svg class="natal-glyph natal-glyph--retro" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#glyph-retro"></use></svg><span class="sr-only">обратное движение</span></span>',
    );
    expect(count(markup.slice(markup.indexOf("<table"), markup.indexOf("</table>")), /sr-only/g)).toBe(2);
  });

  test("uses glyphs from the page sprite, never a copy of them", () => {
    expect(markup).toContain('<use href="#glyph-sun"></use>');
    expect(markup).toContain('<use href="#glyph-node"></use>');
    expect(markup).not.toContain("<symbol");
  });

  test("lists the 14 aspects of the sample with the data-aspect hook and no Moon note", () => {
    expect(count(markup, /class="natal-aspects__item"/g)).toBe(14);
    expect(markup).toContain(
      '<li class="natal-aspects__item" data-aspect="trine"><span class="natal-aspects__mark" aria-hidden="true"></span><span>Солнце — Плутон: трин, точность 1°11′</span></li>',
    );
    expect(markup).not.toContain("natal-aspects__note");
  });

  test("without published texts every key block is pending, with no link", () => {
    expect(markup).toContain('<h3>Что это значит</h3>');
    expect(count(markup, /<article class="natal-key natal-key--pending"/g)).toBe(3);
    expect(count(markup, /Подробный текст скоро появится\./g)).toBe(3);
    expect(markup).not.toContain("natal-key__link");
    expect(markup).not.toContain("Читать полностью");
    expect(markup).toContain('<h4 class="natal-key__title">Асцендент в Раке</h4>');
  });

  test("offers Share and Recalculate, and no Save to portrait until the legal gate G3 is passed", () => {
    const actions = /<div class="natal-actions">([\s\S]*?)<\/div><\/section>$/.exec(markup)?.[1] ?? "";
    expect(count(actions, /<button/g)).toBe(2);
    expect(actions).toContain('<button type="button" class="natal-button">Поделиться</button>');
    expect(actions).toContain('<button type="button" class="natal-button">Пересчитать</button>');
    expect(actions).toContain('<p class="natal-actions__note" role="status"></p>');
    expect(markup).not.toContain("Сохранить в портрет");
    expect(markup).not.toContain("natal-button--save");
  });

  test("nothing about the birth data is put into a link", () => {
    expect(markup).not.toMatch(/href="[^#"][^"]*"/);
  });
});

describe("NatalResult without a time", () => {
  const markup = stableIds(renderToStaticMarkup(<NatalResult chart={noTime} birth={BIRTH_NO_TIME} />));

  test("says the time is unknown in the meta line and the wheel caption", () => {
    expect(markup).toContain('<p class="natal-result__meta">Москва · 7 марта 1990 · время неизвестно</p>');
    expect(markup).toContain('<figcaption class="natal-wheel__caption">Время неизвестно</figcaption>');
  });

  test("the third summary item asks for the time and is muted", () => {
    expect(markup).toContain('<div class="natal-summary__item natal-summary__item--muted"><span class="natal-summary__axis" aria-hidden="true">AC</span><span>Асцендент: нужно время рождения</span></div>');
  });

  test("the table has three columns, 11 rows, no angles and no houses caption", () => {
    expect(markup).toContain('<th scope="col">Тело</th><th scope="col">Знак</th><th scope="col">Градусы</th></tr>');
    expect(markup).not.toContain("Дом</th>");
    expect(markup).not.toContain("natal-table__caption");
    const rows = rowsOf(markup);
    expect(rows).toHaveLength(11);
    expect(rows.every((row) => !row.includes("Асцендент") && !row.includes("МС"))).toBe(true);
    expect(textOf(rows[0] as string)).toBe("Солнце Рыбы 16°32′");
  });

  test("lists 11 aspects without the Moon and explains why", () => {
    expect(count(markup, /class="natal-aspects__item"/g)).toBe(11);
    expect(markup).not.toMatch(/Луна — |— Луна/);
    expect(markup).toContain('<p class="natal-aspects__note">Аспекты Луны без времени рождения не считаются.</p>');
  });

  test("the Ascendant block explains that the time is needed", () => {
    expect(markup).toContain('<article class="natal-key natal-key--pending" id="meaning-ascendant"><h4 class="natal-key__title">Асцендент: нужно время рождения</h4><p>Без времени рождения асцендента, середины неба и домов нет.</p></article>');
    expect(markup).toContain('<h4 class="natal-key__title">Солнце в Рыбах</h4><p>Подробный текст скоро появится.</p>');
  });
});

describe("NatalResult beyond the polar circle", () => {
  test("names the Porphyry houses", () => {
    expect(renderToStaticMarkup(<NatalTable chart={polar} />)).toContain('<p class="natal-table__caption">Дома: Порфирий</p>');
  });
});

describe("NatalKeys", () => {
  const registry = { "sun-pisces": { summary: "Солнце в Рыбах — чувствительность и воображение.", href: "/natalnaya-karta/solntse/ryby" } };

  test("shows the published text with a link and keeps the others pending", () => {
    const markup = stableIds(renderToStaticMarkup(<NatalKeys chart={withTime} registry={registry} />));
    expect(markup).toContain(
      '<article class="natal-key" id="meaning-sun"><h4 class="natal-key__title">Солнце в Рыбах</h4><p>Солнце в Рыбах — чувствительность и воображение.</p><a class="natal-key__link" href="/natalnaya-karta/solntse/ryby">Читать полностью</a></article>',
    );
    expect(markup).toContain('<article class="natal-key natal-key--pending" id="meaning-moon">');
    expect(markup).toContain('<article class="natal-key natal-key--pending" id="meaning-ascendant">');
    expect(count(markup, /natal-key__link/g)).toBe(1);
  });

  test("shows all three published texts when the registry has them", () => {
    const full = {
      ...registry,
      "moon-cancer": { summary: "Луна дома.", href: "/natalnaya-karta/luna/rak" },
      "ascendant-cancer": { summary: "Первое впечатление.", href: "/natalnaya-karta/asczendent/rak" },
    };
    const markup = renderToStaticMarkup(<NatalKeys chart={withTime} registry={full} />);
    expect(count(markup, /natal-key__link/g)).toBe(3);
    expect(markup).not.toContain("natal-key--pending");
  });

  test("a text published for the Ascendant is not shown without the time", () => {
    const markup = renderToStaticMarkup(<NatalKeys chart={noTime} registry={{ "ascendant-cancer": { summary: "x", href: "/x" } }} />);
    expect(markup).not.toContain('href="/x"');
  });

  test("uses the shipped (empty) registry by default", () => {
    expect(renderToStaticMarkup(<NatalKeys chart={withTime} />)).toBe(renderToStaticMarkup(<NatalKeys chart={withTime} registry={{}} />));
  });
});

describe("NatalAspects", () => {
  test("an empty list keeps the heading and shows nothing else", () => {
    const markup = renderToStaticMarkup(<NatalAspects chart={{ ...noTime, aspects: [] }} />);
    expect(markup).toBe('<div class="natal-aspects-section"><h3>Аспекты</h3></div>');
  });
});
