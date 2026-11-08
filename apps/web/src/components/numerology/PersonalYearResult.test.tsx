import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { PersonalYearResult } from "./PersonalYearResult";

test("shows the arithmetic, links to the year page and to the arcanum of 2027", () => {
  const html = renderToStaticMarkup(<PersonalYearResult iso="1992-03-14" result={{ year: 2027, sum: 19, value: 1 }} summary={{ text: "Год начала.", href: "/numerologiya/lichnyy-god-2027/1" }} />);
  expect(html).toContain("1 + 4 + 0 + 3 + 2 + 0 + 2 + 7 = 19");
  expect(html).toContain("19 → 10 → 1");
  expect(html).toContain('href="/numerologiya/lichnyy-god-2027/1"');
  expect(html).toContain('href="/arkan-2027"');
});

test("without a published text: digit only, no link to the year page", () => {
  const html = renderToStaticMarkup(<PersonalYearResult iso="1990-11-29" result={{ year: 2027, sum: 24, value: 6 }} />);
  expect(html).toContain("Описание появится позже");
  expect(html).not.toContain("/numerologiya/lichnyy-god-2027/");
});
