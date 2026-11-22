import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { buildMoonToday } from "@/lib/moon-today";
import { MoonTodayLive } from "./MoonTodayLive";

const today = buildMoonToday(new Date("2026-11-22T09:00:00Z"));

test("without a place it renders the Moscow server data and the Moscow label with the server date in the only h1", () => {
  const html = renderToStaticMarkup(<MoonTodayLive initial={today} headingDate={today.dateLabel} />);
  expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  expect(html).toContain("<h1>Луна сегодня, 22 ноября 2026</h1>");
  expect(html).toContain('<p class="moon-hero__place">По Москве</p>');
  expect(html).not.toContain("Для города");
});
