import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { HOME_PRINCIPLES, HOME_PRINCIPLES_TITLE } from "@/lib/home-principles";

// Платные предложения в строке под «Практиками» зависят от флагов продажи; здесь они выключены
vi.mock("@/server/payments-deps", () => ({ salesEnabled: () => false }));

const { default: HomePage } = await import("./page");
const markup = renderToStaticMarkup(<HomePage />);

describe("home page", () => {
  test("keeps its one h1 and the free matrix call to action once", () => {
    expect(markup.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(markup.match(/>Рассчитать матрицу бесплатно<\/a>/g)).toHaveLength(1);
  });

  test("shows what sets the site apart, after the practices and before the portrait", () => {
    expect(markup).toContain(`<h2 id="home-principles">${HOME_PRINCIPLES_TITLE}</h2>`);
    for (const item of HOME_PRINCIPLES) expect(markup).toContain(item.text);
    expect(markup.indexOf('id="home-principles"')).toBeGreaterThan(markup.indexOf('id="practices"'));
    expect(markup.indexOf('id="home-principles"')).toBeLessThan(markup.indexOf("Ваши сохранённые практики"));
    expect(markup).toContain('href="/metodika"');
  });

  test("states the AI mark of the guide in the same words as the game", () => {
    expect(markup).toContain("Абзацы проводника пишет ИИ.");
  });
});
