import { ARCANA, type Arcanum } from "@oracle/content";
import { shortDescription } from "./short-description";

export const MATRIX_PATH = "/matrica-sudby";
const PARAM = /^arkan-([1-9]|1\d|2[0-2])-([a-z]+(?:-[a-z]+)*)$/;

type ArcanumRef = { number: number; slug: string };

export const arcanumParam = (a: ArcanumRef): string => `arkan-${a.number}-${a.slug}`;
export const arcanumPath = (a: ArcanumRef): string => `${MATRIX_PATH}/${arcanumParam(a)}`;

// Иллюстрации лежат в public/arcana: 960 px для страницы аркана и превью ссылок, 480 px для карточек результата,
// 160 px для ряда «Все 22 аркана»
export const ARCANUM_IMAGE_SIZE = 960;
const IMAGE_SUFFIX = { page: "", card: "-480", thumb: "-160" } as const;
export const arcanumImage = (a: ArcanumRef, size: keyof typeof IMAGE_SUFFIX = "page"): string =>
  `/arcana/${String(a.number).padStart(2, "0")}-${a.slug}${IMAGE_SUFFIX[size]}.webp`;

// Номер и slug должны совпасть с одним и тем же арканом — иначе 404, а не страница с чужим текстом
export function arcanumFromParam(param: string): Arcanum | null {
  const match = PARAM.exec(param);
  if (!match) return null;
  const arcanum = ARCANA.find((item) => item.number === Number(match[1]));
  return arcanum && arcanum.slug === match[2] ? arcanum : null;
}

export { shortDescription };

export function arcanumJsonLd(a: Arcanum, siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Аркан ${a.number} «${a.name}» в матрице судьбы`,
    description: shortDescription(a.essence[0] ?? a.name),
    inLanguage: "ru",
    keywords: a.keywords.join(", "),
    mainEntityOfPage: `${siteUrl}${arcanumPath(a)}`,
    image: `${siteUrl}${arcanumImage(a)}`,
  };
}
