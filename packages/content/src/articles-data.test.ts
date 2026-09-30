import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { collectArticles } from "../scripts/build-arcana.mjs";
import { ARTICLE_BASIS } from "./article-basis";
import { ARTICLES, articleBySlug } from "./articles-data";
import raw from "./generated/articles.json";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const ARTICLES_DIR = fileURLToPath(new URL("../articles", import.meta.url));

describe("published articles", () => {
  test("generated json is in sync with packages/content/articles (run pnpm content:build)", () => {
    expect(raw).toEqual(collectArticles(ARTICLES_DIR));
  });

  test("every article parses and can be found by slug", () => {
    for (const article of ARTICLES) expect(articleBySlug(article.slug)).toBe(article);
    expect(articleBySlug("net-takoj-stati")).toBeUndefined();
  });

  test("every basis key points to existing files", () => {
    for (const [key, entry] of Object.entries(ARTICLE_BASIS)) {
      for (const file of entry.files) expect(existsSync(join(ROOT, file)), `${key}: ${file}`).toBe(true);
    }
  });
});
