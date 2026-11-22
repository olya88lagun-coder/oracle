import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import Page, { metadata } from "./page";

test("metadata: canonical path and a title that names the thirty days", () => {
  expect(metadata.alternates?.canonical).toBe("/luna/sutki");
  expect(String(metadata.title)).toContain("все 30");
});

test("one h1, thirty links to the days with their symbols, and no link to itself in the continue block", () => {
  const markup = renderToStaticMarkup(<Page />);
  expect(markup.match(/<h1/g)).toHaveLength(1);
  expect(markup.match(/href="\/luna\/sutki\/\d+"/g)).toHaveLength(30);
  expect(markup).toContain("1 · Светильник");
  expect(markup).toContain("30 · Лебедь");
  expect(markup).not.toContain('<a href="/luna/sutki">');
});

test("has the Moon ribbon with the days tab current", async () => {
  const markup = renderToStaticMarkup(<Page />);
  expect(markup).toContain('aria-label="Лунный раздел"');
  expect(markup.indexOf('aria-label="Лунный раздел"')).toBeLessThan(markup.indexOf("moon-breadcrumb"));
  expect(markup.match(/aria-current="page"[^>]*>Сутки</g)).toHaveLength(1);
});

test("the thirty days are cards with engravings: one picture and one link each, the label stays «N · symbol»", () => {
  const markup = renderToStaticMarkup(<Page />);
  expect(markup.match(/class="moon-day-card"/g)).toHaveLength(30);
  expect(markup.match(/\/luna\/days\/\d{2}-[a-z-]+-480\.webp/g)).toHaveLength(30);
  expect(markup).toContain("/luna/days/01-svetilnik-480.webp");
  expect(markup).toContain("/luna/days/30-lebed-480.webp");
  expect(markup.match(/<img[^>]*alt=""/g)).toHaveLength(30);
});
