import { CLOCK_TIMES, FATE_NUMBERS } from "@oracle/core";

// Манифест страниц нумерологии: 12 чисел судьбы, 9 значений личного года 2027, 37 одинаковых времён на часах.
// Тексты лежат в packages/content/numerology/<kind>-<key>.md; здесь — список страниц и партии на приёмку.

export type NumerologyKind = "fate" | "year" | "clock";
export type NumerologyPageRef = { readonly kind: NumerologyKind; readonly key: string; readonly batch: number };

const CLOCK_BATCH_SIZE = 15;

export const NUMEROLOGY_PAGES: readonly NumerologyPageRef[] = [
  ...FATE_NUMBERS.map((n) => ({ kind: "fate" as const, key: String(n), batch: 1 })),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ kind: "year" as const, key: String(n), batch: 2 })),
  ...CLOCK_TIMES.map((time, i) => ({ kind: "clock" as const, key: time.slug, batch: 3 + Math.floor(i / CLOCK_BATCH_SIZE) })),
];

// Партии, которые владелица приняла: пока партия не принята, её страницы закрыты (404, нет в карте сайта, нет ссылок).
// Номер добавляется отдельным коммитом после вычитки.
export const NUMEROLOGY_ACCEPTED_BATCHES: ReadonlySet<number> = new Set<number>([
  1, // числа судьбы — приняты 08.11.2026
  2, // личный год 2027 — приняты 08.11.2026
]);

export const numerologyFile = (page: Pick<NumerologyPageRef, "kind" | "key">): string => `${page.kind}-${page.key}.md`;
