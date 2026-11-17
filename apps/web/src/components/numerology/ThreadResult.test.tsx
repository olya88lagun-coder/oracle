import { calculateLifeThread } from "@oracle/core";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { ThreadCard, ThreadTexts } from "@/lib/life-thread";
import { ThreadResult } from "./ThreadResult";

const thread = calculateLifeThread("1990-07-15", new Date("2026-11-18T12:00:00Z"));
if (!thread) throw new Error("bad date");

const card = (title: string): ThreadCard => ({ sections: [{ title, paragraphs: [`Первый абзац: ${title}.`, "Второй абзац."] }] });
const TEXTS: ThreadTexts = {
  years: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [n, card(`Тема года ${n}`)])),
  periods: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [n, card(`Сила периода ${n}`)])),
};

test("«Где вы сейчас»: the current year, its name, its end date and its card", () => {
  const html = renderToStaticMarkup(<ThreadResult thread={thread} texts={TEXTS} />);
  expect(html).toContain("Год 5");
  expect(html).toContain("перемены");
  expect(html).toContain("до 14 июля 2027");
  expect(html).toContain("Первый абзац: Тема года 5.");
});

test("four periods with their positions, years and numbers", () => {
  const html = renderToStaticMarkup(<ThreadResult thread={thread} texts={TEXTS} />);
  for (const label of ["I период · формирование", "II период · зрелость", "III период · плоды", "IV период · мудрость"]) expect(html).toContain(label);
  expect(html).toContain("1990–2021");
  expect(html).toContain("с 2039");
  expect(html).toContain("Первый абзац: Сила периода 4.");
});

test("the open formula shows the digits of this date for the current year", () => {
  const html = renderToStaticMarkup(<ThreadResult thread={thread} texts={TEXTS} />);
  expect(html).toContain("1 + 5 + 0 + 7 + 2 + 0 + 2 + 6 = 23");
  expect(html).toContain("23 → 5");
});

test("without published texts the cards say the description will appear later and carry no links", () => {
  const html = renderToStaticMarkup(<ThreadResult thread={thread} texts={{ years: {}, periods: {} }} />);
  expect(html).toContain("Описание появится позже");
  expect(html).not.toContain("<a ");
});
