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

  test("shows the brand name in the hero, not only in the site header", () => {
    const hero = markup.slice(markup.indexOf('class="hero"'), markup.indexOf('id="home-intents"'));
    expect(hero).toMatch(/class="hero__brand"/);
    expect(hero).toContain("Твой ");
    expect(hero).toContain("<em>оракул</em>");
    expect(hero.indexOf('class="hero__brand"')).toBeLessThan(hero.indexOf("<h1"));
  });

  test("shows what sets the site apart, after the practices and before the portrait", () => {
    expect(markup).toContain(`<h2 id="home-principles">${HOME_PRINCIPLES_TITLE}</h2>`);
    for (const item of HOME_PRINCIPLES) expect(markup).toContain(item.text);
    expect(markup.indexOf('id="home-principles"')).toBeGreaterThan(markup.indexOf('id="practices"'));
    expect(markup.indexOf('id="home-principles"')).toBeLessThan(markup.indexOf("Ваши сохранённые практики"));
    expect(markup).toContain('href="/metodika"');
  });

  test("has the Moon tile after the hero and before the practices, linking to the Moon today page once", () => {
    expect(markup).toMatch(/<h2 id="moon-portal-title">/);
    expect(markup.indexOf('id="moon-portal"')).toBeGreaterThan(markup.indexOf('class="hero"'));
    expect(markup.indexOf('id="moon-portal"')).toBeLessThan(markup.indexOf('id="practices"'));
    expect(markup.match(/href="\/luna-segodnya"/g)).toHaveLength(1);
  });

  test("numerology is one of the practice cards on the home page", () => {
    const practices = markup.slice(markup.indexOf('id="practices"'), markup.indexOf('id="home-principles"'));
    expect(practices).toContain('href="/numerologiya"');
    expect(practices).toContain("/practices/numerology.webp");
  });

  test("links the free 2027 arcana once, between the practices and the principles, without a second matrix call to action", () => {
    expect(markup.match(/href="\/arkan-2027"/g)).toHaveLength(1);
    expect(markup).toContain(">Узнать аркан 2027</a>");
    expect(markup.indexOf('href="/arkan-2027"')).toBeGreaterThan(markup.indexOf('id="practices"'));
    expect(markup.indexOf('href="/arkan-2027"')).toBeLessThan(markup.indexOf('id="home-principles"'));
    expect(markup.match(/>Рассчитать матрицу бесплатно<\/a>/g)).toHaveLength(1);
  });

  test("states the AI mark of the guide in the same words as the game", () => {
    expect(markup).toContain("Абзацы проводника пишет ИИ.");
  });
});
