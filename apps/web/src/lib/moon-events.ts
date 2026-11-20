import { LUNAR_DAY_TEXTS, lunarDayText } from "@oracle/content/moon";
import { DAY_PAGE_NOTE, DAYS_HUB_FAQ, DAYS_HUB_INTRO, eclipseFaq, eclipseIntro, MOON_EVENTS_TEXTS_ACCEPTED, retrogradeFaq, retrogradeIntro, type Faq } from "@oracle/content/moon-events";
import { eclipsesOfYear, moonMonth, phaseOf, retrogradePeriods, type EclipseKind, type EclipseVisibility, type RetrogradePlanet } from "@oracle/core/moon";
import { momentLabel, SIGN_NAMES } from "./lunar-calendar";
import { currentMonth, isInWindow, lunarMonthPath, monthFromIndex, monthIndex, moscowDate } from "./lunar-calendar-paths";
import { PHASE_NAMES, SIGN_NAMES_LOCATIVE } from "./moon-today";
import { dayPath, LUNAR_DAYS, yearMoonPath, yearWindow, type YearPageKind } from "./moon-year-paths";

const yearNav = (kind: YearPageKind, year: number, now: Date) => yearWindow(now).map((item) => ({ label: String(item), href: yearMoonPath(kind, item), current: item === year }));

// ——— Затмения ———
const KIND_NAMES: Record<EclipseKind, string> = {
  lunarTotal: "Полное лунное затмение",
  lunarPartial: "Частное лунное затмение",
  lunarPenumbral: "Полутеневое лунное затмение",
  solarTotal: "Полное солнечное затмение",
  solarAnnular: "Кольцеобразное солнечное затмение",
  solarPartial: "Частное солнечное затмение",
  solarHybrid: "Гибридное солнечное затмение",
};

const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1);

function visibilityLabel(visibility: EclipseVisibility, obscuration: number | null): string {
  if (visibility === "none") return "Не видно";
  if (visibility === "part") return "Видно частично";
  if (obscuration === null) return "Видно в максимум";
  return obscuration < 0.01 ? "Видно, закрыто менее 1 % диска Солнца" : `Видно, закрыто до ${Math.round(obscuration * 100)} % диска Солнца`;
}

export type EclipseRow = { date: string; label: string; kindName: string; signName: string; visibility: string };
export type EclipsePage = { year: number; title: string; description: string; rows: EclipseRow[]; intro: string | null; faq: Faq; years: { label: string; href: string; current: boolean }[] };

export function buildEclipsePage(year: number, now: Date): EclipsePage {
  const eclipses = eclipsesOfYear(year);
  const rows = eclipses.map((eclipse): EclipseRow => ({ date: moscowDate(eclipse.at), label: momentLabel(eclipse.at), kindName: KIND_NAMES[eclipse.kind], signName: SIGN_NAMES[eclipse.sign], visibility: visibilityLabel(eclipse.visibility, eclipse.obscuration) }));
  const named = (visibility: EclipseVisibility) => eclipses.filter((eclipse) => eclipse.visibility === visibility).map((eclipse) => `${momentLabel(eclipse.at)} — ${lowerFirst(KIND_NAMES[eclipse.kind])}`);
  return {
    year,
    title: `Затмения ${year}`,
    description: `Лунные и солнечные затмения ${year} года: тип, момент максимума по Москве, знак Луны и видимость из Москвы. Бесплатно.`,
    rows,
    intro: MOON_EVENTS_TEXTS_ACCEPTED ? eclipseIntro(year) : null,
    faq: MOON_EVENTS_TEXTS_ACCEPTED
      ? eclipseFaq({ year, all: eclipses.map((eclipse) => `${momentLabel(eclipse.at)} — ${lowerFirst(KIND_NAMES[eclipse.kind])}`), visible: named("full"), partial: named("part"), hasPenumbralVisible: eclipses.some((eclipse) => eclipse.kind === "lunarPenumbral" && eclipse.visibility !== "none") })
      : [],
    years: yearNav("eclipse", year, now),
  };
}

// ——— Ретроградные Меркурий и Венера ———
const PLANET_NAMES: Record<RetrogradePlanet, { nominative: string; genitive: string }> = { mercury: { nominative: "Меркурий", genitive: "Меркурия" }, venus: { nominative: "Венера", genitive: "Венеры" } };

export type RetroRow = { key: string; from: string; to: string; days: number; signs: string };
export type RetroPage = { planet: RetrogradePlanet; year: number; title: string; description: string; rows: RetroRow[]; intro: string | null; faq: Faq; years: { label: string; href: string; current: boolean }[] };

