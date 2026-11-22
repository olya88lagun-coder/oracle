import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { buildMoonToday } from "@/lib/moon-today";
import { MoonTodayView } from "./MoonTodayView";

const NOW = new Date("2026-11-22T09:00:00Z");
const today = buildMoonToday(NOW);
const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0;

describe("MoonTodayView", () => {
  test("renders one h1 with the given date, the four tiles, the next change and the three text cards for Moscow", () => {
    const html = renderToStaticMarkup(<MoonTodayView today={today} headingDate="22 ноября 2026" />);
    expect(count(html, /<h1[\s>]/g)).toBe(1);
    expect(html).toContain("<h1>Луна сегодня, 22 ноября 2026</h1>");
    expect(html).toContain('<p class="moon-hero__place">По Москве</p>');
    expect(count(html, /class="moon-tile"/g)).toBe(4);
    expect(html).toContain("Ближайшая смена");
    expect(count(html, /class="moon-text__block"/g)).toBe(3);
    expect(html).toContain("Что описывает этот день");
  });

  test("leads to the page of today's date", () => {
    const html = renderToStaticMarkup(<MoonTodayView today={today} headingDate="22 ноября 2026" />);
    expect(html).toContain('href="/lunnyy-kalendar/22-noyabrya-2026"');
    expect(html).toContain("Страница дня");
  });

  test("with a city the place line and the rise tile say so and the note is shown", () => {
    const html = renderToStaticMarkup(<MoonTodayView today={today} headingDate="22 ноября 2026" placeLabel="Новосибирск" placeNote="Сейчас в Новосибирске — 23 ноября" />);
    expect(html).toContain('<p class="moon-hero__place">Для города Новосибирск</p>');
    expect(html).not.toContain(">По Москве<");
    expect(html).toContain("Сейчас в Новосибирске — 23 ноября");
  });

  test("does not import the calculation engine or the Moon today builder at runtime", () => {
    const source = readFileSync(new URL("./MoonTodayView.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/^import (?!type )[^\n]*from "@\/lib\/moon-today"/m);
    expect(source).not.toMatch(/^import (?!type )[^\n]*from "@oracle\/core\/moon"/m);
    expect(source).not.toMatch(/^import (?!type )[^\n]*from "@oracle\/content/m);
  });
});
