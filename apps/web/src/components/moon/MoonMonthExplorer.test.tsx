import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { buildMonthPage } from "@/lib/lunar-calendar";
import { MoonMonthExplorer } from "./MoonMonthExplorer";

const page = buildMonthPage(2026, 11, new Date("2026-11-17T09:00:00Z"));
const html = renderToStaticMarkup(<MoonMonthExplorer weeks={page.weeks} days={page.cells} events={page.events} initialIndex={16} />);
const count = (pattern: RegExp) => html.match(pattern)?.length ?? 0;

describe("MoonMonthExplorer", () => {
  test("renders a real table of seven weekday columns and six rows of cells", () => {
    expect(count(/<th[ >]/g)).toBe(7);
    expect(count(/<tr[ >]/g)).toBe(7);
    expect(count(/<td[ >]/g)).toBe(42);
    expect(count(/data-date="2026-11-\d\d"/g)).toBe(30);
    expect(count(/moon-month__cell is-empty/g)).toBe(12);
  });

  test("gives every day a button named by its date, phase and illumination, and marks only the chosen day", () => {
    expect(count(/class="moon-month__pick"/g)).toBe(30);
    expect(html).toMatch(/aria-label="17 ноября: Первая четверть, освещено (49|50|51) %"/);
    expect(count(/aria-pressed="true"/g)).toBe(1);
    expect(count(/aria-pressed="false"/g)).toBe(29);
    expect(html).toMatch(/aria-pressed="true"[^>]*aria-label="17 ноября|aria-label="17 ноября[^"]*"[^>]*aria-pressed="true"/);
  });

  test("has one Tab stop: the chosen day is reachable, the others are not", () => {
    expect(count(/tabindex="0"/g)).toBe(1);
    expect(count(/tabindex="-1"/g)).toBe(29);
  });

  test("tells every cell how lit the Moon is, from 0 to 1, and its order for the intro wave", () => {
    const lit = [...html.matchAll(/--lit:\s*([\d.]+)/g)].map((match) => Number(match[1]));
    expect(lit).toHaveLength(30);
    for (const value of lit) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(html).toMatch(/--i:\s*0[";]/);
    expect(html).toMatch(/--i:\s*29[";]/);
  });

  test("shows the chosen day in the panel: a caption read aloud and three details", () => {
    expect(html).toContain('id="moon-month-selected"');
    expect(html).toContain('aria-live="polite"');
    expect(/id="moon-month-selected"[\s\S]*?<\/figcaption>/.exec(html)?.[0]).toContain("Первая четверть");
    expect(count(/<dt>/g)).toBe(3);
    for (const term of ["Лунные сутки", "Знак Луны", "Восход и заход"]) expect(html).toContain(term);
  });

  test("has a button for each key date with its kind, and no forbidden words", () => {
    expect(count(/class="moon-event"/g)).toBe(4);
    for (const kind of ["new", "firstQuarter", "full", "lastQuarter"]) expect(html).toContain(`data-kind="${kind}"`);
    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    for (const word of FORBIDDEN_MOON_WORDS) expect(text, word).not.toContain(word);
  });
});
