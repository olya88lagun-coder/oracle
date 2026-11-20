import * as Astronomy from "astronomy-engine";
import type { SignId } from "../natal/zodiac";
import { MOSCOW } from "./day";
import { moonSnapshot } from "./phase";

export type YearMoonEvent = { kind: "new" | "full"; at: Date; sign: SignId; distanceKm: number };

// Порог «суперлуния» на сайте: единого астрономического определения нет, поэтому берём круглое число и называем его на странице
export const SUPERMOON_KM = 361_500;

const DAY_MS = 86_400_000;

// Новолуния и полнолуния календарного года по Москве (с 00:00 1 января до 00:00 1 января следующего года), по порядку времени
export function moonYearEvents(year: number): YearMoonEvent[] {
  const offset = MOSCOW.utcOffsetMinutes * 60_000;
  const start = new Date(Date.UTC(year, 0, 1) - offset);
  const end = new Date(Date.UTC(year + 1, 0, 1) - offset);
  const events: YearMoonEvent[] = [];
  for (const [kind, angle] of [["new", 0], ["full", 180]] as const) {
    for (let found = Astronomy.SearchMoonPhase(angle, start, 40); found && found.date < end; found = Astronomy.SearchMoonPhase(angle, new Date(found.date.getTime() + 20 * DAY_MS), 40)) {
      const at = found.date;
      events.push({ kind, at, sign: moonSnapshot(at).sign, distanceKm: Math.round(Astronomy.GeoVector(Astronomy.Body.Moon, at, true).Length() * Astronomy.KM_PER_AU) });
    }
  }
  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}
