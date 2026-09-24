import type { Metadata } from "next";
import { DOCUMENT_PATHS } from "./legal";
import { SITE_NAME } from "./site";

// Личные страницы: вход, портрет и всё, что под ними. В поиск не попадают
export const PRIVATE_PATHS: readonly string[] = ["/api/", "/login", "/portret"];

// Страницы практик добавляют следующие планы
export const PUBLIC_PATHS: string[] = ["/", ...DOCUMENT_PATHS];

export function publicMetadata(p: { title: string; description: string; path: string; absoluteTitle?: boolean }): Metadata {
  return {
    title: p.absoluteTitle ? { absolute: p.title } : p.title,
    description: p.description,
    robots: { index: true, follow: true },
    alternates: { canonical: p.path },
    openGraph: { title: p.title, description: p.description, url: p.path, type: "website", locale: "ru_RU", siteName: SITE_NAME },
  };
}
