import { describe, expect, test } from "vitest";
import { ArticleMarkdownError, linksOf, parseMarkdown, plainText } from "./article-markdown";

describe("parseMarkdown", () => {
  test("reads headings, paragraphs, bullet lists, bold and internal links", () => {
    const blocks = parseMarkdown("Вступление про **главное**.\n\n## Раздел\n\n- один\n- два с [калькулятором](/matrica-sudby)\n\nАбзац\nв две строки.");
    expect(blocks).toEqual([
      { type: "p", inlines: [{ type: "text", text: "Вступление про " }, { type: "strong", text: "главное" }, { type: "text", text: "." }] },
      { type: "h2", text: "Раздел" },
      { type: "ul", items: [[{ type: "text", text: "один" }], [{ type: "text", text: "два с " }, { type: "link", text: "калькулятором", href: "/matrica-sudby" }]] },
      { type: "p", inlines: [{ type: "text", text: "Абзац в две строки." }] },
    ]);
  });

  test("plainText drops markup and linksOf lists every internal link", () => {
    const blocks = parseMarkdown("Про [Лилу](/lila) и **суть**.\n\n## Заголовок\n\n- пункт [клетка](/lila/kletki/01-rozhdenie)");
    expect(plainText(blocks)).toBe("Про Лилу и суть.\nЗаголовок\nпункт клетка");
    expect(linksOf(blocks)).toEqual(["/lila", "/lila/kletki/01-rozhdenie"]);
  });

  test.each([
    ["заголовок третьего уровня", "### Мелко"],
    ["заголовок первого уровня", "# Крупно"],
    ["нумерованный список", "1. первый\n2. второй"],
    ["цитата", "> цитата"],
    ["таблица", "| a | b |\n| - | - |"],
    ["код", "```\nкод\n```"],
    ["картинка", "![alt](/hero.webp)"],
    ["внешняя ссылка", "[сайт](https://example.com)"],
    ["html", "Текст <b>жирный</b>"],
    ["курсив звёздочкой", "Слово *курсив* тут"],
    ["смешанный список", "- пункт\nобычная строка"],
    ["заголовок в две строки", "## Раздел\nпродолжение"],
  ])("rejects %s", (_name, source) => {
    expect(() => parseMarkdown(source)).toThrow(ArticleMarkdownError);
  });
});
