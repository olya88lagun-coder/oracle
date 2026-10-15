import type { BodyId } from "@oracle/core/natal";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { NatalNotices, noticesFor, type NatalNoticesProps } from "./NatalNotices";
import { realCalculation } from "./sample-chart.test-support";

const count = (markup: string, pattern: RegExp) => markup.match(pattern)?.length ?? 0;
const kindsOf = (props: Pick<NatalNoticesProps, "clock" | "correctedTime" | "chart" | "date" | "latitude">) => noticesFor(props).map((notice) => notice.kind);

// Входные данные для плашек из настоящего расчёта
function scenario(city: string, date: string, time: string | null, choice: "first" | "second" | null = null) {
  const { input, outcome } = realCalculation(city, date, time, choice);
  const base = { date: input.date, latitude: input.city.latitude, choice, onChoose: undefined };
  return outcome.kind === "chart"
    ? { ...base, chart: outcome.chart, clock: outcome.clock, correctedTime: outcome.correctedTime }
    : { ...base, chart: null, clock: outcome.clock, correctedTime: null };
}

describe("NatalNotices", () => {
  test("an ordinary chart with time in a mid-latitude city has no notices at all", () => {
    const props = scenario("Москва", "1990-03-07", "12:00");
    expect(kindsOf(props)).toEqual([]);
    expect(renderToStaticMarkup(<NatalNotices {...props} />)).toBe("");
  });

  test("gap: names the corrected time", () => {
    const markup = renderToStaticMarkup(<NatalNotices {...scenario("Москва", "1981-04-01", "00:30")} />);
    expect(markup).toContain(
      '<div class="natal-notice natal-notice--gap" role="status"><span class="natal-notice__icon" aria-hidden="true">i</span><p>В это время часы переводили вперёд: такого времени не было. Считаем по ближайшему существующему — 01:30.</p></div>',
    );
    expect(markup).not.toContain("natal-choice");
  });

  test("ambiguous before the choice: only the notice and two unpressed buttons, no chart to show", () => {
    const props = scenario("Москва", "1990-09-30", "02:30");
    expect(props.chart).toBeNull();
    const markup = renderToStaticMarkup(<NatalNotices {...props} />);
    expect(markup).toContain('<div class="natal-notice natal-notice--ambiguous" role="status"><span class="natal-notice__icon" aria-hidden="true">i</span><p>В это время часы переводили назад: оно было дважды. Выберите, какое ваше.</p></div>');
    expect(markup).toContain('<div class="natal-choice-group" role="group" aria-label="Какое время рождения" tabindex="-1">');
    expect(markup).toContain('<button type="button" class="natal-choice" aria-pressed="false">Первый раз</button>');
    expect(markup).toContain('<button type="button" class="natal-choice" aria-pressed="false">Второй раз</button>');
    expect(count(markup, /natal-notice /g)).toBe(1);
  });

  test("ambiguous after a choice: the chosen button is pressed and the other notices of the chart follow", () => {
    const props = scenario("Москва", "1990-09-30", "02:30", "second");
    expect(props.chart).not.toBeNull();
    const markup = renderToStaticMarkup(<NatalNotices {...props} />);
    expect(markup).toContain('class="natal-choice" aria-pressed="false">Первый раз');
    expect(markup).toContain('class="natal-choice" aria-pressed="true">Второй раз');
  });

  test("no time: the no-time notice and one sign-change notice per body that changed its sign", () => {
    const props = scenario("Москва", "1990-03-07", null);
    const markup = renderToStaticMarkup(<NatalNotices {...props} />);
    expect(kindsOf(props)).toEqual(["no-time", "sign-change"]);
    expect(markup).toContain('<div class="natal-notice natal-notice--no-time" role="status"><span class="natal-notice__icon" aria-hidden="true">i</span><p>Без времени рождения асцендента, середины неба и домов нет.</p></div>');
    expect(markup).toContain('<div class="natal-notice natal-notice--sign-change" role="status"><span class="natal-notice__icon" aria-hidden="true">i</span><p>В этот день Луна сменила знак — точный знак зависит от времени рождения.</p></div>');
    expect(markup.startsWith('<div class="natal-notices">')).toBe(true);
  });

  test("several bodies that changed their sign get a notice each", () => {
    const base = scenario("Москва", "1990-03-07", null);
    const chart = base.chart && { ...base.chart, uncertainSigns: ["sun", "moon"] as BodyId[] };
    const markup = renderToStaticMarkup(<NatalNotices {...base} chart={chart} />);
    expect(count(markup, /natal-notice--sign-change/g)).toBe(2);
    expect(markup).toContain("В этот день Солнце сменило знак");
    expect(markup).toContain("В этот день Луна сменила знак");
  });

  test("known time gives no sign-change notices", () => {
    expect(kindsOf(scenario("Москва", "1990-03-07", "12:00"))).not.toContain("sign-change");
  });

  test("polar: above 66 degrees of latitude, in either hemisphere", () => {
    const murmansk = scenario("Мурманск", "1990-03-07", "12:00");
    expect(murmansk.latitude).toBeGreaterThan(66);
    expect(kindsOf(murmansk)).toEqual(["polar"]);
    expect(renderToStaticMarkup(<NatalNotices {...murmansk} />)).toContain(
      '<div class="natal-notice natal-notice--polar" role="status"><span class="natal-notice__icon" aria-hidden="true">i</span><p>За полярным кругом асцендент сильно зависит от минуты рождения. Дома считаются по системе Порфирия: Плацидус там не определён.</p></div>',
    );
    expect(kindsOf({ ...murmansk, latitude: -70 })).toEqual(["polar"]);
    expect(kindsOf({ ...murmansk, latitude: 66 })).toEqual([]);
    expect(kindsOf({ ...murmansk, latitude: 55.75 })).toEqual([]);
  });

  test("early: only for birth dates before 1930-01-01", () => {
    const early = scenario("Москва", "1920-03-07", "12:00");
    expect(kindsOf(early)).toEqual(["early"]);
    expect(renderToStaticMarkup(<NatalNotices {...early} />)).toContain('<div class="natal-notice natal-notice--early" role="status"><span class="natal-notice__icon" aria-hidden="true">i</span><p>Для ранних лет история часовых поясов менее надёжна.</p></div>');
    expect(kindsOf({ ...early, date: "1929-12-31" })).toEqual(["early"]);
    expect(kindsOf({ ...early, date: "1930-01-01" })).toEqual([]);
  });

  test("notices come in a fixed order when several apply", () => {
    const base = scenario("Москва", "1990-03-07", null);
    const chart = base.chart && { ...base.chart, uncertainSigns: ["moon"] as BodyId[] };
    expect(kindsOf({ ...base, chart, latitude: 69, date: "1920-03-07" })).toEqual(["no-time", "sign-change", "polar", "early"]);
    expect(kindsOf({ clock: "gap", correctedTime: "01:30", chart, latitude: 69, date: "1920-03-07" })).toEqual(["gap", "no-time", "sign-change", "polar", "early"]);
  });
});
