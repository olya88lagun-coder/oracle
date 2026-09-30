import { parseArticle, type Article } from "./articles";
import raw from "./generated/articles.json";

export { ARTICLE_BASIS, type ArticleBasisKey } from "./article-basis";
export type { Article, ArticleFaq } from "./articles";

const SOURCES = raw as Record<string, string>;

// Собранные тексты: pnpm content:build → src/generated/articles.json. Отдельная точка входа, чтобы клиентский бандл не тянул лишнее
export const ARTICLES: readonly Article[] = Object.keys(SOURCES)
  .sort()
  .map((name) => parseArticle(name, SOURCES[name] ?? ""));

export const articleBySlug = (slug: string): Article | undefined => ARTICLES.find((article) => article.slug === slug);
