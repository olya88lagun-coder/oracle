import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { EMPTY_FORM_VALUES, NO_FORM_ERRORS, NatalForm } from "./NatalForm";
import { NatalOutcome, type Outcome } from "./NatalOutcome";
import { NatalResult } from "./NatalResult";
import { SAMPLE_BIRTH, cityNamed, realCalculation } from "./sample-chart.test-support";

function outcomeFor(city: string, date: string, time: string | null, choice: "first" | "second" | null = null): Outcome {
  const { input, outcome } = realCalculation(city, date, time, choice);
  return outcome.kind === "chart"
    ? { input, chart: outcome.chart, clock: outcome.clock, correctedTime: outcome.correctedTime, choice }
    : { input, chart: null, clock: "ambiguous", correctedTime: null, choice: null };
}

const render = (outcome: Outcome) => renderToStaticMarkup(<NatalOutcome outcome={outcome} titleId="t-title" />);
const index = (markup: string, text: string) => markup.indexOf(text);

describe("NatalOutcome with a chart", () => {
  const markup = render(outcomeFor("Мурманск", "1920-03-07", "12:00"));

  test("is a focus target labelled by the result heading", () => {
    expect(markup).toMatch(/^<div class="natal-outcome" role="group" aria-labelledby="t-title" tabindex="-1">/);
    expect(markup).toContain('<h2 id="t-title">Ваша натальная карта</h2>');
  });

  test("keeps the mockup order: the notices come first, then the result, all inside the target", () => {
    expect(index(markup, "natal-notices")).toBeGreaterThan(0);
    expect(index(markup, "natal-notice--polar")).toBeLessThan(index(markup, "natal-notice--early"));
    expect(index(markup, "natal-notice--early")).toBeLessThan(index(markup, 'class="natal-result"'));
    expect(markup.endsWith("</section></div>")).toBe(true);
  });

  test("shows the time that was used for the chart in the meta line", () => {
    const gap = render(outcomeFor("Москва", "1981-04-01", "00:30"));
    expect(gap).toContain("natal-notice--gap");
    expect(gap).toContain("Москва · 1 апреля 1981 · 01:30");
  });

  test("works without notices at all", () => {
    const plain = render(outcomeFor("Москва", "1990-03-07", "12:00"));
    expect(plain).not.toContain("natal-notices");
    expect(plain).toMatch(/^<div class="natal-outcome" role="group" aria-labelledby="t-title" tabindex="-1"><section class="natal-result"/);
  });
});

describe("NatalOutcome while the time is ambiguous", () => {
  const markup = render(outcomeFor("Москва", "1990-09-30", "02:30"));

  test("has no result and does not claim to be labelled by one", () => {
    expect(markup).not.toContain("natal-result");
    expect(markup).not.toContain("aria-labelledby");
    expect(markup).toMatch(/^<div class="natal-outcome"><div class="natal-notices">/);
  });

  test("the choice group can take focus, so keyboard and screen-reader users land on the question", () => {
    expect(markup).toContain('<div class="natal-choice-group" role="group" aria-label="Какое время рождения" tabindex="-1">');
  });
});

describe("unique ids per instance", () => {
  test("two results on one page do not share the heading or key block ids", () => {
    const chart = outcomeFor("Москва", "1990-03-07", "12:00").chart;
    if (!chart) throw new Error("нет карты");
    const markup = renderToStaticMarkup(
      <>
        <NatalResult chart={chart} birth={SAMPLE_BIRTH} />
        <NatalResult chart={chart} birth={SAMPLE_BIRTH} />
      </>,
    );
    const ids = [...markup.matchAll(/ id="([^"]+)"/g)].map((match) => match[1] as string);
    expect(ids.length).toBeGreaterThan(6);
    expect(new Set(ids).size).toBe(ids.length);
    const titles = [...markup.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1]);
    expect(titles).toHaveLength(2);
    expect(titles[0]).not.toBe(titles[1]);
  });

  test("the heading id comes from the caller when it is given", () => {
    const chart = outcomeFor("Москва", "1990-03-07", "12:00").chart;
    if (!chart) throw new Error("нет карты");
    expect(renderToStaticMarkup(<NatalResult chart={chart} birth={SAMPLE_BIRTH} titleId="given" />)).toContain('aria-labelledby="given"');
  });
});

describe("status line of the form", () => {
  const form = (note?: string) =>
    renderToStaticMarkup(
      <NatalForm values={{ ...EMPTY_FORM_VALUES, city: cityNamed("Москва"), cityText: "Москва" }} errors={NO_FORM_ERRORS} busy={false} failed={false} note={note} onChange={() => undefined} onSubmit={() => undefined} />,
    );

  test("repeats the ambiguous-time notice in the live status region", () => {
    expect(form("В это время часы переводили назад: оно было дважды. Выберите, какое ваше.")).toContain(
      '<p class="natal-status" role="status" aria-live="polite">В это время часы переводили назад: оно было дважды. Выберите, какое ваше.</p>',
    );
  });

  test("is empty without a note", () => {
    expect(form()).toContain('<p class="natal-status" role="status" aria-live="polite"></p>');
  });
});
