export type BirthDate = { readonly year: number; readonly month: number; readonly day: number };

export const MIN_BIRTH_YEAR = 1900;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;
const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

// Формат `<input type="date">`. Завтрашняя по UTC дата допустима: восточнее UTC она уже наступила
export function parseBirthDate(value: unknown, today: Date): BirthDate | null {
  if (typeof value !== "string") return null;
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  const isCalendarDate = probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
  if (!isCalendarDate || year < MIN_BIRTH_YEAR) return null;
  const latest = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) + DAY_MS;
  if (probe.getTime() > latest) return null;
  return { year, month, day };
}

export function toIsoDate(date: BirthDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

export function formatBirthDateRu(date: BirthDate): string {
  return `${date.day} ${MONTHS_GENITIVE[date.month - 1]} ${date.year}`;
}
