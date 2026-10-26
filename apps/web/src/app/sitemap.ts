import type { MetadataRoute } from "next";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { BLOG_PATH, BLOG_POSTS, blogPath } from "@/lib/blog";
import { COMPAT_PATH } from "@/lib/compat";
import { DOCUMENT_PATHS } from "@/lib/legal";
import { LILA_PATH } from "@/lib/lila-paths";
import { GLOSSARY_PATH } from "@/lib/natal-glossary";
import { NATAL_PATH } from "@/lib/natal-paths";
import { PUBLIC_PATHS } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { TARO_DAY_PATH, TARO_PATH } from "@/lib/taro-paths";

// Приоритет — подсказка, а не команда (Google его не учитывает, Яндекс учитывает как намёк), но разведём виды страниц:
// входы в практики выше, справочные и юридические страницы ниже, остальные (значения арканов, карт, клеток, знаков) — посередине
const PRACTICE_PATHS: ReadonlySet<string> = new Set(["/arkan-2027", MATRIX_PATH, COMPAT_PATH, LILA_PATH, TARO_PATH, TARO_DAY_PATH, NATAL_PATH]);
const REFERENCE_PATHS: ReadonlySet<string> = new Set([GLOSSARY_PATH, "/metodika", `${MATRIX_PATH}/primer`, `${LILA_PATH}/primer`, `${NATAL_PATH}/primer`, ...DOCUMENT_PATHS]);

const priorityOf = (path: string): number => {
  if (path === "/") return 1;
  if (PRACTICE_PATHS.has(path)) return 0.8;
  if (path === BLOG_PATH || path.startsWith(`${BLOG_PATH}/`)) return 0.6;
  return REFERENCE_PATHS.has(path) ? 0.3 : 0.5;
};

// lastmod только там, где есть настоящая дата: у статей это день выхода. У остальных страниц даты правки у нас нет,
// а выдуманная (например, время сборки) заставила бы поисковик пересканировать неизменившееся и со временем перестать верить файлу
const PUBLISHED = new Map(BLOG_POSTS.map((post) => [blogPath(post), new Date(post.published)]));

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => {
    const lastModified = PUBLISHED.get(path);
    return {
      url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
      ...(lastModified && { lastModified }),
      changeFrequency: "monthly",
      priority: priorityOf(path),
    };
  });
}
