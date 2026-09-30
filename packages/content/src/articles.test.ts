import { describe, expect, test } from "vitest";
import { ARTICLE_BASIS, isBasisKey } from "./article-basis";
import { articleSource, sampleArticle } from "./article-fixture";
import { ArticleFormatError, parseArticle } from "./articles";

describe("parseArticle", () => {
  test("reads the header, faq and body of a well-formed article", () => {
    const article = sampleArticle();
    expect(article.slug).toBe("prednaznachenie-v-matritse-sudby");
    expect(article.title).toBe("Предназначение в матрице судьбы");
    expect(article.date).toBe("2026-10-02");
    expect(article.basis).toEqual(["positions", "matrix-formulas"]);
    expect(article.faq).toHaveLength(3);
    expect(article.faq[0]).toEqual({ question: "Что такое предназначение?", answer: "Направление, в котором жизнь может ощущаться осмысленной." });
    expect(article.body.startsWith("Предназначение в матрице судьбы")).toBe(true);
  });

  test.each([
    ["нет шапки", "просто текст", /шапк/],
    ["нет обязательного поля", articleSource({ cluster: null }), /cluster/],
    ["неизвестное поле", articleSource({ author: "Иван" }), /author/],
    ["плохая дата", articleSource({ date: "2026-02-31" }), /date/],
    ["несуществующий месяц", articleSource({ date: "2026-13-45" }), /date/],
    ["картинка не webp", articleSource({ image: "/hero.png" }), /image/],
    ["неизвестный ключ основания", articleSource({ basis: "positions; wikipedia" }), /wikipedia/],
    ["пустое основание", articleSource({ basis: "" }), /basis/],
    ["мало вопросов", articleSource({ faq: "Один? => Ответ." }), /faq/],
    ["вопрос без знака", articleSource({ faq: "А => Б. || В? => Г. || Д? => Е." }), /вопрос/],
  ])("rejects %s", (_name, source, message) => {
    expect(() => parseArticle("prednaznachenie-v-matritse-sudby", source)).toThrow(ArticleFormatError);
    expect(() => parseArticle("prednaznachenie-v-matritse-sudby", source)).toThrow(message);
  });

  test("rejects a slug that is not latin lowercase with hyphens", () => {
    expect(() => parseArticle("Bad_Slug", articleSource())).toThrow(/slug/);
  });
});

describe("article basis", () => {
  test("has a label and at least one source file for every key", () => {
    for (const [key, entry] of Object.entries(ARTICLE_BASIS)) {
      expect(isBasisKey(key)).toBe(true);
      expect(entry.label.length).toBeGreaterThan(5);
      expect(entry.files.length).toBeGreaterThan(0);
    }
    expect(isBasisKey("wikipedia")).toBe(false);
  });
});
