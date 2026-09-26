import { ARCANA, type Arcanum } from "@oracle/content";

export const MATRIX_PATH = "/matrica-sudby";
const PARAM = /^arkan-([1-9]|1\d|2[0-2])-([a-z]+(?:-[a-z]+)*)$/;
const DESCRIPTION_LIMIT = 160;

type ArcanumRef = { number: number; slug: string };

export const arcanumParam = (a: ArcanumRef): string => `arkan-${a.number}-${a.slug}`;
export const arcanumPath = (a: ArcanumRef): string => `${MATRIX_PATH}/${arcanumParam(a)}`;

// Номер и slug должны совпасть с одним и тем же арканом — иначе 404, а не страница с чужим текстом
export function arcanumFromParam(param: string): Arcanum | null {
  const match = PARAM.exec(param);
  if (!match) return null;
  const arcanum = ARCANA.find((item) => item.number === Number(match[1]));
  return arcanum && arcanum.slug === match[2] ? arcanum : null;
}

export function shortDescription(text: string): string {
  if (text.length <= DESCRIPTION_LIMIT) return text;
  const cut = text.slice(0, DESCRIPTION_LIMIT - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function arcanumJsonLd(a: Arcanum, siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Аркан ${a.number} «${a.name}» в матрице судьбы`,
    description: shortDescription(a.essence[0] ?? a.name),
    inLanguage: "ru",
    keywords: a.keywords.join(", "),
    mainEntityOfPage: `${siteUrl}${arcanumPath(a)}`,
  };
}
