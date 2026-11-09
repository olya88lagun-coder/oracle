import { CLOCK_TIMES, FATE_NUMBERS } from "@oracle/core";

// Манифест страниц нумерологии: 12 чисел судьбы, 9 значений личного года 2027, 37 одинаковых времён на часах.
// Тексты лежат в packages/content/numerology/<kind>-<key>.md; здесь — список страниц и партии на приёмку.

export type NumerologyKind = "fate" | "year" | "clock" | "square" | "pair";
export type NumerologyPageRef = { readonly kind: NumerologyKind; readonly key: string; readonly batch: number };

const CLOCK_BATCH_SIZE = 15;

export const NUMEROLOGY_PAGES: readonly NumerologyPageRef[] = [
  ...FATE_NUMBERS.map((n) => ({ kind: "fate" as const, key: String(n), batch: 1 })),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ kind: "year" as const, key: String(n), batch: 2 })),
  ...CLOCK_TIMES.map((time, i) => ({ kind: "clock" as const, key: time.slug, batch: 3 + Math.floor(i / CLOCK_BATCH_SIZE) })),
  // Квадрат Пифагора: ячейки 1–5 — партия 6, ячейки 6–9 и линии — партия 7
  ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "linii"].map((key, i) => ({ kind: "square" as const, key, batch: i < 5 ? 6 : 7 })),
  // Совместимость по квадрату Пифагора — партия 8 (спека 2026-11-09-pythagoras-compat-design.md)
  { kind: "pair", key: "sovmestimost", batch: 8 },
];

// Партии, которые владелица приняла: пока партия не принята, её страницы закрыты (404, нет в карте сайта, нет ссылок).
// Номер добавляется отдельным коммитом после вычитки.
export const NUMEROLOGY_ACCEPTED_BATCHES: ReadonlySet<number> = new Set<number>([
  1, // числа судьбы — приняты 08.11.2026
  2, // личный год 2027 — приняты 08.11.2026
  3, // время на часах 00:00–09:09 — приняты 08.11.2026
  4, // время на часах 10:01–19:19 — приняты 08.11.2026
  5, // время на часах 20:02–23:32 — приняты 08.11.2026
  6, // квадрат Пифагора, ячейки 1–5 — приняты 08.11.2026
  7, // квадрат Пифагора, ячейки 6–9 и линии — приняты 08.11.2026
  8, // совместимость по квадрату Пифагора — приняты 09.11.2026
]);

export const numerologyFile = (page: Pick<NumerologyPageRef, "kind" | "key">): string => `${page.kind}-${page.key}.md`;
