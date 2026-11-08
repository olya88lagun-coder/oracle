import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { FateResult } from "./FateResult";

const RESULT = { sum: 29, steps: [29, 11], value: 11 } as const;

test("master 11 links to its own page, not to 2, and shows the arithmetic", () => {
  const html = renderToStaticMarkup(<FateResult iso="1992-03-14" result={RESULT} summary={{ text: "Одиннадцать связывают с вдохновением.", href: "/numerologiya/chislo-sudby/11" }} />);
  expect(html).toContain('href="/numerologiya/chislo-sudby/11"');
  expect(html).not.toContain('href="/numerologiya/chislo-sudby/2"');
  expect(html).toContain("1 + 4 + 0 + 3 + 1 + 9 + 9 + 2 = 29");
  expect(html).toContain("29 → 11");
  expect(html).toContain("Одиннадцать связывают с вдохновением.");
});

test("a number whose text is not published yet shows the digit without a link", () => {
  const html = renderToStaticMarkup(<FateResult iso="1990-11-29" result={{ sum: 32, steps: [32, 5], value: 5 }} />);
  expect(html).toContain("Описание появится позже");
  expect(html).not.toContain("/numerologiya/chislo-sudby/");
  expect(html).toMatch(/>5</);
});

test("the matrix button is a plain link to /matrica-sudby, so it works without sessionStorage", () => {
  const html = renderToStaticMarkup(<FateResult iso="1992-03-14" result={RESULT} />);
  expect(html).toContain('href="/matrica-sudby"');
});
