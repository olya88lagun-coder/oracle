import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { WHEEL_CARD_HINT } from "@/lib/natal-wheel-card";
import { NatalWheelExplorer } from "./NatalWheelExplorer";
import { SAMPLE_BIRTH, sampleChart } from "./sample-chart.test-support";

const KEY_TEXTS = { "sun-pisces": { summary: "x", href: "/natalnaya-karta/solntse-v-ribah" } };
const render = (props: Partial<Parameters<typeof NatalWheelExplorer>[0]> = {}, time = true) =>
  renderToStaticMarkup(<NatalWheelExplorer chart={sampleChart(time)} birth={time ? SAMPLE_BIRTH : { ...SAMPLE_BIRTH, time: null }} keyTexts={KEY_TEXTS} {...props} />);

describe("NatalWheelExplorer before any choice", () => {
  const markup = render();

  test("keeps the wheel drawing as it is and only marks it interactive", () => {
    expect(markup).toContain('<figure class="natal-wheel natal-wheel--interactive"><svg');
    expect(markup).not.toMatch(/is-selected|is-related|wheel-highlight/);
  });

  test("shows the hint in a polite live region and no card", () => {
    expect(markup).toContain(`aria-live="polite"`);
    expect(markup).toContain(WHEEL_CARD_HINT);
    expect(markup).not.toContain("natal-wheel-card__title");
  });

  test("offers every body and both axes as buttons, none pressed, with the glyph hidden from screen readers", () => {
    const buttons = markup.match(/<button[^>]*natal-wheel-picker__item[^>]*>/g) ?? [];
    expect(buttons).toHaveLength(13);
    expect(buttons.every((button) => button.includes('aria-pressed="false"') && button.includes('type="button"'))).toBe(true);
    expect(markup).toContain("Асцендент");
  });

  test("has no axes buttons without the birth time", () => {
    const noTime = render({}, false);
    expect((noTime.match(/natal-wheel-picker__item/g) ?? []).length).toBe(11);
    expect(noTime).not.toContain("Асцендент</span>");
  });

  test("adds no role=status and no heading to the page", () => {
    expect(markup).not.toContain('role="status"');
    expect(markup).not.toMatch(/<h[1-6]/);
  });
});

describe("NatalWheelExplorer with a chosen body", () => {
  const markup = render({ initialSelection: { kind: "body", id: "sun" } });

  test("marks the body and its aspects and fills the card", () => {
    expect(markup).toContain('class="natal-wheel natal-wheel--interactive natal-wheel--selected"');
    expect(markup).toContain("wheel-point is-selected");
    expect(markup).toContain("wheel-aspect is-related");
    expect(markup).toContain("Солнце в Рыбах · 16°32′ · 10 дом");
  });

  test("presses the matching button and links to the published meaning page", () => {
    expect(markup).toMatch(/aria-pressed="true"[^>]*>(?:(?!<\/button>)[\s\S])*Солнце/);
    expect(markup).toContain('href="/natalnaya-karta/solntse-v-ribah"');
    expect(markup).toContain("Значение: Солнце в Рыбах");
  });
});

describe("NatalWheelExplorer with a chosen sign or house", () => {
  test("draws a highlight sector and marks the sign", () => {
    const markup = render({ initialSelection: { kind: "sign", sign: "pisces" } });
    expect(markup).toContain('class="wheel-highlight"');
    expect(markup).toContain("wheel-sign is-selected");
    expect(markup).toContain("Планеты в знаке");
  });

  test("marks the house number and names the planets inside", () => {
    const markup = render({ initialSelection: { kind: "house", house: 10 } });
    expect(markup).toContain("wheel-house-number is-selected");
    expect(markup).toContain("10 дом в Рыбах");
    expect(markup).toContain("Планеты в доме");
  });
});
