import { THREAD_REPORT_PRICE_KOPECKS } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { formatRubles } from "@/lib/legal";

const { default: OfferPage } = await import("./page");
const markup = renderToStaticMarkup(<OfferPage />);
// Разметка ставит комментарии между фрагментами текста; для поиска фраз убираем их
const text = markup.replace(/<!-- -->/g, "").replace(/&nbsp;/g, " ");

describe("offer page", () => {
  test("describes the thread report and its price from the constant", () => {
    expect(text).toContain("«Разбор нити» — персональный текстовый разбор по дате рождения");
    expect(text).toContain(`Цена — ${formatRubles(THREAD_REPORT_PRICE_KOPECKS)}`);
    expect(text).toMatch(/не является предсказанием или консультацией/);
  });

  test("says the birth date is kept in the order and the text is built without a text service", () => {
    expect(text).toContain("Разбор нити вы оплачиваете после входа, указав e-mail для чека");
    expect(text).toMatch(/Для «Разбора нити» сервису подготовки текста ничего не передаётся/);
  });
});
