import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import * as copy from "@/lib/moon-place-copy";
import { placeFromCity } from "@/lib/moon-place";
import { MoonPlaceDialog } from "./MoonPlaceDialog";

const NOVOSIBIRSK = placeFromCity({ id: 1496747, name: "Новосибирск", region: "Новосибирская область", country: "Россия", latitude: 55.0415, longitude: 82.9346, zone: "Asia/Novosibirsk", population: 1_500_000 });
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

describe("MoonPlaceDialog", () => {
  test("renders a labelled dialog with the Moon texts and no reset button when no city is chosen", () => {
    const html = renderToStaticMarkup(<MoonPlaceDialog open={false} onClose={() => undefined} current={null} />);
    expect(html).toContain("<dialog");
    expect(html).toMatch(/aria-labelledby="[^"]+"/);
    expect(html).toContain(copy.PLACE_DIALOG_TITLE);
    expect(html).toContain(">Ваш город<");
    expect(html).toContain(copy.PLACE_HINT);
    expect(html).not.toContain(copy.PLACE_RESET);
  });

  test("shows the reset button when a city is chosen", () => {
    const html = renderToStaticMarkup(<MoonPlaceDialog open={false} onClose={() => undefined} current={NOVOSIBIRSK} />);
    expect(html).toContain(copy.PLACE_RESET);
  });

  test("has the message for a city whose time zone the browser does not know", () => {
    expect(copy.PLACE_ZONE_ERROR).toMatch(/часов/);
  });

  test("the copy contains none of FORBIDDEN_MOON_WORDS and the chip label is Moscow by default", () => {
    const html = text(renderToStaticMarkup(<MoonPlaceDialog open={false} onClose={() => undefined} current={null} />));
    for (const word of FORBIDDEN_MOON_WORDS) expect(html, word).not.toContain(word);
    expect(copy.placeChipAria("Москва")).toBe("Город для лунных данных: Москва. Изменить");
  });
});
