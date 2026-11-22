import { lunarDayText } from "@oracle/content/moon";
import { lunarDay, type PhaseId } from "@oracle/core/moon";
import type { SignId } from "@oracle/core/natal";
import { phaseImage } from "./moon-images";
import { buildMoonToday } from "./moon-today";

// Данные ленты «Лунный раздел» на сегодня по Москве: отдаются маршрутом GET /api/moon/today и подставляются динамическими страницами
export type MoonRibbonData = {
  date: string;
  phase: PhaseId;
  phaseName: string;
  illumination: number; // 0..1
  waxing: boolean;
  sign: SignId;
  signName: string; // «в Овне»
  lunarDay: { number: number; symbol: string | null; progress: number }; // progress 0..1: сколько прошло от лунных суток
  discImage: string | null;
};

export function moonRibbonData(now: Date): MoonRibbonData {
  const today = buildMoonToday(now);
  const day = lunarDay(now);
  const span = day.endsAt.getTime() - day.startsAt.getTime();
  const progress = span > 0 ? Math.min(1, Math.max(0, (now.getTime() - day.startsAt.getTime()) / span)) : 0;
  return {
    date: today.strip[0]!.date,
    phase: today.snapshot.phase,
    phaseName: today.phaseName,
    illumination: today.snapshot.illumination,
    waxing: today.snapshot.waxing,
    sign: today.snapshot.sign,
    signName: today.signName,
    lunarDay: { number: day.number, symbol: lunarDayText(day.number)?.symbol ?? null, progress },
    discImage: phaseImage(today.snapshot.phase, 160),
  };
}
