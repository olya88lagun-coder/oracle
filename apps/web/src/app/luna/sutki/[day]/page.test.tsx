import { FORBIDDEN_MOON_WORDS } from "@oracle/content/moon";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }) }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import Page, { generateMetadata, generateStaticParams } from "./page";

const render = async (day: string) => renderToStaticMarkup(await Page({ params: Promise.resolve({ day }) }));
const visibleText = (markup: string) => markup.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-20T09:00:00Z"));
  mocks.notFound.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("a lunar day page", () => {
  test("day 8 has one h1 with the symbol, the accepted text and question, the facts and the neighbours", async () => {
    const markup = await render("8");
    expect(markup.match(/<h1/g)).toHaveLength(1);
    expect(markup).toContain("<h1>8-е лунные сутки: «Феникс»</h1>");
    expect(markup).toContain("moon-text__question");
    expect(markup).toContain("Первая четверть");
    expect(markup).toContain('href="/luna/sutki/7"');
    expect(markup).toContain('href="/luna/sutki/9"');
    expect(markup).toContain('href="/luna/sutki"');
    expect(markup).not.toContain('<a href="/luna/sutki/8">');
  });

  test("the third days say «3-и», the new moon day has no «previous» link", async () => {
    expect(await render("3")).toContain("<h1>3-и лунные сутки: «Леопард»</h1>");
    expect(await render("1")).not.toContain('rel="prev"');
  });

  test("metadata: canonical path and the symbol in the title", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ day: "15" }) });
    expect(metadata.alternates?.canonical).toBe("/luna/sutki/15");
    expect(String(metadata.title)).toContain("Змея");
  });

  test("anything but 1…30 is a real 404", async () => {
    for (const day of ["0", "31", "01", "-1", "abc", "8 ", "1.5"]) await expect(render(day), day).rejects.toThrow("NEXT_NOT_FOUND");
  });

  test("the visible text of every day has no forbidden word", async () => {
    for (let day = 1; day <= 30; day++) {
      const text = visibleText(await render(String(day)));
      for (const word of FORBIDDEN_MOON_WORDS) expect(text, `${day} ${word}`).not.toContain(word);
    }
  }, 60_000);

  test("static params are the 30 days", () => {
    expect(generateStaticParams().map((item) => item.day)).toEqual(Array.from({ length: 30 }, (_, index) => String(index + 1)));
  });
});
