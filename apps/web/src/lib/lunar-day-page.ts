import { lunarDayText, phaseText, type LunarDayText, type PhaseText } from "@oracle/content/moon";
import { KEY_POINT_ASTRONOMY, MOON_EXTRA_TEXTS_ACCEPTED } from "@oracle/content/moon-year";
import { MOSCOW, moonMonth, type MoonEvent, type MoonMonth } from "@oracle/core/moon";
import type { PhaseId } from "@oracle/core/moon/visual";
import type { SignId } from "@oracle/core/natal";
import { dayOrdinal } from "./day-ordinal";
import { EVENT_NAMES, labelsFor, MONTH_NAMES, SIGN_NAMES } from "./lunar-calendar";
import { isInWindow, lunarDayPathOfDate, lunarMonthPath, monthFromIndex, monthIndex } from "./lunar-calendar-paths";
import { phaseImage } from "./moon-images";
import { dayPhaseName } from "./moon-names";
import { SIGN_NAMES_LOCATIVE } from "./moon-today";

// Страница одной даты лунного календаря: все числа берутся из расчёта месяца (по Москве), здесь они собраны для показа и текстов
export type DayEvent = { at: number; time: string; kind: "phase" | "sign" | "lunar"; text: string; note: string | null };
export type DayNeighbour = { href: string; label: string; longLabel: string; percent: number; phase: PhaseId; phaseName: string; image: string | null; current: boolean };

export type DatePage = {
  year: number;
  month: number;
  day: number;
  date: string;
  dateLabel: string;
  weekday: string;
  phase: PhaseId;
  phaseName: string;
  illumination: number;
  waxing: boolean;
  sign: SignId;
  signName: string;
  signLine: string;
  signDegree: number;
  lunarNumber: number;
  lunarLine: string;
  lunarSymbol: string | null;
  lunarChange: { time: string; to: number } | null;
  rise: string | null;
  set: string | null;
  events: DayEvent[];
  mainEvent: { kind: MoonEvent["kind"]; name: string; time: string } | null;
  signChange: { time: string; signName: string; signLine: string } | null;
  neighbours: DayNeighbour[];
  prev: { href: string; label: string } | null;
  next: { href: string; label: string } | null;
  monthHref: string;
  monthLabel: string;
  texts: { phase: PhaseText | undefined; day: LunarDayText | undefined };
};

const labels = labelsFor(MOSCOW.zone);
const WEEKDAYS: readonly string[] = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];

// Расчёт месяца запоминается: им пользуются все дни месяца и соседние страницы. Окно маленькое, но карта всё равно ограничена
const memo = new Map<string, MoonMonth>();
function monthOf(year: number, month: number): MoonMonth {
  const key = `${year}-${month}`;
  let data = memo.get(key);
  if (!data) {
    if (memo.size > 20) memo.clear();
    data = moonMonth(year, month);
    memo.set(key, data);
  }
  return data;
}

// Дни месяца и двух соседних, если те входят в окно страниц: из них набираются ряд соседей и ссылки «вчера» и «завтра»
function surroundingDays(year: number, month: number, now: Date) {
  const around = [-1, 0, 1].map((shift) => monthFromIndex(monthIndex({ year, month }) + shift)).filter((item) => (item.year === year && item.month === month) || isInWindow(item.year, item.month, now));
  const months = around.map((item) => monthOf(item.year, item.month));
  return { days: months.flatMap((item) => item.days), kindByDate: new Map(months.flatMap((item) => item.events).map((event) => [labels.dateOf(event.at), event.kind] as const)) };
}

const dayLabel = (date: Date): string => labels.dayMonth(date);

