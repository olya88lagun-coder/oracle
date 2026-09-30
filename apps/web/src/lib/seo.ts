import type { Metadata } from "next";
import { ARCANA } from "@oracle/content";
import { LILA_CELLS } from "@oracle/content/lila";
import { ARCANUM_IMAGE_SIZE, arcanumPath, MATRIX_PATH } from "./arcana-paths";
import { BLOG_PATH, BLOG_POSTS, blogPath } from "./blog";
import { lilaCellPath, LILA_PATH } from "./lila-paths";
import { DOCUMENT_PATHS } from "./legal";
import { SITE_NAME, SITE_URL, SOCIAL_LINKS } from "./site";

// Личные страницы: вход, портрет и всё, что под ними. В поиск не попадают
export const PRIVATE_PATHS: readonly string[] = ["/api/", "/login", "/portret", "/lila/igra"];

// Практики и их справочники; следующие планы добавят свои
export const PUBLIC_PATHS: string[] = ["/", MATRIX_PATH, ...ARCANA.map(arcanumPath), LILA_PATH, ...LILA_CELLS.map(lilaCellPath), BLOG_PATH, ...BLOG_POSTS.map(blogPath), ...DOCUMENT_PATHS];

type PreviewImage = { url: string; alt: string; width?: number; height?: number };

export function publicMetadata(p: { title: string; description: string; path: string; absoluteTitle?: boolean; image?: PreviewImage }): Metadata {
  // Иллюстрации арканов и клеток квадратные 960 px; общая картинка сайта размеров не указывает
  const images = p.image ? [{ width: ARCANUM_IMAGE_SIZE, height: ARCANUM_IMAGE_SIZE, ...p.image }] : undefined;
  return {
    title: p.absoluteTitle ? { absolute: p.title } : p.title,
    description: p.description,
    robots: { index: true, follow: true },
    alternates: { canonical: p.path },
    openGraph: { title: p.title, description: p.description, url: p.path, type: "website", locale: "ru_RU", siteName: SITE_NAME, ...(images && { images }) },
    twitter: { card: images ? "summary_large_image" : "summary", title: p.title, description: p.description, ...(images && { images: images.map((image) => image.url) }) },
  };
}

// Общая картинка сайта для главной и страниц без своей иллюстрации
export const SITE_PREVIEW_IMAGE: PreviewImage = { url: "/hero.webp", alt: "Твой оракул — символические практики для самопознания", width: 2400, height: 1028 };

// Разметка schema.org: строка для <script type="application/ld+json">, «<» экранируется, чтобы текст не закрыл тег
export const jsonLdScript = (data: Record<string, unknown>): string => JSON.stringify(data).replace(/</g, "\\u003c");

export const websiteJsonLd = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, inLanguage: "ru" },
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/hero.webp`, sameAs: SOCIAL_LINKS.map((link) => link.url) },
  ],
});

export const lilaGameJsonLd = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Лила онлайн",
  url: `${SITE_URL}${LILA_PATH}`,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  inLanguage: "ru",
  description: "Игра с намерением: поле из 72 клеток, кубик, змеи и стрелы, вопросы для размышления и записи мыслей.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
});
