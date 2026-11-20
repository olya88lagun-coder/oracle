import type { YearKind } from "@oracle/content/moon-year";
import { currentMonth } from "./lunar-calendar-paths";

// Адреса страниц событий года и «Фаз Луны»; безопасно для браузера: без расчётов Луны
export const PHASES_SLUG = "fazy-luny";
export const PHASES_PATH = `/luna/${PHASES_SLUG}`;

const KIND_SLUG: Record<YearKind, string> = { new: "novoluniya", full: "polnoluniya" };

export const yearMoonSlug = (kind: YearKind, year: number): string => `${KIND_SLUG[kind]}-${year}`;
export const yearMoonPath = (kind: YearKind, year: number): string => `/luna/${yearMoonSlug(kind, year)}`;

// Только точный слаг вида «novoluniya-2027»: регистр, пробелы и неполный год дают null
export function parseYearSlug(slug: string): { kind: YearKind; year: number } | null {
  const match = /^(novoluniya|polnoluniya)-(\d{4})$/.exec(slug);
  return match ? { kind: match[1] === "novoluniya" ? "new" : "full", year: Number(match[2]) } : null;
}

// Предыдущий, текущий и следующий год по Москве: на столько лет есть страницы событий, вне окна — 404
export function yearWindow(now: Date): number[] {
  const year = currentMonth(now).year;
  return [year - 1, year, year + 1];
}

export const moonYearPaths = (now: Date): string[] => [PHASES_PATH, ...yearWindow(now).flatMap((year) => [yearMoonPath("new", year), yearMoonPath("full", year)])];
