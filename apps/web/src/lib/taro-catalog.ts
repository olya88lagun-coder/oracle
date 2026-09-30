import type { TarotSuit } from "@oracle/content/tarot";

export type CatalogCard = { slug: string; name: string; suit: TarotSuit; rankLabel: string; keywords: readonly string[]; image: string; path: string };
export type CatalogFilter = "all" | TarotSuit;

export const SUIT_ORDER: readonly TarotSuit[] = ["major", "wands", "cups", "swords", "pentacles"];
export const FILTER_ORDER: readonly CatalogFilter[] = ["all", ...SUIT_ORDER];

export const FILTER_LABELS: Readonly<Record<CatalogFilter, { full: string; short: string }>> = {
  all: { full: "Все", short: "Все" },
  major: { full: "Старшие арканы", short: "Старшие" },
  wands: { full: "Жезлы", short: "Жезлы" },
  cups: { full: "Кубки", short: "Кубки" },
  swords: { full: "Мечи", short: "Мечи" },
  pentacles: { full: "Пентакли", short: "Пентакли" },
};

export const FILTER_CAPTIONS: Readonly<Record<CatalogFilter, string>> = {
  all: "Вся колода: старшие арканы и четыре масти.",
  major: "Большие жизненные темы и внутренние перемены.",
  wands: "Импульс, движение и энергия действия.",
  cups: "Чувства, близость и эмоциональный опыт.",
  swords: "Мысли, решения и ясность взгляда.",
  pentacles: "Повседневные дела, ресурсы и устойчивость.",
};

const ROMANS = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const COURTS = ["Паж", "Рыцарь", "Королева", "Король"];

// Подпись над названием: римский номер у старших арканов, «Туз», число или придворная карта у младших
export function rankLabel(suit: TarotSuit, rank: number): string {
  if (suit === "major") return ROMANS[rank] ?? String(rank);
  if (rank === 1) return "Туз";
  if (rank <= 10) return String(rank);
  return COURTS[rank - 11] ?? String(rank);
}

// Регистр и ё/е не важны
export const normalizeQuery = (value: string): string => value.normalize("NFKC").toLowerCase().replaceAll("ё", "е").trim();

export function matchesQuery(card: Pick<CatalogCard, "name" | "keywords">, query: string): boolean {
  const words = normalizeQuery(query).split(/\s+/).filter(Boolean);
  const haystack = normalizeQuery(`${card.name} ${card.keywords.join(" ")}`);
  return words.every((word) => haystack.includes(word));
}

export function countLabel(count: number): string {
  const last = count % 10;
  const tens = count % 100;
  const word = tens >= 11 && tens <= 14 ? "карт" : last === 1 ? "карта" : last >= 2 && last <= 4 ? "карты" : "карт";
  return `${count} ${word}`;
}

export const isFilter = (value: string | null): value is CatalogFilter => FILTER_ORDER.includes(value as CatalogFilter);
