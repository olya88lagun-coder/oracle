import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { Footer } from "./Footer";

test("the footer links to the Moon today page without adding it to the header sections", () => {
  const html = renderToStaticMarkup(<Footer />);
  expect(html).toMatch(/<a href="\/luna-segodnya">Луна сегодня<\/a>/);
});

test("the footer links to the lunar calendar entry, which leads to the current month", () => {
  const html = renderToStaticMarkup(<Footer />);
  expect(html).toMatch(/<a href="\/lunnyy-kalendar">Лунный календарь<\/a>/);
});

test("the footer keeps its three link groups, the disclaimer and the legal links with the cookie settings", () => {
  const html = renderToStaticMarkup(<Footer />);
  for (const label of ["Разделы сайта", "О проекте", "Документы"]) expect(html).toContain(`aria-label="${label}"`);
  expect(html).toContain("не предсказания");
  for (const text of ["Политика обработки данных", "Оферта", "Согласие", "Настройки cookie"]) expect(html).toContain(text);
  expect(html.match(/<footer/g)).toHaveLength(1);
});
