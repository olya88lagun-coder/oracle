import { describe, expect, test } from "vitest";
import { BLOG_POSTS, blogPath } from "@/lib/blog";
import { PUBLIC_PATHS } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import sitemap from "./sitemap";

const entry = (path: string) => sitemap().find((item) => item.url === (path === "/" ? SITE_URL : `${SITE_URL}${path}`));

describe("sitemap.xml", () => {
  test("lists every public page exactly once", () => {
    const urls = sitemap().map((item) => item.url);
    expect(urls).toHaveLength(PUBLIC_PATHS.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  test("priorities tell the page kinds apart: home, practices, articles, ordinary pages and reference pages", () => {
    expect(entry("/")?.priority).toBe(1);
    for (const path of ["/matrica-sudby", "/sovmestimost", "/lila", "/taro", "/taro/karta-dnya", "/natalnaya-karta"]) expect(entry(path)?.priority, path).toBe(0.8);
    expect(entry("/blog")?.priority).toBe(0.6);
    for (const post of BLOG_POSTS) expect(entry(blogPath(post))?.priority, post.slug).toBe(0.6);
    expect(entry("/matrica-sudby/arkan-1-mag")?.priority).toBe(0.5);
    for (const path of ["/natalnaya-karta/slovar-terminov", "/metodika", "/privacy", "/oferta"]) expect(entry(path)?.priority, path).toBe(0.3);
  });

  test("an article carries the date it was published as lastmod; pages without a reliable date carry none", () => {
    for (const post of BLOG_POSTS) expect(entry(blogPath(post))?.lastModified, post.slug).toEqual(new Date(post.published));
    expect(entry("/lila")?.lastModified).toBeUndefined();
    expect(entry("/")?.lastModified).toBeUndefined();
  });
});
