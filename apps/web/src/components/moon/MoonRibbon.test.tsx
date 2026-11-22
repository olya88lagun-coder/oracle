import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { moonRibbonData } from "@/lib/moon-ribbon";
import { MoonRibbon } from "./MoonRibbon";

const NOW = new Date("2026-11-22T09:00:00Z");
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

describe("MoonRibbon", () => {
  test("renders five tab links with aria-current on the current one only", () => {
    const html = renderToStaticMarkup(<MoonRibbon current="calendar" now={NOW} />);
    expect(html).toContain('aria-label="Лунный раздел"');
    expect(html.match(/class="moon-rail__tab"/g) ?? []).toHaveLength(5);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="page"[^>]*>Календарь<|href="\/lunnyy-kalendar\/noyabr-2026"[^>]*aria-current="page"/);
    for (const href of ["/luna-segodnya", "/lunnyy-kalendar/noyabr-2026", "/luna/fazy-luny", "/luna/sutki", "/dni-nedeli"]) expect(html).toContain(`href="${href}"`);
  });

  test("marks no tab as current when current is null", () => {
    expect(renderToStaticMarkup(<MoonRibbon current={null} now={NOW} />)).not.toContain("aria-current");
  });

  test("renders the live part only when initial data is given", () => {
    const data = moonRibbonData(NOW);
    const live = renderToStaticMarkup(<MoonRibbon current="today" now={NOW} initial={data} />);
    expect(live).toContain("moon-rail__now");
    expect(live).toContain(data.phaseName);
    expect(live).toContain(`${data.lunarDay.number}-е сутки`);
    expect(renderToStaticMarkup(<MoonRibbon current="today" now={NOW} />)).not.toContain("moon-rail__now");
  });

  test("does not render the streak chip on the server and contains none of FORBIDDEN_MOON_WORDS", () => {
    const html = renderToStaticMarkup(<MoonRibbon current="today" now={NOW} initial={moonRibbonData(NOW)} />);
    expect(html).not.toContain("moon-rail__streak");
    for (const word of FORBIDDEN_MOON_WORDS) expect(text(html), word).not.toContain(word);
  });
});