export function buildRetroPage(planet: RetrogradePlanet, year: number, now: Date): RetroPage {
  const names = PLANET_NAMES[planet];
  const periods = retrogradePeriods(planet, year);
  const rows = periods.map((period): RetroRow => ({
    key: period.from.toISOString(),
    from: momentLabel(period.from),
    to: momentLabel(period.to),
    days: Math.round((period.to.getTime() - period.from.getTime()) / 86_400_000),
    signs: period.signFrom === period.signTo ? SIGN_NAMES[period.signFrom] : `${SIGN_NAMES[period.signFrom]} → ${SIGN_NAMES[period.signTo]}`,
  }));
  const kind: YearPageKind = planet;
  return {
    planet,
    year,
    title: `Ретроградн${planet === "venus" ? "ая" : "ый"} ${names.nominative} ${year}`,
    description: `Периоды ретроградного движения ${names.genitive} в ${year} году: точное время начала и конца по Москве и знаки зодиака. Бесплатно.`,
    rows,
    intro: MOON_EVENTS_TEXTS_ACCEPTED ? retrogradeIntro(names, year) : null,
    faq: MOON_EVENTS_TEXTS_ACCEPTED
      ? retrogradeFaq({ planet, year, names, periods: periods.map((period) => `с ${momentLabel(period.from)} (${SIGN_NAMES_LOCATIVE[period.signFrom]}) до ${momentLabel(period.to)} (${SIGN_NAMES_LOCATIVE[period.signTo]})`) })
      : [],
    years: yearNav(kind, year, now),
  };
}

// ——— Лунные сутки ———
const CYCLE_DAYS = 29.53;
const dayMonthFormat = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "numeric", month: "long" });

export type DayPage = {
  day: number;
  symbol: string;
  text: string | null;
  question: string | null;
  phases: string;
  illumination: number;
  dates: { label: string; href: string | null }[];
  note: string | null;
  prev: { label: string; href: string } | null;
  next: { label: string; href: string } | null;
};

// «1-е», «2-е», «3-и», «4-е»…: у третьих и двадцать третьих суток окончание другое («третьи»)
export const dayOrdinal = (day: number): string => `${day}-${day % 10 === 3 && day !== 13 ? "и" : "е"}`;

const symbolOf = (day: number): string => LUNAR_DAY_TEXTS.find((entry) => entry.day === day)!.symbol;

// Средние сутки лунного цикла: угол Луна–Солнце растёт на 360 / 29,53 градуса в сутки. По нему видно, на какие фазы обычно приходятся эти сутки
function typicalPhases(day: number): { phases: string; illumination: number } {
  const step = 360 / CYCLE_DAYS;
  const names = [day - 1, day - 0.5, day].map((position) => PHASE_NAMES[phaseOf(position * step)]);
  const middle = (day - 0.5) * step * (Math.PI / 180);
  return { phases: [...new Set(names)].join(", "), illumination: Math.round(((1 - Math.cos(middle)) / 2) * 100) };
}

// Расчёт месяца дорогой, а 30 страниц суток считают одни и те же три месяца: держим результат в памяти процесса
const monthCache = new Map<string, ReturnType<typeof moonMonth>>();
function cachedMonth(year: number, month: number) {
  const key = `${year}-${month}`;
  if (!monthCache.has(key)) monthCache.set(key, moonMonth(year, month));
  return monthCache.get(key)!;
}

// Ближайшие даты по Москве (на полдень), когда в календаре стоят эти сутки: текущий месяц и три следующих (хватает на три прихода суток); подряд идущие даты сливаем в «11–12 ноября»
function nextDates(day: number, now: Date): DayPage["dates"] {
  const today = moscowDate(now);
  const start = monthIndex(currentMonth(now));
  const runs: { first: string; last: string; month: { year: number; month: number } }[] = [];
  for (const offset of [0, 1, 2, 3]) {
    const { year, month } = monthFromIndex(start + offset);
    for (const cell of cachedMonth(year, month).days) {
      if (cell.date < today || cell.lunarDay.number !== day) continue;
      const last = runs[runs.length - 1];
      const adjacent = last && Date.parse(`${cell.date}T00:00:00Z`) - Date.parse(`${last.last}T00:00:00Z`) === 86_400_000;
      if (adjacent) last.last = cell.date;
      else runs.push({ first: cell.date, last: cell.date, month: { year, month } });
    }
  }
  const label = (iso: string) => dayMonthFormat.format(new Date(`${iso}T12:00:00Z`));
  return runs.slice(0, 3).map((run) => ({
    label: run.first === run.last ? label(run.first) : `${Number(run.first.slice(8))}–${label(run.last)}`,
    href: isInWindow(run.month.year, run.month.month, now) ? lunarMonthPath(run.month.year, run.month.month) : null,
  }));
}

export function buildDayPage(day: number, now: Date): DayPage {
  const text = lunarDayText(day);
  const { phases, illumination } = typicalPhases(day);
  const neighbour = (value: number) => (value >= 1 && value <= LUNAR_DAYS ? { label: `${dayOrdinal(value)} сутки · ${symbolOf(value)}`, href: dayPath(value) } : null);
  return {
    day,
    symbol: symbolOf(day),
    text: text?.text ?? null,
    question: text?.question ?? null,
    phases,
    illumination,
    dates: nextDates(day, now),
    note: MOON_EVENTS_TEXTS_ACCEPTED ? DAY_PAGE_NOTE : null,
    prev: neighbour(day - 1),
    next: neighbour(day + 1),
  };
}

export type DaysHub = { intro: string | null; faq: Faq; items: { day: number; symbol: string; href: string }[] };

export function buildDaysHub(): DaysHub {
  return {
    intro: MOON_EVENTS_TEXTS_ACCEPTED ? DAYS_HUB_INTRO : null,
    faq: MOON_EVENTS_TEXTS_ACCEPTED ? [...DAYS_HUB_FAQ] : [],
    items: Array.from({ length: LUNAR_DAYS }, (_, index) => ({ day: index + 1, symbol: symbolOf(index + 1), href: dayPath(index + 1) })),
  };
}
