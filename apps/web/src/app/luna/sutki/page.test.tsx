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
