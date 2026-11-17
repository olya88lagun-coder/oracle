import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { ThreadCalculator } from "./ThreadCalculator";

test("the first screen has one h1, the labelled date field, the button and the privacy line, and no result yet", () => {
  const html = renderToStaticMarkup(<ThreadCalculator texts={{ years: {}, periods: {} }} />);
  expect((html.match(/<h1/g) ?? []).length).toBe(1);
  expect(html).toContain("Вся жизнь — <span>одной нитью</span>");
  expect(html).toContain("График судьбы по дате рождения");
  expect(html).toContain('<label for="thread-birth-date">Дата рождения</label>');
  expect(html).toContain("Показать мою нить");
  expect(html).toContain("Дата остаётся в браузере");
  expect(html).not.toContain("Где вы сейчас");
  expect(html).not.toContain('role="alert"');
});
