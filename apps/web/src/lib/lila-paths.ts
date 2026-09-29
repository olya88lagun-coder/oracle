import { LILA_CELLS, type LilaCell } from "@oracle/content/lila";
import { shortDescription } from "./short-description";

export const LILA_PATH = "/lila";
export const LILA_GAME_PATH = "/lila/igra";
const PARAM = /^(\d{2})-([a-z]+(?:-[a-z]+)*)$/;

type CellRef = { number: number; slug: string };

export const lilaParam = (cell: CellRef): string => `${String(cell.number).padStart(2, "0")}-${cell.slug}`;
export const lilaCellPath = (cell: CellRef): string => `${LILA_PATH}/kletki/${lilaParam(cell)}`;
export const lilaPaymentPath = (purchaseId: string): string => `${LILA_GAME_PATH}/oplata/${purchaseId}`;
export const lilaHistoryPath = (gameId: string): string => `/portret/lila/${gameId}`;

// Номер и slug должны совпасть с одной и той же клеткой — иначе 404, а не страница с чужим текстом
export function lilaCellFromParam(param: string): LilaCell | null {
  const match = PARAM.exec(param);
  if (!match) return null;
  const cell = LILA_CELLS.find((item) => item.number === Number(match[1]));
  return cell && cell.slug === match[2] ? cell : null;
}

// Иллюстрации в public/lila: 960 px — страница клетки и превью ссылок, 480 px — карточка хода, 160 px — сетка клеток.
// Пока картинки добавляются пачками, у клетки без файла показывается запасная карточка; когда готовы все 72, установить true
export const LILA_IMAGES_READY = true;
const IMAGE_SUFFIX = { page: "", card: "-480", thumb: "-160" } as const;
export type LilaImageSize = keyof typeof IMAGE_SUFFIX;
export const lilaImageFile = (cell: CellRef, size: LilaImageSize = "page"): string => `${lilaParam(cell)}${IMAGE_SUFFIX[size]}.webp`;
export const lilaCellImage = (cell: CellRef, size: LilaImageSize = "page"): string => `/lila/${lilaImageFile(cell, size)}`;

export const lilaCellDescription = (cell: LilaCell): string => shortDescription(cell.about);

export function lilaCellJsonLd(cell: LilaCell, siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Клетка ${cell.number} «${cell.name}» в игре Лила`,
    description: lilaCellDescription(cell),
    inLanguage: "ru",
    mainEntityOfPage: `${siteUrl}${lilaCellPath(cell)}`,
    image: `${siteUrl}${lilaCellImage(cell)}`,
  };
}
