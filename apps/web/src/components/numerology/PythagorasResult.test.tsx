import { calculatePythagorasSquare } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { PythagorasResult, type SquareSummaries } from "./PythagorasResult";

const TODAY = new Date("2026-11-08");
const square = (iso: string) => {
  const result = calculatePythagorasSquare(iso, TODAY);
  if (!result) throw new Error(iso);
  return result;
};
const EMPTY: SquareSummaries = { cells: {}, lines: {} };
const FULL: SquareSummaries = {
  cells: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => [cell, { pusto: `Пусто ${cell}.`, [String(cell)]: `Одна ${cell}.`, [String(cell).repeat(2)]: "Две.", [String(cell).repeat(3)]: "Три.", [String(cell).repeat(4)]: "Четыре.", [String(cell).repeat(5)]: "Пять." }])),
  lines: { celeustremlennost: "Про цель.", temperament: "Про темперамент." },
};

test("working numbers with arithmetic, a captioned table, «—» for an empty cell and links to variant anchors", () => {
  const html = renderToStaticMarkup(<PythagorasResult iso="1987-05-14" square={square("1987-05-14")} summaries={FULL} fatePages={[]} />);
  expect(html).toContain("1 + 4 + 0 + 5 + 1 + 9 + 8 + 7 = 35");
  expect(html).toMatch(/35.*8.*33.*6/s);
  expect(html).toContain("<caption");
  expect(html).toContain(">333<");
  expect(html).toContain(">—<");
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora/2#pusto"');
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora/3#333"');
  expect(html).toContain("Пусто 2.");
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora/linii#celeustremlennost"');
  expect((html.match(/numerology-square__line"/g) ?? []).length).toBe(8);
});

test("nine ones lead to the last variant", () => {
  const html = renderToStaticMarkup(<PythagorasResult iso="1911-11-11" square={square("1911-11-11")} summaries={FULL} fatePages={[]} />);
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora/1#11111"');
});

test("without accepted texts there are no links to cell or line pages", () => {
  const html = renderToStaticMarkup(<PythagorasResult iso="1987-05-14" square={square("1987-05-14")} summaries={EMPTY} fatePages={[]} />);
  expect(html).not.toContain("/numerologiya/kvadrat-pifagora/");
  expect(html).toContain("Описание появится позже.");
  expect(html).not.toContain("/numerologiya/chislo-sudby/");
});

test("fate number link only to an accepted page; matrix link is plain", () => {
  const html = renderToStaticMarkup(<PythagorasResult iso="1987-05-14" square={square("1987-05-14")} summaries={EMPTY} fatePages={[8]} />);
  expect(html).toContain('href="/numerologiya/chislo-sudby/8"');
  expect(html).toContain('href="/matrica-sudby"');
});

test("a negative third number is shown honestly: the minus, then the number without it", () => {
  const html = renderToStaticMarkup(<PythagorasResult iso="2000-01-09" square={square("2000-01-09")} summaries={EMPTY} fatePages={[]} />);
  expect(html).toContain("12 − 2 × 9 = −6, без минуса 6");
  expect(html).not.toContain("12 − 2 × 9 = 6");
});
