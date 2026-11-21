import { describe, expect, test } from "vitest";
import { BLOG_POSTS, relatedPosts, type BlogPost } from "./blog";

// Four posts can fill every recommendation slot within their own topic.
// The single natal post must still get an incoming link from that group.
const posts: readonly BlogPost[] = (["numerology", "natal", "numerology", "numerology", "numerology"] as const).map((topic, index) => ({
  ...BLOG_POSTS[0]!,
  slug: `related-fixture-${index}`,
  topic,
}));

describe("related posts with an isolated topic", () => {
  test.each([1, 3])("every article has an incoming link when the limit is %i", (limit) => {
    const incoming = new Map(posts.map((post) => [post.slug, 0]));
    for (const post of posts) {
      const related = relatedPosts(post, limit, posts);
      expect(related.length).toBeLessThanOrEqual(limit);
      expect(related.some((item) => item.slug === post.slug)).toBe(false);
      expect(new Set(related.map((item) => item.slug)).size).toBe(related.length);
      for (const item of related) incoming.set(item.slug, incoming.get(item.slug)! + 1);
    }
    for (const [slug, count] of incoming) expect(count, slug).toBeGreaterThanOrEqual(1);
  });

  test("keeps the first recommendation in the same topic when three slots are available", () => {
    const related = relatedPosts(posts[0]!, 3, posts);
    expect(related[0]?.topic).toBe("numerology");
    expect(related.some((item) => item.slug === "related-fixture-1")).toBe(true);
    expect(related).toHaveLength(3);
  });

  test("returns no recommendations for a zero limit", () => {
    expect(relatedPosts(BLOG_POSTS[0]!, 0)).toEqual([]);
  });
});
