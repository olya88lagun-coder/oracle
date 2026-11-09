import type { NatalChart } from "@oracle/core/natal";
import { renderToStaticMarkup } from "react-dom/server";
import { ACCEPTED_BATCHES, NATAL_HOUSE_PAGES } from "@oracle/content/natal";
import { describe, expect, test } from "vitest";
import { MEANING_LINK_HINT } from "@/lib/natal-copy";
import { natalKeyId, type NatalKeyRegistry } from "@/lib/natal-texts";
import { sampleChart } from "./sample-chart.test-support";
import { NatalTable } from "./NatalTable";

// Ссылка на страницу значения стоит у названия тела, если для его положения есть открытая страница; у МС страниц нет, лунный узел ведёт на «Северный узел в знаке»
const registryFor = (chart: NatalChart): NatalKeyRegistry =>
  Object.fromEntries(
    [...chart.points.map((point) => ({ id: point.id as string, sign: point.sign })), ...(chart.ascendant ? [{ id: "ascendant", sign: chart.ascendant.sign }] : []), ...(chart.midheaven ? [{ id: "midheaven", sign: chart.midheaven.sign }] : [])].map(({ id, sign }) => [
      `${id}-${sign}`,
      { summary: "Выдержка", href: `/natalnaya-karta/${id}-${sign}` },
    ]),
  );

const links = (markup: string) => [...markup.matchAll(/<a class="natal-table__meaning-link" href="([^"]+)">/g)].map((match) => match[1]);

describe("NatalTable meaning links", () => {
  test("links the ten bodies, the lunar node and the ascendant to their pages, and not the midheaven", () => {
    const chart = sampleChart(true);
    const markup = renderToStaticMarkup(<NatalTable chart={chart} registry={registryFor(chart)} houseRegistry={{}} />);
    const found = links(markup);
    expect(found).toHaveLength(12);
    expect(found.some((href) => href?.includes("midheaven"))).toBe(false);
    const node = chart.points.find((point) => point.id === "northNode");
    expect(found).toContain(`/natalnaya-karta/northNode-${node?.sign}`);
    const sun = chart.points.find((point) => point.id === "sun");
    expect(found).toContain(`/natalnaya-karta/sun-${sun?.sign}`);
    expect(found).toContain(`/natalnaya-karta/ascendant-${chart.ascendant?.sign}`);
  });

  test("without birth time there is no ascendant row, so eleven links", () => {
    const chart = sampleChart(false);
    expect(links(renderToStaticMarkup(<NatalTable chart={chart} registry={registryFor(chart)} />))).toHaveLength(11);
  });

  test("a body whose page is not open stays plain text", () => {
    const chart = sampleChart(true);
    const sun = chart.points.find((point) => point.id === "sun");
    const markup = renderToStaticMarkup(<NatalTable chart={chart} registry={{ [natalKeyId("sun", sun?.sign ?? "aries")]: { summary: "Выдержка", href: "/natalnaya-karta/sun" } }} houseRegistry={{}} />);
    expect(links(markup)).toEqual(["/natalnaya-karta/sun"]);
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(renderToStaticMarkup(<NatalTable chart={chart} registry={{}} houseRegistry={{}} />)).not.toContain("<a ");
  });

  test("the link keeps the body name and adds a hidden hint for screen readers", () => {
    const chart = sampleChart(true);
    const markup = renderToStaticMarkup(<NatalTable chart={chart} registry={registryFor(chart)} />);
    expect(markup).toContain(`<span class="sr-only"> — ${MEANING_LINK_HINT}</span></a>`);
    expect(markup).toMatch(/<a class="natal-table__meaning-link" href="[^"]+"><span>Солнце<\/span>/);
  });
});

describe("NatalTable house links", () => {
  const houseLinks = (markup: string) => [...markup.matchAll(/<a class="natal-table__meaning-link" href="(\/natalnaya-karta\/[a-z]+-v-\d+-dome)">/g)].map((match) => match[1]);

  test("by default house numbers link only to the accepted «planet in house» pages", () => {
    const open = new Set(NATAL_HOUSE_PAGES.filter((page) => ACCEPTED_BATCHES.has(page.batch)).map((page) => `/natalnaya-karta/${page.slug}`));
    const found = houseLinks(renderToStaticMarkup(<NatalTable chart={sampleChart(true)} />));
    expect(found.length).toBeGreaterThan(0);
    for (const href of found) expect(open.has(href ?? ""), href).toBe(true);
  });

  test("an open «planet in house» page turns the house number into a link", () => {
    const chart = sampleChart(true);
    const venus = chart.points.find((point) => point.id === "venus");
    if (!venus || venus.house === null) throw new Error("у Венеры в примере нет дома");
    const markup = renderToStaticMarkup(<NatalTable chart={chart} houseRegistry={{ [`venus-${venus.house}`]: `venera-v-${venus.house}-dome` }} />);
    expect(houseLinks(markup)).toEqual([`/natalnaya-karta/venera-v-${venus.house}-dome`]);
    expect(markup).toContain(`Венера в ${venus.house} доме: значение`);
  });
});
