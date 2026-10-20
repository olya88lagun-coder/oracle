import { computeNatalChart } from "@oracle/core/natal";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { NatalInput } from "@/lib/natal-input";
import { OFFER_NO_TIME } from "@/lib/natal-copy";
import { NatalReportOffer } from "./NatalReportOffer";

const MOMENT = { instant: new Date("1990-03-07T09:00:00Z"), latitude: 55.7558, longitude: 37.6173 };
const chart = computeNatalChart({ ...MOMENT, timeKnown: true });
const noTime = computeNatalChart({ ...MOMENT, timeKnown: false });
const input = { date: "1990-03-07", time: "12:00", city: { name: "Москва", latitude: 55.7558, longitude: 37.6173, zone: "Europe/Moscow" } } as unknown as NatalInput;
const text = (markup: string) => markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const render = (state: Parameters<typeof NatalReportOffer>[0]["state"], options: { free?: boolean; withChart?: typeof chart } = {}) =>
  renderToStaticMarkup(<NatalReportOffer state={state} chart={options.withChart ?? chart} input={input} choice={null} free={options.free} />);

describe("NatalReportOffer", () => {
  test("shows the title with the price and the nine chapters with the person's positions", () => {
    const markup = render({ kind: "guest" });
    expect(text(markup)).toContain("Разбор натальной карты — 490 ₽");
    expect(markup.match(/class="report-toc__title"/g)).toHaveLength(9);
    expect(text(markup)).toMatch(/Любовь и ценности Венера (в|во) [А-Яа-я]+, \d+ дом/);
    expect(text(markup)).toContain("Ваш сценарий");
  });

  test("a guest is led to the login and back to the calculator", () => {
    const markup = render({ kind: "guest" });
    expect(text(markup)).toContain("Войти и купить разбор — 490 ₽");
    expect(markup).toContain('href="/login?next=%2Fnatalnaya-karta"');
    expect(markup).not.toContain("<form");
  });

  test("a signed-in person gets the e-mail field and the buy button with the price", () => {
    const markup = render({ kind: "buy" });
    expect(markup).toContain("E-mail для чека");
    expect(text(markup)).toContain("Купить разбор — 490 ₽");
    expect(markup).toContain('href="/oferta"');
  });

  test("says plainly that it is a one-off payment without a subscription or auto-renewal", () => {
    for (const kind of ["guest", "buy"] as const) expect(text(render({ kind }))).toContain("Разовая оплата за разбор одной карты, без подписки и автопродления.");
  });

  test("promises the refund period from the core constant, and only where a purchase is possible", () => {
    const line = "Если разбор не подойдёт, напишите нам в течение 14 дней со дня оплаты — вернём деньги.";
    expect(text(render({ kind: "guest" }))).toContain(line);
    expect(text(render({ kind: "buy" }))).toContain(line);
    expect(text(render({ kind: "buy" }, { free: true }))).not.toContain("вернём деньги");
    expect(text(render({ kind: "no_time" }, { withChart: noTime }))).not.toContain("вернём деньги");
  });

  test("the owner gets a free button and no e-mail field", () => {
    const markup = render({ kind: "buy" }, { free: true });
    expect(text(markup)).toContain("Получить разбор бесплатно");
    expect(markup).not.toContain("E-mail для чека");
  });

  test("links to the example report wherever a purchase is possible, so it can be judged before buying", () => {
    for (const kind of ["guest", "buy"] as const) expect(render({ kind })).toContain('href="/natalnaya-karta/primer"');
    expect(render({ kind: "buy" }, { free: true })).toContain('href="/natalnaya-karta/primer"');
    expect(render({ kind: "no_time" }, { withChart: noTime })).not.toContain("/primer");
  });

  test("without the birth time there are no buttons and no chapter list, only the explanation", () => {
    const markup = render({ kind: "no_time" }, { withChart: noTime });
    expect(text(markup)).toContain(OFFER_NO_TIME);
    expect(markup).not.toContain("<form");
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain("report-toc");
  });
});
