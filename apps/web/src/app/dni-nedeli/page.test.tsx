import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { WEEKDAY_PATH } from "@/lib/weekday-planets";
import Page, { metadata } from "./page";

const TITLE_SUFFIX = " — Твой оракул";
const html = () => renderToStaticMarkup(<Page />);

test("metadata: canonical path, title and description within snippet limits", () => {
  expect(metadata.alternates?.canonical).toBe(WEEKDAY_PATH);
  expect(String(metadata.title).length + TITLE_SUFFIX.length).toBeLessThanOrEqual(60);
  expect(String(metadata.description).length).toBeGreaterThanOrEqual(90);
  expect(String(metadata.description).length).toBeLessThanOrEqual(175);
});

test("one h1, seven day cards with anchors, exactly one marked as today", () => {
  const markup = html();
  expect(markup.match(/<h1/g)).toHaveLength(1);
  for (const slug of ["ponedelnik", "vtornik", "sreda", "chetverg", "pyatnitsa", "subbota", "voskresenie"]) expect(markup).toContain(`id="${slug}"`);
  expect(markup.match(/class="weekday-card"/g)).toHaveLength(7);
  expect(markup.match(/aria-current="date"/g)).toHaveLength(1);
  expect(markup.match(/weekday-card__badge/g)).toHaveLength(1);
});

test("shows the today block, the wheel and a FAQ; the disclaimer is there", () => {
  const markup = html();
  expect(markup).toMatch(/Сегодня [а-яё]+ — день [А-Яа-яё]+/);
  expect(markup).toContain("weekday-wheel");
  expect(markup).toContain("<details>");
  expect(markup).toContain("moon-disclaimer");
});
