import type { Metadata } from "next";
import { ARCANA } from "@oracle/content";
import { LILA_CELLS } from "@oracle/content/lila";
import { ARCANUM_IMAGE_SIZE, arcanumPath, MATRIX_PATH } from "./arcana-paths";
import { lilaCellPath, LILA_PATH } from "./lila-paths";
import { DOCUMENT_PATHS } from "./legal";
import { SITE_NAME } from "./site";

// Личные страницы: вход, портрет и всё, что под ними. В поиск не попадают
export const PRIVATE_PATHS: readonly string[] = ["/api/", "/login", "/portret", "/lila/igra"];

// Практики и их справочники; следующие планы добавят свои
export const PUBLIC_PATHS: string[] = ["/", MATRIX_PATH, ...ARCANA.map(arcanumPath), LILA_PATH, ...LILA_CELLS.map(lilaCellPath), ...DOCUMENT_PATHS];

type PreviewImage = { url: string; alt: string };

export function publicMetadata(p: { title: string; description: string; path: string; absoluteTitle?: boolean; image?: PreviewImage }): Metadata {
  const images = p.image ? [{ ...p.image, width: ARCANUM_IMAGE_SIZE, height: ARCANUM_IMAGE_SIZE }] : undefined;
  return {
    title: p.absoluteTitle ? { absolute: p.title } : p.title,
    description: p.description,
    robots: { index: true, follow: true },
    alternates: { canonical: p.path },
    openGraph: { title: p.title, description: p.description, url: p.path, type: "website", locale: "ru_RU", siteName: SITE_NAME, ...(images && { images }) },
  };
}
