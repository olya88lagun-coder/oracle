import { MONTH_FAQ_TEMPLATES, MOON_CALENDAR_TEXTS_ACCEPTED, type MonthFacts, type PhaseKind } from "@oracle/content/moon-calendar";
import { DAILY_GUIDE, KEY_POINT_ASTRONOMY, KEY_POINTS_NOTE, KEY_POINTS_TITLE, keyPointQuestion, MONTH_FAQ_EXTRA, MOON_EXTRA_TEXTS_ACCEPTED, monthSummary, SIGN_SYMBOLS } from "@oracle/content/moon-year";
import { daysInMonth, moonMonth, moonSnapshot, type MoonEvent, type SignRun } from "@oracle/core/moon";
import type { PhaseId } from "@oracle/core/moon/visual";
import type { SignId } from "@oracle/core/natal";
import { isInWindow, lunarMonthPath, monthFromIndex, monthIndex, monthWindow, moscowDate, type YearMonth } from "./lunar-calendar-paths";
import { PHASE_NAMES, SIGN_NAMES_LOCATIVE } from "./moon-today";
import { TARO_SPREADS_PATH } from "./taro-paths";

export { isInWindow, monthWindow };

export const MONTH_NAMES: readonly string[] = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

export const SIGN_NAMES: Record<SignId, string> = {
  aries: "Овен", taurus: "Телец", gemini: "Близнецы", cancer: "Рак", leo: "Лев", virgo: "Дева",
  libra: "Весы", scorpio: "Скорпион", sagittarius: "Стрелец", capricorn: "Козерог", aquarius: "Водолей", pisces: "Рыбы",
};

export const EVENT_NAMES: Record<MoonEvent["kind"], string> = { new: "Новолуние", firstQuarter: "Первая четверть", full: "Полнолуние", lastQuarter: "Последняя четверть" };
// Расклады «Новолуние» и «Полнолуние» — календарный повод, а не влияние Луны; слаги совпадают со слагами в taro-spreads-extra.ts (тест это проверяет)
export const SPREAD_ACTIONS: Partial<Record<MoonEvent["kind"], { label: string; href: string }>> = {
  new: { label: "Расклад на новолуние", href: `${TARO_SPREADS_PATH}/novolunie` },
  full: { label: "Расклад на полнолуние", href: `${TARO_SPREADS_PATH}/polnolunie` },
};
// Освещённость в момент события: так отметки стоят на кривой точно, а не по ближайшему дню
const EVENT_ILLUMINATION: Record<MoonEvent["kind"], number> = { new: 0, firstQuarter: 0.5, full: 1, lastQuarter: 0.5 };

