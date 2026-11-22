import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { buildMonthPage } from "@/lib/lunar-calendar";
import { MoonMonthDays } from "./MoonMonthDays";
import { MoonMonthStage } from "./MoonMonthStage";
import { MoonMonthPlace, MoonMonthRowsPlace, MoonPlaceLine } from "./MoonMonthPlace";

const NOW = new Date("2026-11-22T09:00:00Z");
const page = buildMonthPage(2026, 11, NOW);
const initialIndex = page.events.find((event) => event.kind === "full")?.dayIndex ?? 0;
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

describe("MoonMonthPlace without a chosen city", () => {
  test("renders the same stage markup as MoonMonthStage with the server data", () => {
    const direct = renderToStaticMarkup(<MoonMonthStage year={2026} month={11} days={page.cells} weeks={page.weeks} events={page.events} curve={page.curve} ribbon={page.ribbon} afterMonth={page.afterMonth} initialIndex={initialIndex} />);
    const wrapped = renderToStaticMarkup(<MoonMonthPlace year={2026} month={11} initial={page} initialIndex={initialIndex} />);
    expect(wrapped).toBe(direct);
  });

  test("renders the same data table as MoonMonthDays", () => {
    expect(renderToStaticMarkup(<MoonMonthRowsPlace year={2026} month={11} initial={page} />)).toBe(renderToStaticMarkup(<MoonMonthDays rows={page.rows} guide={page.guide} />));
  });

  test("the place line says Moscow and contains none of FORBIDDEN_MOON_WORDS", () => {
    const html = renderToStaticMarkup(<MoonPlaceLine />);
    expect(html).toBe('<p class="moon-hero__place">По Москве</p>');
    for (const word of FORBIDDEN_MOON_WORDS) expect(text(html), word).not.toContain(word);
  });
});
