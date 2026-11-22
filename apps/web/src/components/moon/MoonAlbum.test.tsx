import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ALBUM_REWARDS, albumDate, daysInRow } from "@/lib/moon-album-copy";
import { collectionItems } from "@/lib/moon-collection-items";
import { buildThreadDays } from "@/lib/moon-thread";
import { MoonAlbum } from "./MoonAlbum";

const NOW = new Date("2026-11-22T09:00:00Z");
const markup = () =>
  renderToStaticMarkup(
    <MoonAlbum
      thread={buildThreadDays(NOW)}
      days={[{ date: "2026-11-22", sign: "aries", phase: "waxingGibbous" }, { date: "2026-11-23", sign: "taurus", phase: "waxingGibbous" }]}
      items={collectionItems()}
      todayUnlock={["sign:aries", "phase:waxingGibbous"]}
    />,
  );
const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

describe("MoonAlbum before hydration", () => {
  test("renders the heading, 14 thread beads and 20 album tiles", () => {
    const html = markup();
    expect(html).toMatch(/<h2[^>]*>Лунный альбом<\/h2>/);
    expect(count(html, /class="moon-album__bead[ "]/g)).toBe(14);
    expect(count(html, /class="moon-album__slot[ "]/g)).toBe(20);
    expect(html).toContain('id="moon-album"');
  });

  test("shows all four reward steps with their captions, none earned yet", () => {
    const html = markup();
    for (const caption of Object.values(ALBUM_REWARDS)) expect(html).toContain(caption);
    expect(html).not.toContain("is-done");
  });

  test("does not render the fresh-engraving card or the streak chip on the server", () => {
    const html = markup();
    expect(html).not.toContain("moon-album__reveal");
    expect(html).not.toContain("moon-album__streak");
  });

  test("contains none of FORBIDDEN_MOON_WORDS and no fear-of-missing-out wording", () => {
    const visible = text(markup());
    for (const word of FORBIDDEN_MOON_WORDS) expect(visible, word).not.toContain(word);
    for (const word of ["потеряли", "сгорит", "не упустите"]) expect(visible, word).not.toContain(word);
  });
});

describe("copy helpers", () => {
  test("daysInRow declines 1, 2, 5, 11, 21", () => {
    expect([1, 2, 5, 11, 21].map(daysInRow)).toEqual(["1 день подряд", "2 дня подряд", "5 дней подряд", "11 дней подряд", "21 день подряд"]);
  });

  test("albumDate gives a day and a month in Russian", () => {
    expect(albumDate("2026-11-23")).toBe("23 ноября");
  });
});
