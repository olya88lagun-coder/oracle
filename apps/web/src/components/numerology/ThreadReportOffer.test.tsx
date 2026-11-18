import { THREAD_REPORT_PRICE_KOPECKS } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { THREAD_OFFER_TITLE } from "@/lib/thread-copy";
import { ThreadReportOffer } from "./ThreadReportOffer";

const text = (markup: string) => markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const render = (p: { signedIn: boolean; owner?: boolean }) => renderToStaticMarkup(<ThreadReportOffer iso="1990-03-07" signedIn={p.signedIn} owner={p.owner ?? false} />);

describe("ThreadReportOffer", () => {
  test("the heading carries the price from the core constant", () => {
    expect(THREAD_REPORT_PRICE_KOPECKS).toBe(49_000);
    expect(text(render({ signedIn: false }))).toContain(`${THREAD_OFFER_TITLE} — 490 ₽`);
    expect(text(render({ signedIn: false }))).toContain("Разбор нити — 490 ₽");
  });

  test("lists the six chapters, says it is text without AI and not a prediction, and that the date goes only on purchase", () => {
    const t = text(render({ signedIn: true }));
    for (const chapter of ["Где вы сейчас", "двенадцатью личными месяцами", "Семь лет вперёд", "Прошлые годы", "Четыре периода жизни", "Ваш ритм", "Три правила и вопрос на год"]) expect(t).toContain(chapter);
    expect(t).toContain("без ИИ");
    expect(t).toContain("не предсказание");
    expect(t).toContain("только когда вы покупаете");
  });

  test("a guest is led to the login and back to the thread", () => {
    const markup = render({ signedIn: false });
    expect(text(markup)).toContain("Войти и купить разбор — 490 ₽");
    expect(markup).toContain('href="/login?next=%2Fnumerologiya%2Fgrafik-sudby"');
    expect(markup).not.toContain("<form");
  });

  test("a signed-in person gets the e-mail field and the buy button", () => {
    const markup = render({ signedIn: true });
    expect(markup).toContain("E-mail для чека");
    expect(text(markup)).toContain("Купить разбор — 490 ₽");
    expect(markup).toContain('href="/oferta"');
  });

  test("promises the refund period from the shared constant, except for the owner", () => {
    const line = "в течение 14 дней со дня оплаты — вернём деньги.";
    expect(text(render({ signedIn: true }))).toContain(line);
    expect(text(render({ signedIn: false }))).toContain(line);
    expect(text(render({ signedIn: true, owner: true }))).not.toContain("вернём деньги");
  });

  test("the owner gets a free button and no e-mail field", () => {
    const markup = render({ signedIn: true, owner: true });
    expect(text(markup)).toContain("Получить разбор бесплатно");
    expect(markup).not.toContain("E-mail для чека");
  });
});
