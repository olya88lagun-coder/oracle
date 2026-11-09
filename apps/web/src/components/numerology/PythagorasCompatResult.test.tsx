import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { PAIR_FIXTURES } from "@/app/numerologiya/kvadrat-pifagora/sovmestimost/pair-fixtures";
import { pairOutcome } from "@/lib/pythagoras-compat";
import { PythagorasCompatResult, type PairTexts } from "./PythagorasCompatResult";

const TODAY = new Date("2026-11-09");
const TEXTS: PairTexts = {
  cells: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => [cell, { empty: `Пусто у обоих ${cell}.`, close: `Похоже ${cell}.`, apart: `По-разному ${cell}.` }])),
  lines: { temperament: { same: "Темперамент один.", differ: "Темперамент разный." }, semya: { same: "Семья одна.", differ: "Семья разная." } },
};

function render([you, partner]: readonly [string, string], texts: PairTexts = TEXTS): string {
  const outcome = pairOutcome(you, partner, TODAY);
  if (!outcome.ok) throw new Error(outcome.error);
  return renderToStaticMarkup(<PythagorasCompatResult outcome={outcome} texts={texts} />);
}

test("pair square: captioned table, nine cells with both people and the relation", () => {
  const html = render(PAIR_FIXTURES.allRelations);
  expect(html).toContain("Ваши квадраты Пифагора");
  expect(html).toContain("<caption");
  expect((html.match(/<td/g) ?? []).length).toBe(9);
  expect((html.match(/Вы: /g) ?? []).length).toBeGreaterThanOrEqual(9);
  expect((html.match(/Партнёр: /g) ?? []).length).toBeGreaterThanOrEqual(9);
  for (const label of ["похоже", "по-разному", "у обоих пусто"]) expect(html).toContain(label);
  expect(html).toContain("Как посчитано");
  expect(html).toContain("1 + 4 + 0 + 5 + 1 + 9 + 8 + 7 = 35");
});

test("similar and different blocks with pair texts and links to each variant", () => {
  const html = render(PAIR_FIXTURES.allRelations);
  expect(html).toContain("Где вы похожи");
  expect(html).toContain("Где различаетесь");
  expect(html).toContain("Пусто у обоих 2.");
  expect(html).toContain("По-разному 4.");
  expect(html).toContain("у вас 4, у партнёра —");
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora/4#4"');
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora/4#pusto"');
  expect(html).toContain("Ваш вариант: 4");
  expect(html).toContain("Вариант партнёра: пустая ячейка");
});

test("pair lines: temperament first with levels, eight lines, links to line anchors", () => {
  const html = render(PAIR_FIXTURES.allRelations);
  expect(html).toContain("Линии пары");
  const lines = html.slice(html.indexOf("Линии пары"));
  expect(lines.indexOf("Темперамент")).toBeLessThan(lines.indexOf("Целеустремлённость"));
  expect(html).toContain("(3-5-7): у вас 6 (много), у партнёра 5 (средне)");
  expect(html).toContain("<strong>Темперамент</strong> (3-5-7)");
  expect(html).toContain("Темперамент разный.");
  expect((html.match(/numerology-pair__line"/g) ?? []).length).toBe(8);
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora/linii#temperament"');
});

test("nine ones link to the last variant", () => {
  expect(render(PAIR_FIXTURES.fiveDigits)).toContain('href="/numerologiya/kvadrat-pifagora/1#11111"');
});

test("one date twice: no differences block, one calm line instead", () => {
  const html = render(PAIR_FIXTURES.same);
  expect(html).not.toContain("Где различаетесь");
  expect(html).toContain("Во всех ячейках у вас похожая картина.");
});

test("a missing pair text says it will appear later; next links go to the square and the matrix compatibility", () => {
  const html = render(PAIR_FIXTURES.allRelations, { cells: {}, lines: {} });
  expect(html).toContain("Описание появится позже.");
  expect(html).toContain('href="/numerologiya/kvadrat-pifagora"');
  expect(html).toContain('href="/sovmestimost"');
});
