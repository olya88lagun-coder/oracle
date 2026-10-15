import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { PortraitNatal } from "./PortraitNatal";

describe("PortraitNatal", () => {
  test("shows the heading, the line with date, time and place, and a link to the chart", () => {
    const markup = renderToStaticMarkup(<PortraitNatal date="1990-03-07" time="12:05" placeName="Москва" />);

    expect(markup).toBe(
      '<section class="portrait-natal" aria-labelledby="natal"><h2 id="natal">Натальная карта</h2><p class="portrait-natal__data">7 марта 1990 · 12:05 · Москва</p><a href="/natalnaya-karta">Открыть карту</a></section>',
    );
  });

  test("says that the time is not given when it is unknown", () => {
    const markup = renderToStaticMarkup(<PortraitNatal date="1990-03-07" time={null} placeName="Санкт-Петербург" />);

    expect(markup).toContain('<p class="portrait-natal__data">7 марта 1990 · время не указано · Санкт-Петербург</p>');
  });

  test("escapes a place name instead of inserting markup", () => {
    const markup = renderToStaticMarkup(<PortraitNatal date="1990-03-07" time={null} placeName={"<img src=x onerror=alert(1)>"} />);

    expect(markup).not.toContain("<img");
    expect(markup).toContain("&lt;img");
  });
});
