import type { YearKind } from "@oracle/content/moon-year";
import { currentMonth } from "./lunar-calendar-paths";

// Адреса страниц событий года, «Фаз Луны» и лунных суток; безопасно для браузера: без расчётов Луны
export const PHASES_SLUG = "fazy-luny";
export const PHASES_PATH = `/luna/${PHASES_SLUG}`;

// Страницы вида «<вид>-<год>»: новолуния, полнолуния, затмения, ретроградные Меркурий и Венера
export type YearPageKind = YearKind | "eclipse" | "mercury" | "venus";
export const YEAR_PAGE_KINDS: readonly YearPageKind[] = ["new", "full", "eclipse", "mercury", "venus"];
const KIND_SLUG: Record<YearPageKind, string> = { new: "novoluniya", full: "polnoluniya", eclipse: "zatmeniya", mercury: "retrograd-merkuriya", venus: "retrograd-venery" };

export const yearMoonSlug = (kind: YearPageKind, year: number): string => `${KIND_SLUG[kind]}-${year}`;
export const yearMoonPath = (kind: YearPageKind, year: number): string => `/luna/${yearMoonSlug(kind, year)}`;

// Только точный слаг вида «novoluniya-2027»: регистр, пробелы и неполный год дают null
export function parseYearSlug(slug: string): { kind: YearPageKind; year: number } | null {
  const match = /^([a-z-]+)-(\d{4})$/.exec(slug);
  const kind = match ? YEAR_PAGE_KINDS.find((item) => KIND_SLUG[item] === match[1]) : undefined;
  return match && kind ? { kind, year: Number(match[2]) } : null;
}

// Предыдущий, текущий и следующий год по Москве: на столько лет есть страницы событий, вне окна — 404
export function yearWindow(now: Date): number[] {
  const year = currentMonth(now).year;
  return [year - 1, year, year + 1];
}

// Лунные сутки: каталог /luna/sutki и 30 страниц /luna/sutki/<номер>
export const DAYS_PATH = "/luna/sutki";
export const LUNAR_DAYS = 30;
export const dayPath = (day: number): string => `${DAYS_PATH}/${day}`;

// Только «1»…«30» без нулей и пробелов
export function parseDay(value: string): number | null {
  const day = /^[1-9]\d?$/.test(value) ? Number(value) : 0;
  return day >= 1 && day <= LUNAR_DAYS ? day : null;
}

export const moonYearPaths = (now: Date): string[] => [
  PHASES_PATH,
  DAYS_PATH,
  ...Array.from({ length: LUNAR_DAYS }, (_, index) => dayPath(index + 1)),
  ...yearWindow(now).flatMap((year) => YEAR_PAGE_KINDS.map((kind) => yearMoonPath(kind, year))),
];