export function buildDatePage(year: number, month: number, day: number, now: Date): DatePage {
  const data = monthOf(year, month);
  const entry = data.days[day - 1]!;
  const { snapshot } = entry;

  const phaseEvents = data.events.filter((event) => labels.dateOf(event.at) === entry.date).map((event): DayEvent => ({ at: event.at.getTime(), time: labels.clock(event.at), kind: "phase", text: EVENT_NAMES[event.kind], note: MOON_EXTRA_TEXTS_ACCEPTED ? KEY_POINT_ASTRONOMY[event.kind] : null }));
  const signRuns = data.signRuns.slice(1).filter((run) => labels.dateOf(run.from) === entry.date);
  const signEvents = signRuns.map((run): DayEvent => ({ at: run.from.getTime(), time: labels.clock(run.from), kind: "sign", text: `Луна входит в знак ${SIGN_NAMES[run.sign]}`, note: null }));
  const lunarEvents: DayEvent[] = entry.lunarDay.changeAt && entry.lunarDay.changeTo ? [{ at: entry.lunarDay.changeAt.getTime(), time: labels.clock(entry.lunarDay.changeAt), kind: "lunar", text: `Начинаются ${dayOrdinal(entry.lunarDay.changeTo)} лунные сутки`, note: null }] : [];
  const events = [...phaseEvents, ...signEvents, ...lunarEvents].sort((a, b) => a.at - b.at);

  const first = data.events.find((event) => labels.dateOf(event.at) === entry.date);
  const run = signRuns[0];

  const { days: all, kindByDate } = surroundingDays(year, month, now);
  const index = all.findIndex((item) => item.date === entry.date);
  const link = (item: (typeof all)[number]) => ({ href: lunarDayPathOfDate(item.date), label: dayLabel(new Date(item.snapshot.at)) });
  const neighbours = all.slice(Math.max(0, index - 3), index + 4).map((item): DayNeighbour => ({ href: lunarDayPathOfDate(item.date), label: `${item.date.slice(8)}.${item.date.slice(5, 7)}`, longLabel: dayLabel(new Date(item.snapshot.at)), percent: Math.round(item.snapshot.illumination * 100), phase: item.snapshot.phase, phaseName: dayPhaseName(item.snapshot.phase, kindByDate.get(item.date) ?? null), image: phaseImage(item.snapshot.phase, 160), current: item.date === entry.date }));

  const lunarText = lunarDayText(entry.lunarDay.number);
  return {
    year,
    month,
    day,
    date: entry.date,
    dateLabel: `${dayLabel(new Date(snapshot.at))} ${year}`,
    weekday: WEEKDAYS[entry.weekday]!,
    phase: snapshot.phase,
    phaseName: dayPhaseName(snapshot.phase, first?.kind ?? null),
    illumination: snapshot.illumination,
    waxing: snapshot.waxing,
    sign: snapshot.sign,
    signName: SIGN_NAMES[snapshot.sign],
    signLine: `Луна ${SIGN_NAMES_LOCATIVE[snapshot.sign]}`,
    signDegree: Math.floor(snapshot.signDegree),
    lunarNumber: entry.lunarDay.number,
    lunarLine: `${dayOrdinal(entry.lunarDay.number)} лунные сутки`,
    lunarSymbol: lunarText?.symbol ?? null,
    lunarChange: entry.lunarDay.changeAt && entry.lunarDay.changeTo ? { time: labels.clock(entry.lunarDay.changeAt), to: entry.lunarDay.changeTo } : null,
    rise: entry.rise ? labels.clock(entry.rise) : null,
    set: entry.set ? labels.clock(entry.set) : null,
    events,
    mainEvent: first ? { kind: first.kind, name: EVENT_NAMES[first.kind], time: labels.clock(first.at) } : null,
    signChange: run ? { time: labels.clock(run.from), signName: SIGN_NAMES[run.sign], signLine: `Луна ${SIGN_NAMES_LOCATIVE[run.sign]}` } : null,
    neighbours,
    prev: index > 0 ? link(all[index - 1]!) : null,
    next: index < all.length - 1 ? link(all[index + 1]!) : null,
    monthHref: lunarMonthPath(year, month),
    monthLabel: `${MONTH_NAMES[month - 1]![0]!.toUpperCase()}${MONTH_NAMES[month - 1]!.slice(1)} ${year}`,
    texts: { phase: phaseText(snapshot.phase), day: lunarText },
  };
}
