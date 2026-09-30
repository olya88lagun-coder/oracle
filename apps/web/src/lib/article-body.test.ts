import { parseArticle } from "@oracle/content/articles";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { articleFaqJsonLd } from "./blog";

const SOURCE = `---
title: Предназначение в матрице судьбы
metaTitle: Предназначение в матрице судьбы — личное, социальное, духовное
description: Что такое личное, социальное и духовное предназначение в матрице судьбы и как читать их как направления, а не как задания.
date: 2026-10-02
image: /hero.webp
imageAlt: Матрица судьбы
cluster: matrix
basis: positions; matrix-formulas
faq: Что такое предназначение? => Направление для размышления. || Это задание? => Нет. || Где оно? => В основных точках.
---
Первый абзац с [калькулятором](/matrica-sudby) и **выделением**.

## Раздел

- пункт один
- пункт два`;

const article = parseArticle("prednaznachenie-v-matritse-sudby", SOURCE);

describe("ArticleBody", () => {
  const html = renderToStaticMarkup(createElement(ArticleBody, { article }));

  test("renders the text with internal links, the FAQ and the basis block", () => {
    expect(html).toMatch(/<a[^>]*href="\/matrica-sudby"[^>]*>калькулятором<\/a>/);
    expect(html).toContain("<strong>выделением</strong>");
    expect(html).toContain("<h2>Раздел</h2>");
    expect(html).toContain("<li>пункт два</li>");
    expect(html).toContain("Частые вопросы");
    expect(html).toContain("<h3>Что такое предназначение?</h3>");
    expect(html).toContain("На чём основана статья");
    expect(html).toContain("Описания позиций матрицы судьбы");
    expect(html).toContain("Формулы расчёта матрицы судьбы");
  });

  test("publishes the FAQ as FAQPage markup with the same questions", () => {
    const markup = articleFaqJsonLd(article);
    const entities = markup.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(markup["@type"]).toBe("FAQPage");
    expect(entities.map((entity) => entity.name)).toEqual(article.faq.map((item) => item.question));
    expect(entities[0]?.acceptedAnswer.text).toBe("Направление для размышления.");
  });
});
