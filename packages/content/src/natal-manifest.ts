import type { BodyId } from "@oracle/core/natal";
import type { SignId } from "@oracle/core/natal";

// Манифест страниц значений натальной карты: «планета в знаке» (10 × 12) и «асцендент в знаке» (12) — 132 страницы.
// Тексты лежат в packages/content/natal/NNN-slug.md; здесь — только список страниц, названия и слаги.

export type NatalPageKind = "planet" | "ascendant";
export type NatalBody = BodyId | "ascendant";
export type NatalPageRef = { slug: string; kind: NatalPageKind; body: NatalBody; sign: SignId; batch: number };

export const SIGN_IDS: readonly SignId[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

// nominative — «Овен», prepositional — «Овне» (после «в»/«во»), slugPart — кусок адреса без предлога
export const SIGN_NAMES: Record<SignId, { nominative: string; prepositional: string; slugPart: string; preposition: "в" | "во" }> = {
  aries: { nominative: "Овен", prepositional: "Овне", slugPart: "ovne", preposition: "в" },
  taurus: { nominative: "Телец", prepositional: "Тельце", slugPart: "teltse", preposition: "в" },
  gemini: { nominative: "Близнецы", prepositional: "Близнецах", slugPart: "bliznetsah", preposition: "в" },
  cancer: { nominative: "Рак", prepositional: "Раке", slugPart: "rake", preposition: "в" },
  leo: { nominative: "Лев", prepositional: "Льве", slugPart: "lve", preposition: "во" },
  virgo: { nominative: "Дева", prepositional: "Деве", slugPart: "deve", preposition: "в" },
  libra: { nominative: "Весы", prepositional: "Весах", slugPart: "vesah", preposition: "в" },
  scorpio: { nominative: "Скорпион", prepositional: "Скорпионе", slugPart: "skorpione", preposition: "в" },
  sagittarius: { nominative: "Стрелец", prepositional: "Стрельце", slugPart: "streltse", preposition: "в" },
  capricorn: { nominative: "Козерог", prepositional: "Козероге", slugPart: "kozeroge", preposition: "в" },
  aquarius: { nominative: "Водолей", prepositional: "Водолее", slugPart: "vodolee", preposition: "в" },
  pisces: { nominative: "Рыбы", prepositional: "Рыбах", slugPart: "rybah", preposition: "в" },
};

export const BODY_NAMES: Record<NatalBody, { name: string; slugPart: string; batch: number }> = {
  sun: { name: "Солнце", slugPart: "solntse", batch: 1 },
  moon: { name: "Луна", slugPart: "luna", batch: 1 },
  ascendant: { name: "Асцендент", slugPart: "ascendent", batch: 1 },
  mercury: { name: "Меркурий", slugPart: "merkuriy", batch: 2 },
  venus: { name: "Венера", slugPart: "venera", batch: 2 },
  mars: { name: "Марс", slugPart: "mars", batch: 2 },
  jupiter: { name: "Юпитер", slugPart: "yupiter", batch: 3 },
  saturn: { name: "Сатурн", slugPart: "saturn", batch: 3 },
  uranus: { name: "Уран", slugPart: "uran", batch: 4 },
  neptune: { name: "Нептун", slugPart: "neptun", batch: 4 },
  pluto: { name: "Плутон", slugPart: "pluton", batch: 4 },
};

// Порядок страниц в манифесте и номеров файлов: по партиям, внутри партии — по телам, затем по знакам
const BODY_ORDER: readonly NatalBody[] = ["sun", "moon", "ascendant", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

export function natalPageSlug(body: NatalBody, sign: SignId): string {
  const signName = SIGN_NAMES[sign];
  return `${BODY_NAMES[body].slugPart}-${signName.preposition === "во" ? "vo" : "v"}-${signName.slugPart}`;
}

// «Солнце в Овне», «Марс во Льве»
export function natalPageName(body: NatalBody, sign: SignId): string {
  const signName = SIGN_NAMES[sign];
  return `${BODY_NAMES[body].name} ${signName.preposition} ${signName.prepositional}`;
}

export const NATAL_PAGES: readonly NatalPageRef[] = BODY_ORDER.flatMap((body) =>
  SIGN_IDS.map((sign) => ({ slug: natalPageSlug(body, sign), kind: (body === "ascendant" ? "ascendant" : "planet") as NatalPageKind, body, sign, batch: BODY_NAMES[body].batch })),
);

// Номер файла и порядок: 1…132 в порядке манифеста
export function natalPageOrder(slug: string): number {
  return NATAL_PAGES.findIndex((page) => page.slug === slug) + 1;
}

export function natalPageBySlug(slug: string): NatalPageRef | undefined {
  return NATAL_PAGES.find((page) => page.slug === slug);
}

export function natalPageFile(slug: string): string {
  return `${String(natalPageOrder(slug)).padStart(3, "0")}-${slug}.md`;
}

// Партии, которые владелица приняла: пока партия не принята, её страницы закрыты. Меняется отдельным PR после вычитки
export const ACCEPTED_BATCHES: ReadonlySet<number> = new Set<number>();
