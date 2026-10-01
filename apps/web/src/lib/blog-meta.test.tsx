import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { HowToPlayLila } from "@/components/blog/HowToPlayLila";
import { LilaIntention } from "@/components/blog/LilaIntention";
import { LilaSnakesArrows } from "@/components/blog/LilaSnakesArrows";
import { WhatIsMatrix } from "@/components/blog/WhatIsMatrix";
import { BLOG_POSTS, blogTopics, countWords, readingMinutesFor, relatedPosts } from "./blog";

const BODIES = { "kak-igrat-v-lilu-onlain": HowToPlayLila, "zmei-i-strely-lily": LilaSnakesArrows, "kak-sformulirovat-namerenie-dlya-lily": LilaIntention, "chto-takoe-matritsa-sudby": WhatIsMatrix };

describe("reading time", () => {
  test("is words / 180 rounded up, at least one minute", () => {
    expect(readingMinutesFor(0)).toBe(1);
    expect(readingMinutesFor(180)).toBe(1);
    expect(readingMinutesFor(181)).toBe(2);
  });

  test("the stored time of the hand-written articles matches their real text", () => {
    for (const [slug, Body] of Object.entries(BODIES)) {
      const words = countWords(renderToStaticMarkup(createElement(Body)).replace(/<[^>]+>/g, " "));
      expect(BLOG_POSTS.find((post) => post.slug === slug)?.readingMinutes, slug).toBe(readingMinutesFor(words));
    }
  });
});

describe("topics and related posts", () => {
  test("every post has a topic and a positive reading time; topic counts add up", () => {
    for (const post of BLOG_POSTS) {
      expect(post.readingMinutes).toBeGreaterThanOrEqual(1);
      expect(["matrix", "compat", "lila", "taro"]).toContain(post.topic);
    }
    expect(blogTopics().reduce((sum, item) => sum + item.count, 0)).toBe(BLOG_POSTS.length);
  });

  test("related posts exclude the post itself and prefer the same topic", () => {
    const post = BLOG_POSTS.find((item) => item.topic === "lila")!;
    const related = relatedPosts(post);
    expect(related.some((item) => item.slug === post.slug)).toBe(false);
    expect(related[0]?.topic).toBe("lila");
    expect(related.length).toBeLessThanOrEqual(3);
  });
});
