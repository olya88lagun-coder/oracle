import { describe, expect, test } from "vitest";
import { BLOG_POSTS, blogPath } from "@/lib/blog";
import { NOINDEX_DOCUMENT_PATHS } from "@/lib/legal";
import { lunarDayPathsForSitemap, lunarMonthPath, monthWindow } from "@/lib/lunar-calendar-paths";
import { PUBLIC_PATHS } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { taroCardPathsForSitemap } from "@/lib/taro-paths";
import sitemap, { sitemapPaths } from "./sitemap";

const entriesOf = (prefix: string) => sitemap().map((item) => item.url).filter((url) => url.includes(prefix));
const entry = (path: string) => sitemap().find((item) => item.url === (path === "/" ? SITE_URL : `${SITE_URL}${path}`));

describe("sitemap.xml", () => {
  test("lists every sitemap path exactly once and skips noindex legal texts", () => {
    const urls = sitemap().map((item) => item.url);
    expect(urls).toHaveLength(sitemapPaths().length);
    expect(urls.length).toBeLessThan(PUBLIC_PATHS.length - NOINDEX_DOCUMENT_PATHS.length);
    expect(new Set(urls).size).toBe(urls.length);
    for (const path of NOINDEX_DOCUMENT_PATHS) expect(entry(path), path).toBeUndefined();
    expect(entry("/contacts")).toBeDefined();
  });

  test("priorities tell the page kinds apart: home, practices, articles, ordinary pages and reference pages", () => {
    expect(entry("/")?.priority).toBe(1);
    for (const path of ["/matrica-sudby", "/sovmestimost", "/lila", "/taro", "/taro/karta-dnya", "/natalnaya-karta", "/luna-segodnya"]) expect(entry(path)?.priority, path).toBe(0.8);
    expect(entry("/blog")?.priority).toBe(0.6);
    for (const post of BLOG_POSTS) expect(entry(blogPath(post))?.priority, post.slug).toBe(0.6);
    expect(entry("/matrica-sudby/arkan-1-mag")?.priority).toBe(0.5);
    for (const path of ["/natalnaya-karta/slovar-terminov", "/metodika", "/contacts"]) expect(entry(path)?.priority, path).toBe(0.3);
  });

  test("an article carries its edit date, or else its publication date, as lastmod; pages without a reliable date carry none", () => {
    for (const post of BLOG_POSTS) expect(entry(blogPath(post))?.lastModified, post.slug).toEqual(new Date(post.updated ?? post.published));
    expect(entry("/lila")?.lastModified).toBeUndefined();
    expect(entry("/")?.lastModified).toBeUndefined();
  });

  test("lists every month page of the lunar calendar with the priority of reference pages, but not the entry that redirects", () => {
    const window = monthWindow(new Date());
    expect(window).toHaveLength(15);
    for (const { year, month } of window) expect(entry(lunarMonthPath(year, month))?.priority, `${year}-${month}`).toBe(0.6);
    expect(entry("/lunnyy-kalendar")).toBeUndefined();
  });

  test("lists only nearby date pages with the lowest lunar priority, not the whole 15-month window", () => {
    const paths = lunarDayPathsForSitemap(new Date());
    expect(paths).toHaveLength(entriesOf("/lunnyy-kalendar/").filter((url) => /\/\d{1,2}-[a-z]+-\d{4}$/.test(url)).length);
    expect(paths.length).toBeLessThanOrEqual(61);
    expect(paths.length).toBeGreaterThanOrEqual(30);
    for (const path of paths) expect(entry(path)?.priority, path).toBe(0.4);
    expect(entry("/lunnyy-kalendar/24-noyabrya-2020")).toBeUndefined();
    expect(entry("/lunnyy-kalendar/1-yanvarya-2028")).toBeUndefined();
  });

  test("lists only the 22 major arcana card pages, not the minor ones", () => {
    const majors = taroCardPathsForSitemap();
    expect(majors).toHaveLength(22);
    for (const path of majors) expect(entry(path)?.priority, path).toBe(0.5);
    expect(entry("/taro/karty/mag")).toBeDefined();
    expect(entry("/taro/karty/zhezly-tuz")).toBeUndefined();
    expect(entry("/taro")).toBeDefined();
    expect(entry("/taro/rasklady")).toBeDefined();
  });
});
