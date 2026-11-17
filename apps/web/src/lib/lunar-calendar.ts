import { daysInMonth, moonMonth, type MoonEvent, type SignRun } from "@oracle/core/moon";
import type { PhaseId } from "@oracle/core/moon/visual";
import type { SignId } from "@oracle/core/natal";
import { lunarMonthPath, moscowDate } from "./lunar-calendar-paths";
import { PHASE_NAMES } from "./moon-today";

export const MONTH_NAMES: readonly string[] = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

export const SIGN_NAMES: Record<SignId, string> = {
  aries: "Овен", taurus: "Телец", gemini: "Близнецы", cancer: "Рак", leo: "Лев", virgo: "Дева",
  libra: "Весы", scorpio: "Скорпион", sagittarius: "Стрелец", capricorn: "Козерог", aquarius: "Водолей", pisces: "Рыбы",
};

const EVENT_NAMES: Record<MoonEvent["kind"], string> = { new: "Новолуние", firstQuarter: "Первая четверть", full: "Полнолуние", lastQuarter: "Последняя четверть" };
// Освещённость в момент события: так отметки стоят на кривой точно, а не по ближайшему дню
const EVENT_ILLUMINATION: Record<MoonEvent["kind"], number> = { new: 0, firstQuarter: 0.5, full: 1, lastQuarter: 0.5 };

