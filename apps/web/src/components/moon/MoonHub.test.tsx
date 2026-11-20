import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { MoonHub } from "./MoonHub";

const NOW = new Date("2026-11-20T09:00:00Z");

describe("MoonHub", () => {
  test("links to the month, today, the phases, the year pages, the lunar days, the eclipses, both retrogrades, the card of the day and the natal chart, each with a note", () => {
    const html = renderToStaticMarkup(<MoonHub now={NOW} id="hub" />);
    for (const href of ["/lunnyy-kalendar/noyabr-2026", "/luna-segodnya", "/luna/fazy-luny", "/luna/novoluniya-2026", "/luna/polnoluniya-2026", "/luna/sutki", "/luna/zatmeniya-2026", "/luna/retrograd-merkuriya-2026", "/luna/retrograd-venery-2026", "/taro/karta-dnya", "/natalnaya-karta"]) expect(html, href).toContain(`href="${href}"`);
    expect(html.match(/moon-links__note/g)).toHaveLength(11);
    expect(html).toContain("Какая Луна в вашей натальной карте");
  });

  test("does not repeat the page it stands on", () => {
    const html = renderToStaticMarkup(<MoonHub now={NOW} current="/luna/fazy-luny" id="hub" />);
    expect(html).not.toContain('href="/luna/fazy-luny"');
    expect(html.match(/moon-links__note/g)).toHaveLength(10);
  });
});
