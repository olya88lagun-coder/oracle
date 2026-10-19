import type { NatalPageRef } from "@oracle/content/natal";

// Адрес практики «Натальная карта» и адреса её страниц значений («Солнце в Овне» и др.)
export const NATAL_PATH = "/natalnaya-karta";

export const natalPagePath = (page: Pick<NatalPageRef, "slug">): string => `${NATAL_PATH}/${page.slug}`;
