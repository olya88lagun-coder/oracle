import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { isBasisKey } from "./article-basis";
import { CONTENT_PLAN, nextDraftTopic, type PlanTopic } from "./content-plan";
import { NATAL_PAGES } from "./natal-manifest";

const PUBLIC_DIR = fileURLToPath(new URL("../../../apps/web/public/", import.meta.url));

describe("content plan", () => {
  test("Tarot entries use real card images and link to a real card", () => {
    const tarot = CONTENT_PLAN.filter((topic) => topic.cluster === "taro");
    expect(tarot.length).toBeGreaterThanOrEqual(8);
    for (const topic of tarot) {
      expect(topic.basis).toContain("tarot");
      expect(topic.image).toMatch(/^\/taro\/[a-z0-9-]+\.webp$/);
      expect(existsSync(join(PUBLIC_DIR, topic.image.slice(1))), topic.slug).toBe(true);
      expect(topic.internalLinks).toContain("/taro");
      expect(topic.internalLinks.some((href) => href.startsWith("/taro/karty/"))).toBe(true);
    }
  });

  test("natal chart entries rest on natal sources and link only to real meaning pages", () => {
    const natal = CONTENT_PLAN.filter((topic) => topic.cluster === "natal");
    const meaningPages = new Set(NATAL_PAGES.map((page) => `/natalnaya-karta/${page.slug}`));
    expect(natal.length).toBeGreaterThanOrEqual(50);
    for (const topic of natal) {
      expect(topic.basis.some((key) => key === "natal" || key === "natal-method"), topic.slug).toBe(true);
      expect(topic.image, topic.slug).toBe("/practices/natal.webp");
      expect(existsSync(join(PUBLIC_DIR, topic.image.slice(1))), topic.slug).toBe(true);
      expect(topic.internalLinks, topic.slug).toContain("/natalnaya-karta");
      for (const link of topic.internalLinks.filter((href) => href.startsWith("/natalnaya-karta/"))) expect(meaningPages.has(link), `${topic.slug}: ${link}`).toBe(true);
    }
  });

  test("no topic repeats a «planet in sign» reference page", () => {
    const meaningSlugs = new Set(NATAL_PAGES.map((page) => page.slug));
    for (const topic of CONTENT_PLAN) expect(meaningSlugs.has(topic.slug), topic.slug).toBe(false);
  });

  test("has unique latin slugs and well-formed topics", () => {
    expect(new Set(CONTENT_PLAN.map((topic) => topic.slug)).size).toBe(CONTENT_PLAN.length);
    for (const topic of CONTENT_PLAN) {
      expect(topic.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(topic.title.length).toBeLessThanOrEqual(90);
      expect(topic.primaryQuery.length).toBeGreaterThan(5);
      expect(topic.basis.length).toBeGreaterThan(0);
      expect(topic.basis.every(isBasisKey)).toBe(true);
      expect(topic.internalLinks.length).toBeGreaterThanOrEqual(2);
      expect(topic.internalLinks.every((link) => link.startsWith("/"))).toBe(true);
      expect(topic.image).toMatch(/\.webp$/);
    }
  });

  test("starts with the highest-demand topic", () => {
    expect(CONTENT_PLAN[0]?.slug).toBe("rasshifrovka-matritsy-sudby");
  });

  test("nextDraftTopic returns the first topic that is still a draft", () => {
    const plan: PlanTopic[] = CONTENT_PLAN.map((topic, index) => ({ ...topic, status: index < 2 ? "published" : "draft" }));
    expect(nextDraftTopic(plan)?.slug).toBe(CONTENT_PLAN[2]?.slug);
    expect(nextDraftTopic(plan.map((topic) => ({ ...topic, status: "published" as const })))).toBeUndefined();
  });
});
