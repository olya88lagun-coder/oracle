import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ArticleStudyFigure } from "./ArticleStudyFigure";

describe("article teaching figures", () => {
  test("matrix diagram uses the same calculation as the worked example, with point names distinct from arcana", () => {
    const html = renderToStaticMarkup(<ArticleStudyFigure slug="kak-rasschitat-matritsu-sudby" />);
    for (const [point, value] of [["A", 9], ["B", 11], ["C", 22], ["D", 6], ["E", 12]] as const) {
      expect(html).toContain(`data-point="${point}" data-value="${value}"`);
    }
    expect(html).toContain("27.11.1984");
    expect(html).toContain('data-point="C2"');
    expect(html).toContain('role="img"');
  });
  test("money diagram carries the dates and numbers from its own article", () => {
    const html = renderToStaticMarkup(<ArticleStudyFigure slug="liniya-deneg-v-matritse-sudby" />);
    expect(html).toContain("29.03.1988");
    expect(html).toContain('data-point="money" data-value="8"');
    expect(html).toContain('data-point="heart" data-value="19"');
  });
  test("relationship diagram matches the article's revised worked example", () => {
    const html = renderToStaticMarkup(<ArticleStudyFigure slug="liniya-lyubvi-v-matritse-sudby" />);
    expect(html).toContain("29.03.1988");
    expect(html).toContain('data-point="D2" data-value="3"');
    expect(html).toContain('data-point="heart" data-value="19"');
    expect(html).toContain('data-point="love" data-value="22"');
  });
  test("court comparison includes each of the sixteen original cards once and links to its meaning", () => {
    const html = renderToStaticMarkup(<ArticleStudyFigure slug="pridvornye-karty-taro" />);
    expect(html.match(/href="\/taro\/karty\//g)).toHaveLength(16);
    for (const suit of ["zhezly", "kubki", "mechi", "pentakli"]) for (const rank of ["pazh", "ryttsar", "koroleva", "korol"]) {
      expect(html).toContain(`href="/taro/karty/${suit}-${rank}"`);
    }
    expect(html).toContain("Памелы Колман Смит");
  });
  test("suit comparison contains all four aces", () => {
    const html = renderToStaticMarkup(<ArticleStudyFigure slug="masti-taro" />);
    expect(html.match(/href="\/taro\/karty\//g)).toHaveLength(4);
    for (const suit of ["zhezly", "kubki", "mechi", "pentakli"]) expect(html).toContain(`href="/taro/karty/${suit}-tuz"`);
  });
  test("house example displays a real wheel and explicitly distinguishes sign and house", () => {
    const html = renderToStaticMarkup(<ArticleStudyFigure slug="doma-v-natalnoy-karte" />);
    expect(html).toContain('data-house="10"');
    expect(html).toContain('data-body="sun"');
    expect(html).toContain("10 — дом");
    expect(html).toContain("без известного времени рождения дома не определяются");
  });
  test("unrelated articles are not given a generic decorative diagram", () => {
    expect(renderToStaticMarkup(<ArticleStudyFigure slug="kak-igrat-v-lilu-onlain" />)).toBe("");
  });
});
