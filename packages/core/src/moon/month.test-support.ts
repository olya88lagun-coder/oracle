import type { MoonMonth } from "./month";

// Простое текстовое представление месяца для сравнения со снимком: даты как ISO-строки, освещённость до 6 знаков
const iso = (date: Date | null): string => (date ? date.toISOString() : "");

export const BASELINE_MONTHS: readonly [number, number][] = Array.from({ length: 15 }, (_, index) => [2026 + Math.floor((9 + index) / 12), ((9 + index) % 12) + 1] as [number, number]);

export function plainMonth(month: MoonMonth): { days: string[]; events: string[]; signRuns: string[] } {
  return {
    days: month.days.map((day) => [day.date, iso(day.snapshot.at), day.snapshot.phase, day.snapshot.sign, day.snapshot.illumination.toFixed(6), day.snapshot.waxing ? 1 : 0, day.lunarDay.number, iso(day.lunarDay.changeAt), day.lunarDay.changeTo ?? "", iso(day.rise), iso(day.set)].join("|")),
    events: month.events.map((event) => `${event.kind}|${iso(event.at)}`),
    signRuns: month.signRuns.map((run) => `${run.sign}|${iso(run.from)}|${iso(run.to)}`),
  };
}
