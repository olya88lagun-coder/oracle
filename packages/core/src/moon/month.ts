import * as Astronomy from "astronomy-engine";
import type { SignId } from "../natal/zodiac";
import { lunarDayFromRises, MOSCOW, moonRises, moonSets } from "./day";
import { moonSnapshot, nextMoonEvent, previousNewMoon, type MoonEvent, type MoonSnapshot } from "./phase";
import { moonSignChanges } from "./signs";

const DAY_MS = 86_400_000;
const OFFSET_MS = MOSCOW.utcOffsetMinutes * 60_000;

export type MoonMonthDay = {
  date: string;
  day: number;
  weekday: number;
  snapshot: MoonSnapshot;
  lunarDay: { number: number; changeAt: Date | null; changeTo: number | null };
  rise: Date | null;
  set: Date | null;
};
export type SignRun = { sign: SignId; from: Date; to: Date };
export type MoonMonth = { year: number; month: number; days: MoonMonthDay[]; events: MoonEvent[]; signRuns: SignRun[] };

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Начало месяца по Москве: 00:00 UTC+3 первого числа
const monthStart = (year: number, month: number): Date => new Date(Date.UTC(year, month - 1, 1) - OFFSET_MS);
const pad = (value: number): string => String(value).padStart(2, "0");

// Все новолуния с последнего перед `from` до `to`: от них отсчитываются лунные сутки
function newMoons(from: Date, to: Date): Date[] {
  const found = [previousNewMoon(from)];
  for (;;) {
    const next = Astronomy.SearchMoonPhase(0, new Date(found[found.length - 1]!.getTime() + DAY_MS), 31)!.date;
    if (next.getTime() > to.getTime()) return found;
    found.push(next);
  }
}

// Месяц по Москве: на полдень каждого дня фаза, знак и номер лунных суток; восход и заход; смены лунных суток внутри дня;
// четыре главные фазы месяца и промежутки знаков Луны. Восходы и новолуния считаем один раз на весь месяц
export function moonMonth(year: number, month: number): MoonMonth {
  const start = monthStart(year, month);
  const end = monthStart(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1);
  const moons = newMoons(start, end);
  const windowDays = (end.getTime() - moons[0]!.getTime()) / DAY_MS + 2;
  const rises = moonRises(moons[0]!, windowDays);
  const sets = moonSets(moons[0]!, windowDays);
  const lunarAt = (at: Date) => {
    const newMoon = [...moons].reverse().find((moon) => moon.getTime() <= at.getTime()) ?? moons[0]!;
    return lunarDayFromRises(at, newMoon, rises);
  };
  const within = (dates: readonly Date[], from: number, to: number) => dates.find((date) => date.getTime() >= from && date.getTime() < to) ?? null;

  const days = Array.from({ length: daysInMonth(year, month) }, (_, index): MoonMonthDay => {
    const dayStart = start.getTime() + index * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    const noon = new Date(dayStart + DAY_MS / 2);
    const first = lunarAt(new Date(dayStart)).number;
    // Смена суток внутри дня: восход или новолуние. Если за день их две (29→30 и новолуние 30→1), берём итоговую: после неё сутки остаются до конца дня
    const steps = [...rises, ...moons]
      .filter((moment) => moment.getTime() > dayStart && moment.getTime() < dayEnd)
      .sort((a, b) => a.getTime() - b.getTime())
      .map((moment) => ({ at: moment, number: lunarAt(moment).number }));
    const lastNumber = steps.length ? steps[steps.length - 1]!.number : first;
    let change: (typeof steps)[number] | undefined;
    if (lastNumber !== first) {
      let index = steps.length - 1;
      while (index > 0 && steps[index - 1]!.number === lastNumber) index--;
      change = steps[index];
    }
    return {
      date: `${year}-${pad(month)}-${pad(index + 1)}`,
      day: index + 1,
      weekday: (new Date(Date.UTC(year, month - 1, index + 1)).getUTCDay() + 6) % 7,
      snapshot: moonSnapshot(noon),
      lunarDay: { number: lunarAt(noon).number, changeAt: change?.at ?? null, changeTo: change?.number ?? null },
      rise: within(rises, dayStart, dayEnd),
      set: within(sets, dayStart, dayEnd),
    };
  });

  const events: MoonEvent[] = [];
  for (let event = nextMoonEvent(new Date(start.getTime() - 1)); event.at.getTime() < end.getTime(); event = nextMoonEvent(event.at)) events.push(event);

  const signRuns: SignRun[] = [];
  let from = start;
  let sign = moonSnapshot(start).sign;
  for (const change of moonSignChanges(start, end)) {
    signRuns.push({ sign, from, to: change.at });
    from = change.at;
    sign = change.sign;
  }
  signRuns.push({ sign, from, to: end });

  return { year, month, days, events, signRuns };
}
