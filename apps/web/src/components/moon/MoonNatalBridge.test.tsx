import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { NATAL_PATH } from "@/lib/natal-paths";
import { MOON_SIGN_PATH } from "@/lib/moon-natal-bridge";
import { MoonNatalBridge } from "./MoonNatalBridge";

const text = (markup: string) => markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

describe("MoonNatalBridge", () => {
  test("today: names today's sign, shows the engraving and leads to the moon-sign page", () => {
    const html = renderToStaticMarkup(<MoonNatalBridge from="today" signName="в Овне" art="/luna/signs/aries-160.webp" />);
    expect(html).toContain("Сегодня Луна в Овне");
    expect(html).toContain("/luna/signs/aries-160.webp");
    expect(html).toContain(`href="${MOON_SIGN_PATH}"`);
    expect(html).toContain("Узнать свою Луну");
  });

  test("month: no engraving, leads to the moon-sign page", () => {
    const html = renderToStaticMarkup(<MoonNatalBridge from="month" />);
    expect(html).not.toContain("<img");
    expect(html).toContain(`href="${MOON_SIGN_PATH}"`);
  });

  test("day: names the sign of the day and leads to the moon-sign page", () => {
    const html = renderToStaticMarkup(<MoonNatalBridge from="day" signName="в Тельце" />);
    expect(html).toContain("В этот день Луна в Тельце");
    expect(html).toContain(`href="${MOON_SIGN_PATH}"`);
    expect(html).toContain('data-from="day"');
  });

  test("weekday: leads to the natal calculator", () => {
    const html = renderToStaticMarkup(<MoonNatalBridge from="weekday" />);
    expect(html).toContain(`href="${NATAL_PATH}"`);
    expect(html).toContain("Рассчитать карту");
  });

  test("one heading, no prices, no forecasts, and the data stays in the browser", () => {
    for (const from of ["today", "month", "weekday", "day"] as const) {
      const html = renderToStaticMarkup(<MoonNatalBridge from={from} signName="в Овне" />);
      expect(html.match(/<h2/g), from).toHaveLength(1);
      expect(html, from).not.toContain("₽");
      expect(text(html), from).toContain("в вашем браузере");
      for (const word of FORBIDDEN_MOON_WORDS) expect(text(html), `${from}: ${word}`).not.toContain(word);
    }
  });
});
