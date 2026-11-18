import { THREAD_REPORT_PRICE_KOPECKS } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { formatRubles } from "@/lib/legal";

const { default: ContactsPage } = await import("./page");
const text = renderToStaticMarkup(<ContactsPage />).replace(/<!-- -->/g, "").replace(/&nbsp;/g, " ");

describe("contacts page", () => {
  test("lists the thread report with its price and where it is bought", () => {
    expect(text).toContain("«Разбор нити» — персональный текстовый разбор по дате рождения");
    expect(text).toContain(`Стоимость — ${formatRubles(THREAD_REPORT_PRICE_KOPECKS)}`);
    expect(text).toContain('href="/numerologiya/grafik-sudby"');
  });
});
