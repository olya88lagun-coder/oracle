import { lunarDayText } from "@oracle/content/moon";
import type { SignId } from "@oracle/core/natal";
import { moonSnapshot, moscowDayStart, nextMoonEvent, type MoonEvent, type PhaseId } from "@oracle/core/moon";
import { daysCount } from "./moon-album-copy";
import { moscowDate } from "./lunar-calendar-paths";
import { phaseImage } from "./moon-images";
import { buildMoonToday } from "./moon-today";

// Данные плитки «Луна сегодня» на главной: считаются на сервере на момент запроса по Москве
export type MoonTileData = {
  dateLabel: string; // «22 ноября»
  phase: PhaseId;
  phaseName: string;
  illumination: number; // 0..1
  sign: SignId;
  signName: string; // «в Овне»
  lunarDay: { number: number; symbol: string | null };
  until: { kind: MoonEvent["kind"]; days: number; label: string }; // «До полнолуния 2 дня»
  rise: string | null;
  week: { date: string; label: string; phase: PhaseId; isToday: boolean }[]; // вчера, сегодня и четыре следующих дня
  discImage: string | null;
};

const DAY_MS = 86_400_000;
const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });
const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "Europe/Moscow" });

export { daysCount };

// Родительный падеж для «До …»; «сегодня» — когда событие в эти же сутки по Москве
const BEFORE: Record<MoonEvent["kind"], string> = { new: "До новолуния", firstQuarter: "До первой четверти", full: "До полнолуния", lastQuarter: "До последней четверти" };
const TODAY: Record<MoonEvent["kind"], string> = { new: "Новолуние сегодня", firstQuarter: "Первая четверть сегодня", full: "Полнолуние сегодня", lastQuarter: "Последняя четверть сегодня" };

export function buildMoonTile(now: Date): MoonTileData {
  const today = buildMoonToday(now);
  const dayStart = moscowDayStart(now).getTime();
  const event = nextMoonEvent(now);
  const days = Math.round((moscowDayStart(event.at).getTime() - dayStart) / DAY_MS);
  return {
    dateLabel: dayMonth.format(now),
    phase: today.snapshot.phase,
    phaseName: today.phaseName,
    illumination: today.snapshot.illumination,
    sign: today.snapshot.sign,
    signName: today.signName,
    lunarDay: { number: today.lunarDay.number, symbol: lunarDayText(today.lunarDay.number)?.symbol ?? null },
    until: { kind: event.kind, days, label: days <= 0 ? TODAY[event.kind] : `${BEFORE[event.kind]} ${daysCount(days)}` },
    rise: today.rise,
    // Москва без летнего времени: сутки по 24 часа, полдень — через 12 часов от начала
    week: [-1, 0, 1, 2, 3, 4].map((offset) => {
      const noon = new Date(dayStart + offset * DAY_MS + DAY_MS / 2);
      return { date: moscowDate(noon), label: weekday.format(noon).replace(/\.$/, ""), phase: moonSnapshot(noon).phase, isToday: offset === 0 };
    }),
    discImage: phaseImage(today.snapshot.phase, 480),
  };
}
