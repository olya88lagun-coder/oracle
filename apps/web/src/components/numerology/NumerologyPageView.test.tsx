import type { NumerologyText } from "@oracle/content/numerology";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { NumerologyPageView } from "./NumerologyPageView";

const text: NumerologyText = {
  kind: "square",
  key: "4",
  title: "Четвёрки в квадрате Пифагора",
  description: "",
  batch: 6,
  sections: [{ title: "4", paragraphs: ["Одна четвёрка."], items: [] }, { title: "44", paragraphs: ["Две четвёрки."], items: [] }],
  faq: [],
};
const props = { text, crumbs: [], siblings: [], footer: { name: "Назад", href: "/" } };

test("sections get ids only from the anchors map", () => {
  const html = renderToStaticMarkup(<NumerologyPageView {...props} anchors={{ "44": "44" }} />);
  expect(html).toContain('<section id="44"');
  expect(html.match(/<section id=/g)).toHaveLength(1);
  expect(renderToStaticMarkup(<NumerologyPageView {...props} />)).not.toContain("<section id=");
});
