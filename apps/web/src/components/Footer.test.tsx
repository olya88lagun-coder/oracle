import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Footer } from "./Footer";

test("the footer links to the Moon today page without adding it to the header sections", () => {
  const html = renderToStaticMarkup(<Footer />);
  expect(html).toMatch(/<a href="\/luna-segodnya">Луна сегодня<\/a>/);
});