const MOSCOW = "Europe/Moscow";
const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ru-RU", { timeZone: MOSCOW, ...options });
const clockFormat = format({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dayMonthFormat = format({ day: "numeric", month: "long" });
const shortFormat = format({ day: "numeric", month: "short" });
const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
const clock = (date: Date): string => clockFormat.format(date);
// «9 ноября, 10:02» по Москве
export const momentLabel = (date: Date): string => `${dayMonthFormat.format(date)}, ${clock(date)}`;
const shortLabel = (date: Date): string => `${shortFormat.format(date).replace(/\.$/, "")}, ${clock(date)}`;

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
// Событие ленты «События месяца»: главная фаза или переход Луны в другой знак; at — миллисекунды, по ним лента упорядочена
export type TimelineItem = { kind: MoonEvent["kind"] | "sign"; title: string; label: string; date: string; at: number; action?: { label: string; href: string } };

// Ключевая точка месяца: фаза с точным временем, знак Луны на этот момент, астрономия, образ знака и вопрос к себе; ссылка на расклад — у новолуния и полнолуния
export type KeyPoint = { kind: MoonEvent["kind"]; title: string; label: string; date: string; signLocative: string; astronomy: string; symbol: string; question: string; action?: { label: string; href: string } };

export function keyPointsOf(events: readonly MoonEvent[], accepted: boolean = MOON_EXTRA_TEXTS_ACCEPTED): KeyPoint[] {
  if (!accepted) return [];
  return events.map((event) => {
    const { sign } = moonSnapshot(event.at);
    return {
      kind: event.kind,
      title: EVENT_NAMES[event.kind],
      label: momentLabel(event.at),
      date: moscowDate(event.at),
      signLocative: SIGN_NAMES_LOCATIVE[sign],
      astronomy: KEY_POINT_ASTRONOMY[event.kind],
      symbol: SIGN_SYMBOLS[sign],
      question: keyPointQuestion(event.kind, sign),
      action: SPREAD_ACTIONS[event.kind],
    };
  });
}

export const KEY_POINTS_COPY = { title: KEY_POINTS_TITLE, note: KEY_POINTS_NOTE };

export type CalendarEvent ={ kind: MoonEvent["kind"]; name: string; label: string; date: string; dayIndex: number };
export type DayRow = { date: string; label: string; phaseName: string; percent: number; lunar: string; signName: string; riseSet: string };

export type MonthPage = {
  year: number;
  month: number;
  title: string;
  cells: CalendarDay[];
  weeks: (number | null)[][];
  events: CalendarEvent[];
  timeline: TimelineItem[];
  signRuns: { signName: string; label: string }[];
  ribbon: RibbonSegment[];
  curve: { line: string; area: string; points: { date: string; x: number; y: number }[]; events: { kind: MoonEvent["kind"]; x: number; y: number }[] };
  rows: DayRow[];
  prev: { label: string; href: string } | null;
  next: { label: string; href: string } | null;
  months: { label: string; href: string; current: boolean }[];
  faq: { question: string; answer: string }[];
  summary: string | null;
  keyPoints: KeyPoint[];
  guide: { intro: string; items: readonly string[] } | null;
};

export const CURVE_WIDTH = 720;
export const CURVE_HEIGHT = 160;

const MONTH_LOCATIVE: readonly string[] = ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"];

function toCalendarEvents(events: readonly MoonEvent[]): CalendarEvent[] {
  return events.map((event) => {
    const date = moscowDate(event.at);
    return { kind: event.kind, name: EVENT_NAMES[event.kind], label: `${dayMonthFormat.format(event.at)}, ${clock(event.at)}`, date, dayIndex: Number(date.slice(8)) - 1 };
  });
}

// Вопросы с настоящими датами месяца; метки времени — по Москве
function faqFromEvents(year: number, month: number, events: readonly CalendarEvent[]): { question: string; answer: string }[] {
  const group = (kind: PhaseKind) => events.filter((event) => event.kind === kind).map((event) => event.label);
  const facts: MonthFacts = { month: MONTH_NAMES[month - 1]!, monthLocative: MONTH_LOCATIVE[month - 1]!, year, events: { new: group("new"), firstQuarter: group("firstQuarter"), full: group("full"), lastQuarter: group("lastQuarter") } };
  return MONTH_FAQ_TEMPLATES.map((template) => ({ question: template.question(facts.monthLocative, year), answer: template.answer(facts) }));
}

// Главные фазы и переходы в новый знак по порядку времени. Начало месяца (знак, в котором Луна уже стоит) в ленту не входит: это не событие месяца
export function monthTimeline(events: readonly MoonEvent[], signRuns: readonly SignRun[]): TimelineItem[] {
  const phases = events.map((event): TimelineItem => ({ kind: event.kind, title: EVENT_NAMES[event.kind], label: momentLabel(event.at), date: moscowDate(event.at), at: event.at.getTime(), action: SPREAD_ACTIONS[event.kind] }));
  const signs = signRuns.slice(1).map((run): TimelineItem => ({ kind: "sign", title: `Луна входит в знак: ${SIGN_NAMES[run.sign]}`, label: momentLabel(run.from), date: moscowDate(run.from), at: run.from.getTime() }));
  return [...phases, ...signs].sort((a, b) => a.at - b.at);
}

export const monthFaq = (year: number, month: number): { question: string; answer: string }[] => faqFromEvents(year, month, toCalendarEvents(moonMonth(year, month).events));

function summaryOf(year: number, month: number, events: readonly MoonEvent[], signChanges: number): string {
  const items = (kind: MoonEvent["kind"]) => events.filter((event) => event.kind === kind).map((event) => ({ label: momentLabel(event.at), signLocative: SIGN_NAMES_LOCATIVE[moonSnapshot(event.at).sign] }));
  return monthSummary({ monthLocative: MONTH_LOCATIVE[month - 1]!, year, new: items("new"), full: items("full"), signChanges });
}

const monthLabel = ({ year, month }: YearMonth): string => `${capital(MONTH_NAMES[month - 1]!)} ${year}`;

// Данные страницы месяца: сетка по неделям с понедельника, события, смены знаков, кривая света, лента знаков и строки таблицы
export function buildMonthPage(year: number, month: number, now: Date): MonthPage {
  const data = moonMonth(year, month);
  const count = daysInMonth(year, month);
  const start = new Date(Date.UTC(year, month - 1, 1) - 3 * 3_600_000);
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1) - 3 * 3_600_000);

  const cells = data.days.map((day): CalendarDay => {
    const change = day.lunarDay.changeAt && day.lunarDay.changeTo ? `с ${clock(day.lunarDay.changeAt)} — ${day.lunarDay.changeTo}-е` : null;
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

  const events = toCalendarEvents(data.events);

  const curve = lightCurve(cells.map((cell) => ({ date: cell.date, illumination: cell.illumination })), CURVE_WIDTH, CURVE_HEIGHT);
  const span = end.getTime() - start.getTime();
  const markers = data.events.map((event) => ({ kind: event.kind, x: Math.round(((event.at.getTime() - start.getTime()) / span) * CURVE_WIDTH * 100) / 100, y: (1 - EVENT_ILLUMINATION[event.kind]) * CURVE_HEIGHT }));

  const rows = cells.map((cell, position): DayRow => {
    const day = data.days[position]!;
    const lunar = day.lunarDay.changeAt && day.lunarDay.changeTo ? `${cell.lunarNumber}-е, с ${clock(day.lunarDay.changeAt)} — ${day.lunarDay.changeTo}-е` : `${cell.lunarNumber}-е`;
    return { date: cell.date, label: cell.label, phaseName: cell.phaseName, percent: Math.round(cell.illumination * 100), lunar, signName: cell.signName, riseSet: cell.riseSet };
  });

  const window = monthWindow(now);
  const here = monthIndex({ year, month });
  const neighbour = (value: number) => (window.some((item) => monthIndex(item) === value) ? { label: monthLabel(monthFromIndex(value)), href: lunarMonthPath(monthFromIndex(value).year, monthFromIndex(value).month) } : null);

  return {
    year,
    month,
    title: `Лунный календарь на ${MONTH_NAMES[month - 1]} ${year}`,
    cells,
    weeks,
    events,
    // Ссылки на расклады стоят в «Ключевых точках»; пока их нет, они остаются в «Событиях месяца», чтобы не повторяться на странице
    timeline: monthTimeline(data.events, data.signRuns).map((item) => (MOON_EXTRA_TEXTS_ACCEPTED ? { ...item, action: undefined } : item)),
    signRuns: data.signRuns.map((run) => ({ signName: SIGN_NAMES[run.sign], label: `${shortLabel(run.from)} — ${shortLabel(run.to)}` })),
    ribbon: ribbonSegments(data.signRuns, start, end),
    curve: { ...curve, events: markers },
    rows,
    prev: neighbour(here - 1),
    next: neighbour(here + 1),
    months: window.map((item) => ({ label: monthLabel(item), href: lunarMonthPath(item.year, item.month), current: monthIndex(item) === here })),
    // Вопросы показываются только после того, как владелица приняла тексты
    faq: [...(MOON_CALENDAR_TEXTS_ACCEPTED ? faqFromEvents(year, month, events) : []), ...(MOON_EXTRA_TEXTS_ACCEPTED ? MONTH_FAQ_EXTRA : [])],
    // Сводка, ключевые точки и пояснение к таблице — только после приёмки новых текстов
    summary: MOON_EXTRA_TEXTS_ACCEPTED ? summaryOf(year, month, data.events, data.signRuns.length - 1) : null,
    keyPoints: keyPointsOf(data.events),
    guide: MOON_EXTRA_TEXTS_ACCEPTED ? DAILY_GUIDE : null,
  };
}
