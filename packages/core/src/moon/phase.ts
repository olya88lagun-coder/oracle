import * as Astronomy from "astronomy-engine";
import { eclipticLongitude } from "../natal/bodies";
import { signOf, type SignId } from "../natal/zodiac";

export const PHASES = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"] as const;
export type PhaseId = (typeof PHASES)[number];

// Восемь секторов по 45° с центром на каждой фазе: новолуние — [337,5°; 22,5°)
export function phaseOf(angle: number): PhaseId {
  const normalized = ((angle % 360) + 360) % 360;
  return PHASES[Math.floor(((normalized + 22.5) % 360) / 45)]!;
}

export type MoonSnapshot = { at: Date; angle: number; illumination: number; waxing: boolean; phase: PhaseId; sign: SignId; signDegree: number };

// angle — угол Луна–Солнце: 0 новолуние, 90 первая четверть, 180 полнолуние, 270 последняя четверть
export function moonSnapshot(at: Date): MoonSnapshot {
  const angle = Astronomy.MoonPhase(at);
  const { sign, degree } = signOf(eclipticLongitude("moon", at));
  return { at, angle, illumination: Astronomy.Illumination(Astronomy.Body.Moon, at).phase_fraction, waxing: angle < 180, phase: phaseOf(angle), sign, signDegree: degree };
}

export type MoonEvent = { kind: "new" | "firstQuarter" | "full" | "lastQuarter"; at: Date };
const EVENT_KINDS = ["new", "firstQuarter", "full", "lastQuarter"] as const;

// Ближайшая четверть или новолуние/полнолуние строго после `from`
export function nextMoonEvent(from: Date): MoonEvent {
  let quarter = Astronomy.SearchMoonQuarter(from);
  while (quarter.time.date.getTime() <= from.getTime()) quarter = Astronomy.NextMoonQuarter(quarter);
  return { kind: EVENT_KINDS[quarter.quarter]!, at: quarter.time.date };
}

const DAY_MS = 86_400_000;

// Последнее новолуние не позже `at`: ищем вперёд от месяца назад и берём последнее найденное
export function previousNewMoon(at: Date): Date {
  let found = Astronomy.SearchMoonPhase(0, new Date(at.getTime() - 31 * DAY_MS), 32)!.date;
  for (;;) {
    const next = Astronomy.SearchMoonPhase(0, new Date(found.getTime() + DAY_MS), 31)!.date;
    if (next.getTime() > at.getTime()) return found;
    found = next;
  }
}
