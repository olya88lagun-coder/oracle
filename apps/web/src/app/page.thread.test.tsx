import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { THREAD_PATH } from "@/lib/life-thread";

// Платные предложения на главной зависят от флагов продажи; здесь они выключены
vi.mock("@/server/payments-deps", () => ({ salesEnabled: () => false }));

describe("home page: the life thread promo", () => {
  test("with batch 9 accepted it links the free thread once, between the practices and the principles", async () => {
    vi.resetModules();
    const { default: HomePage } = await import("./page");
    const markup = renderToStaticMarkup(<HomePage />);
    expect(markup.match(new RegExp(`href="${THREAD_PATH}"`, "g"))).toHaveLength(1);
    expect(markup).toContain(">Показать мою нить</a>");
    expect(markup.indexOf(`href="${THREAD_PATH}"`)).toBeGreaterThan(markup.indexOf('id="practices"'));
    expect(markup.indexOf(`href="${THREAD_PATH}"`)).toBeLessThan(markup.indexOf('id="home-principles"'));
    expect(markup.match(/>Рассчитать матрицу бесплатно<\/a>/g)).toHaveLength(1);
    expect((markup.match(/<h1[\s>]/g) ?? []).length).toBe(1);
  });

  test("the promo is calm: no prediction, no evaluating words", async () => {
    vi.resetModules();
    const { default: HomePage } = await import("./page");
    const markup = renderToStaticMarkup(<HomePage />);
    const promo = markup.slice(markup.indexOf('class="home-year home-thread"'), markup.indexOf('id="home-principles"')).toLowerCase();
    expect(promo).toContain("не прогноз");
    for (const word of ["плох", "спад", "приговор", "судьба определит"]) expect(promo).not.toContain(word);
  });
});

describe("home page: the life thread promo while the page is closed", () => {
  test("there is no link to the thread", async () => {
    vi.resetModules();
    vi.doMock("@oracle/content/numerology", async (importOriginal) => (await import("./numerologiya/grafik-sudby/thread-fixtures")).mockThreadClosed(importOriginal as never));
    const { default: HomePage } = await import("./page");
    const markup = renderToStaticMarkup(<HomePage />);
    expect(markup).not.toContain(THREAD_PATH);
    vi.doUnmock("@oracle/content/numerology");
  });
});
