import { calculateLifeThread } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { ThreadChart } from "./ThreadChart";

const TODAY = new Date("2026-11-18T12:00:00Z");
const thread = (iso: string) => {
  const result = calculateLifeThread(iso, TODAY);
  if (!result) throw new Error("bad date");
  return result;
};
const rows = (html: string) => (html.match(/data-year="/g) ?? []).length;

test("the picture is labelled, shows «Вы здесь», the toggle, and the periods that fall in the window", () => {
  const html = renderToStaticMarkup(<ThreadChart thread={thread("1990-07-15")} />);
  expect(html).toContain('role="img"');
  expect(html).toMatch(/aria-label="Линия жизни по годам/);
  expect(html).toContain("Вы здесь · год 5");
  expect(html).toContain("Вся жизнь");
  expect(html).toContain("I период");
  expect(html).toContain("III период");
  expect(html).not.toContain("IV период");
});

test("the whole-life view adds the open last period", () => {
  const html = renderToStaticMarkup(<ThreadChart thread={thread("1990-07-15")} initialMode="all" />);
  expect(html).toContain("IV период · и дальше");
  expect(html).toContain('aria-pressed="true"');
});

test("the table lists 19 years, names 2029 «урожай» and marks 2026 as the current one", () => {
  const html = renderToStaticMarkup(<ThreadChart thread={thread("1990-07-15")} />);
  expect(rows(html)).toBe(19);
  expect(/data-year="2029"[^>]*>(?:(?!<\/tr>)[\s\S])*урожай/.test(html)).toBe(true);
  expect(/data-year="2026"[^>]*aria-current="date"|aria-current="date"[^>]*data-year="2026"/.test(html)).toBe(true);
});

test("a child born three years ago: fewer than 19 rows, no NaN and no undefined", () => {
  const html = renderToStaticMarkup(<ThreadChart thread={thread("2023-05-10")} />);
  expect(rows(html)).toBeLessThan(19);
  expect(rows(html)).toBeGreaterThan(9);
  expect(html).not.toContain("NaN");
  expect(html).not.toContain("undefined");
});

test("the picture and the table use no evaluating words", () => {
  const html = renderToStaticMarkup(<ThreadChart thread={thread("1990-07-15")} initialMode="all" />).toLowerCase();
  for (const word of ["плох", "спад", "приговор", "неблагоприят"]) expect(html).not.toContain(word);
});
