import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ARCANA } from "@oracle/content";
import { ARTICLES, CONTENT_PLAN, checkArticle, linksOf, parseMarkdown, type ArticleCheckContext } from "@oracle/content/articles";
import { LILA_CELLS } from "@oracle/content/lila";
import { describe, expect, test } from "vitest";
import { BLOG_POSTS } from "./blog";
import { PUBLIC_PATHS } from "./seo";

const PUBLIC_DIR = fileURLToPath(new URL("../../public/", import.meta.url));
const ALLOWED_IMAGE = /^\/(?:hero|(?:arcana|lila|taro)\/\d{2}-[a-z]+(?:-[a-z]+)*)\.webp$/;
const MANUAL_SLUGS = new Set(BLOG_POSTS.filter((post) => !ARTICLES.some((article) => article.slug === post.slug)).map((post) => post.slug));

const context: ArticleCheckContext = {
  publicPaths: PUBLIC_PATHS,
  arcanumName: (number) => ARCANA.find((item) => item.number === number)?.name,
  cellName: (number) => LILA_CELLS.find((item) => item.number === number)?.name,
  today: new Date().toISOString().slice(0, 10),
};

const imageProblem = (url: string): string | null =>
  !ALLOWED_IMAGE.test(url) ? `${url}: разрешены только /hero.webp и существующие иллюстрации арканов, клеток и карт Таро` : existsSync(`${PUBLIC_DIR}${url.slice(1)}`) ? null : `${url}: файла нет в apps/web/public`;

describe("content plan", () => {
  test("uses only existing internal links and allowed existing images", () => {
    for (const topic of CONTENT_PLAN) {
      expect(topic.internalLinks.filter((link) => !PUBLIC_PATHS.includes(link)), topic.slug).toEqual([]);
      expect(imageProblem(topic.image), topic.slug).toBeNull();
    }
  });

  test("does not reuse a slug of the hand-written blog articles", () => {
    for (const topic of CONTENT_PLAN) expect(MANUAL_SLUGS.has(topic.slug), topic.slug).toBe(false);
  });

  test("is published exactly when the article exists", () => {
    const published = CONTENT_PLAN.filter((topic) => topic.status === "published").map((topic) => topic.slug).sort();
    expect(ARTICLES.map((article) => article.slug).sort()).toEqual(published);
  });
});

describe("published articles", () => {
  test.each(ARTICLES.map((article) => [article.slug, article] as const))("%s passes every automatic check", (_slug, article) => {
    expect(checkArticle(article, context)).toEqual([]);
    expect(imageProblem(article.image)).toBeNull();
  });

  test.each(ARTICLES.map((article) => [article.slug, article] as const))("%s follows its topic in the plan", (_slug, article) => {
    const topic = CONTENT_PLAN.find((item) => item.slug === article.slug);
    expect(topic, "нет темы в контент-плане").toBeDefined();
    const links = linksOf(parseMarkdown(article.body));
    for (const required of topic?.internalLinks ?? []) expect(links, `нет ссылки ${required}`).toContain(required);
    expect(article.basis).toEqual(expect.arrayContaining([...(topic?.basis ?? [])]));
  });

  test("have unique slugs and appear in the blog and in the public paths", () => {
    expect(new Set(ARTICLES.map((article) => article.slug)).size).toBe(ARTICLES.length);
    for (const article of ARTICLES) {
      expect(BLOG_POSTS.some((post) => post.slug === article.slug)).toBe(true);
      expect(PUBLIC_PATHS).toContain(`/blog/${article.slug}`);
    }
  });
});
