import { findStopPhrases } from "@oracle/content";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { HowToPlayLila } from "@/components/blog/HowToPlayLila";
import { LilaIntention } from "@/components/blog/LilaIntention";
import { LilaSnakesArrows } from "@/components/blog/LilaSnakesArrows";
import { WhatIsMatrix } from "@/components/blog/WhatIsMatrix";
import { MATRIX_FAQ, matrixFaqJsonLd, MatrixGuide } from "@/components/matrix/MatrixGuide";
import { BLOG_POSTS, blogPath, blogPostBySlug, blogPostJsonLd } from "./blog";
import { PUBLIC_PATHS } from "./seo";

const text = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("blog posts", () => {
  test("have unique slugs, short titles and descriptions that fit a search snippet", () => {
    expect(new Set(BLOG_POSTS.map((post) => post.slug)).size).toBe(BLOG_POSTS.length);
    for (const post of BLOG_POSTS) {
      expect(post.metaTitle.length).toBeLessThanOrEqual(75);
      expect(post.description.length).toBeGreaterThanOrEqual(90);
      expect(post.description.length).toBeLessThanOrEqual(175);
    }
  });

  test("are in the public paths together with the index", () => {
    expect(PUBLIC_PATHS).toContain("/blog");
    for (const post of BLOG_POSTS) expect(PUBLIC_PATHS).toContain(blogPath(post));
  });

  test("describe themselves as an article by the site with an absolute image", () => {
    const post = blogPostBySlug("zmei-i-strely-lily")!;
    expect(blogPostJsonLd(post)).toMatchObject({ "@type": "Article", headline: post.title, datePublished: "2026-09-30", author: { "@type": "Organization" } });
    expect(String(blogPostJsonLd(post).image)).toMatch(/^https?:\/\/.+\/lila\/12-zavist\.webp$/);
  });
});

describe("article texts", () => {
  const bodies = { HowToPlayLila, LilaSnakesArrows, LilaIntention, WhatIsMatrix, MatrixGuide };

  test.each(Object.entries(bodies))("%s has no prediction stop phrases", (_name, Component) => {
    expect(findStopPhrases(text(renderToStaticMarkup(createElement(Component))))).toEqual([]);
  });

  test("the snakes article lists exactly ten snakes and ten arrows with links to the cells", () => {
    const html = renderToStaticMarkup(createElement(LilaSnakesArrows));
    expect(html.match(/<tr>/g)?.length).toBe(22);
    expect(html).toContain("/lila/kletki/12-zavist");
    expect(html).toContain("/lila/kletki/68-kosmicheskoe-soznanie");
  });
});

describe("matrix FAQ", () => {
  test("is shown and published as FAQPage markup with the same questions", () => {
    const html = renderToStaticMarkup(createElement(MatrixGuide));
    for (const item of MATRIX_FAQ) expect(html).toContain(item.question);
    const entities = (matrixFaqJsonLd().mainEntity as { name: string }[]).map((entity) => entity.name);
    expect(entities).toEqual(MATRIX_FAQ.map((item) => item.question));
  });
});
