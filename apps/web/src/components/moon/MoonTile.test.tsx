import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { buildMoonTile } from "@/lib/moon-tile";
import { MoonTile } from "./MoonTile";

const NOW = new Date("2026-11-22T09:00:00Z");
const html = () => renderToStaticMarkup(<MoonTile data={buildMoonTile(NOW)} />);
const text = (markup: string) => markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

describe("MoonTile", () => {
  test("renders a heading, one link to the Moon today page and six week discs", () => {
    const markup = html();
    expect(markup).toMatch(/<h2 id="moon-portal-title">[^<]+<\/h2>/);
    expect(markup.match(/href="\/luna-segodnya"/g)).toHaveLength(1);
    expect(markup).toContain(">Открыть Луну сегодня<");
    expect(markup.match(/class="moon-portal__day[ "]/g)).toHaveLength(6);
    expect(markup).toContain("22 ноября");
    expect(markup).toContain("До полнолуния 2 дня");
  });

  test("shows the nominative sign and the light in the chips", () => {
    const markup = html();
    expect(markup).toMatch(/\d+ % света/);
    expect(markup).toContain("Овен");
  });

  test("renders no streak line on the server and none of FORBIDDEN_MOON_WORDS", () => {
    const markup = html();
    expect(markup).not.toContain("moon-portal__streak");
    for (const word of FORBIDDEN_MOON_WORDS) expect(text(markup), word).not.toContain(word);
  });
});
