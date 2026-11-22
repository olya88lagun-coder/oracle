import { moonSnapshot, moscowDayStart, type PhaseId } from "@oracle/core/moon";
import { moscowDate } from "./lunar-calendar-paths";
import { lastDays } from "./moon-visit";

// «Нить Луны»: последние сутки по Москве, каждые — настоящей фазой этого дня. Собирается на сервере, в браузер уходят готовые даты
export type ThreadDay = { date: string; phase: PhaseId };
export type ThreadBead = ThreadDay & { lit: boolean; isToday: boolean; label: string };

const DAY_MS = 86_400_000;

// Москва без летнего времени: сутки по 24 часа, полдень — через 12 часов от начала (как в `strip` в `lib/moon-today.ts`)
export function buildThreadDays(now: Date, count = 14): ThreadDay[] {
  const dayStart = moscowDayStart(now).getTime();
  return lastDays(moscowDate(now), count).map((date, index) => ({
    date,
    phase: moonSnapshot(new Date(dayStart + (index - (count - 1)) * DAY_MS + DAY_MS / 2)).phase,
  }));
}

// Дни с заходом светятся; подпись — число месяца, у сегодняшнего «сег»
export function threadBeads(days: readonly ThreadDay[], visits: readonly string[], today: string): ThreadBead[] {
  const visited = new Set(visits);
  return days.map((day) => ({
    ...day,
    lit: visited.has(day.date),
    isToday: day.date === today,
    label: day.date === today ? "сег" : String(Number(day.date.slice(8))),
  }));
}