const MOSCOW = "Europe/Moscow";
const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ru-RU", { timeZone: MOSCOW, ...options });
const clockFormat = format({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dayMonthFormat = format({ day: "numeric", month: "long" });
const shortFormat = format({ day: "numeric", month: "short" });
const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
const clock = (date: Date): string => clockFormat.format(date);
const shortLabel = (date: Date): string => `${shortFormat.format(date).replace(/\.$/, "")}, ${clock(date)}`;

type YearMonth = { year: number; month: number };
const index = ({ year, month }: YearMonth): number => year * 12 + month - 1;
const fromIndex = (value: number): YearMonth => ({ year: Math.floor(value / 12), month: (value % 12) + 1 });

// Текущий месяц по Москве
function currentMonth(now: Date): YearMonth {
  const [year, month] = moscowDate(now).split("-").map(Number) as [number, number];
  return { year, month };
}

// Предыдущий, текущий и 13 следующих месяцев по Москве
export function monthWindow(now: Date): YearMonth[] {
  const current = index(currentMonth(now));
  return Array.from({ length: 15 }, (_, offset) => fromIndex(current - 1 + offset));
}

export const isInWindow = (year: number, month: number, now: Date): boolean => monthWindow(now).some((item) => item.year === year && item.month === month);

// Кривая освещённости по дням: одна точка в середине суточного слота, 0 внизу и 1 вверху. area замкнута по нижнему краю
export function lightCurve(days: readonly { date: string; illumination: number }[], width: number, height: number): { line: string; area: string; points: { date: string; x: number; y: number }[] } {
  const slot = width / days.length;
  const round = (value: number) => Math.round(value * 100) / 100;
  const points = days.map((day, position) => ({ date: day.date, x: round((position + 0.5) * slot), y: round((1 - day.illumination) * height) }));
  const line = points.map((point, position) => `${position === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return { line, area: `${line} L ${last.x} ${height} L ${first.x} ${height} Z`, points };
}

export type RibbonSegment = { sign: SignId; signName: string; from: number; to: number; label: string };

// Промежутки знаков в долях месяца: полоса «Луна по знакам» делится пропорционально времени
export function ribbonSegments(signRuns: readonly SignRun[], monthStart: Date, monthEnd: Date): RibbonSegment[] {
  const length = monthEnd.getTime() - monthStart.getTime();
  const share = (date: Date) => (date.getTime() - monthStart.getTime()) / length;
  return signRuns.map((run) => ({ sign: run.sign, signName: SIGN_NAMES[run.sign], from: share(run.from), to: share(run.to), label: `${shortLabel(run.from)} — ${shortLabel(run.to)}` }));
}

export type CalendarDay = {
  date: string;
  day: number;
  label: string;
  phase: PhaseId;
  phaseName: string;
  illumination: number;
  waxing: boolean;
  lunarNumber: number;
  lunarChange: string | null;
  signName: string;
  riseSet: string;
};
export type CalendarEvent = { kind: MoonEvent["kind"]; name: string; label: string; date: string; dayIndex: number };
export type DayRow = { date: string; label: string; phaseName: string; percent: number; lunar: string; signName: string; riseSet: string };

export type MonthPage = {
  year: number;
  month: number;
  title: string;
  cells: CalendarDay[];
  weeks: (number | null)[][];
  events: CalendarEvent[];
  signRuns: { signName: string; label: string }[];
  ribbon: RibbonSegment[];
  curve: { line: string; area: string; points: { date: string; x: number; y: number }[]; events: { kind: MoonEvent["kind"]; x: number; y: number }[] };
  rows: DayRow[];
  prev: { label: string; href: string } | null;
  next: { label: string; href: string } | null;
  months: { label: string; href: string; current: boolean }[];
  faq: { question: string; answer: string }[];
};

export const CURVE_WIDTH = 720;
export const CURVE_HEIGHT = 160;

const monthLabel = ({ year, month }: YearMonth): string => `${capital(MONTH_NAMES[month - 1]!)} ${year}`;

// Данные страницы месяца: сетка по неделям с понедельника, события, смены знаков, кривая света, лента знаков и строки таблицы
export function buildMonthPage(year: number, month: number, now: Date): MonthPage {
  const data = moonMonth(year, month);
  const count = daysInMonth(year, month);
  const start = new Date(Date.UTC(year, month - 1, 1) - 3 * 3_600_000);
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1) - 3 * 3_600_000);

  const cells = data.days.map((day): CalendarDay => {
    const change = day.lunarDay.changeAt && day.lunarDay.changeTo ? `${day.lunarDay.changeTo}-е сутки с ${clock(day.lunarDay.changeAt)}` : null;
    return {
      date: day.date,
      day: day.day,
      label: dayMonthFormat.format(new Date(day.snapshot.at)),
      phase: day.snapshot.phase,
      phaseName: PHASE_NAMES[day.snapshot.phase],
      illumination: day.snapshot.illumination,
      waxing: day.snapshot.waxing,
      lunarNumber: day.lunarDay.number,
      lunarChange: change,
      signName: SIGN_NAMES[day.snapshot.sign],
      riseSet: `${day.rise ? clock(day.rise) : "—"} / ${day.set ? clock(day.set) : "—"}`,
    };
  });

  const offset = data.days[0]!.weekday;
  const slots: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: count }, (_, position) => position)];
  while (slots.length % 7 !== 0) slots.push(null);
  const weeks = Array.from({ length: slots.length / 7 }, (_, row) => slots.slice(row * 7, row * 7 + 7));

  const events = data.events.map((event): CalendarEvent => {
    const date = moscowDate(event.at);
    return { kind: event.kind, name: EVENT_NAMES[event.kind], label: `${dayMonthFormat.format(event.at)}, ${clock(event.at)}`, date, dayIndex: Number(date.slice(8)) - 1 };
  });

  const curve = lightCurve(cells.map((cell) => ({ date: cell.date, illumination: cell.illumination })), CURVE_WIDTH, CURVE_HEIGHT);
  const span = end.getTime() - start.getTime();
  const markers = data.events.map((event) => ({ kind: event.kind, x: Math.round(((event.at.getTime() - start.getTime()) / span) * CURVE_WIDTH * 100) / 100, y: (1 - EVENT_ILLUMINATION[event.kind]) * CURVE_HEIGHT }));

  const rows = cells.map((cell, position): DayRow => {
    const day = data.days[position]!;
    const lunar = day.lunarDay.changeAt && day.lunarDay.changeTo ? `${cell.lunarNumber}-е, с ${clock(day.lunarDay.changeAt)} — ${day.lunarDay.changeTo}-е` : `${cell.lunarNumber}-е`;
    return { date: cell.date, label: cell.label, phaseName: cell.phaseName, percent: Math.round(cell.illumination * 100), lunar, signName: cell.signName, riseSet: cell.riseSet };
  });

  const window = monthWindow(now);
  const here = index({ year, month });
  const neighbour = (value: number) => (window.some((item) => index(item) === value) ? { label: monthLabel(fromIndex(value)), href: lunarMonthPath(fromIndex(value).year, fromIndex(value).month) } : null);

  return {
    year,
    month,
    title: `Лунный календарь на ${MONTH_NAMES[month - 1]} ${year}`,
    cells,
    weeks,
    events,
    signRuns: data.signRuns.map((run) => ({ signName: SIGN_NAMES[run.sign], label: `${shortLabel(run.from)} — ${shortLabel(run.to)}` })),
    ribbon: ribbonSegments(data.signRuns, start, end),
    curve: { ...curve, events: markers },
    rows,
    prev: neighbour(here - 1),
    next: neighbour(here + 1),
    months: window.map((item) => ({ label: monthLabel(item), href: lunarMonthPath(item.year, item.month), current: index(item) === here })),
    // Вопросы с датами месяца появятся вместе с принятыми текстами (Task 4)
    faq: [],
  };
}
