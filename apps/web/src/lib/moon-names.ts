import type { SignId } from "@oracle/core/natal";
import type { PhaseId } from "@oracle/core/moon/visual";

// Названия фаз и знаков Луны: данные без расчётов, их можно импортировать в клиентские компоненты (moon-today.ts тянет движок)
export const PHASE_NAMES: Record<PhaseId, string> = {
  new: "Новолуние",
  waxingCrescent: "Растущий серп",
  firstQuarter: "Первая четверть",
  waxingGibbous: "Растущая Луна",
  full: "Полнолуние",
  waningGibbous: "Убывающая Луна",
  lastQuarter: "Последняя четверть",
  waningCrescent: "Убывающий серп",
};

// Названия фаз — по восьми промежуткам круга, поэтому «Полнолуние» стоит и на сутках рядом с ним. Событие (точный момент главной фазы)
// приходится на одни сутки: их и называем по событию, а соседние со стороны главной фазы — «Около полнолуния»
export type MainPhaseKind = "new" | "firstQuarter" | "full" | "lastQuarter";
const EVENT_KIND_NAMES: Record<MainPhaseKind, string> = { new: "Новолуние", firstQuarter: "Первая четверть", full: "Полнолуние", lastQuarter: "Последняя четверть" };
const NEAR_NAMES: Partial<Record<PhaseId, string>> = { new: "Около новолуния", firstQuarter: "Около первой четверти", full: "Около полнолуния", lastQuarter: "Около последней четверти" };

// event — главная фаза, чей момент приходится на эти сутки (или null); phase — промежуток на полдень
export const dayPhaseName = (phase: PhaseId, event: MainPhaseKind | null): string => (event ? EVENT_KIND_NAMES[event] : NEAR_NAMES[phase] ?? PHASE_NAMES[phase]);

export const SIGN_NAMES_LOCATIVE: Record<SignId, string> = {
  aries: "в Овне",
  taurus: "в Тельце",
  gemini: "в Близнецах",
  cancer: "в Раке",
  leo: "во Льве",
  virgo: "в Деве",
  libra: "в Весах",
  scorpio: "в Скорпионе",
  sagittarius: "в Стрельце",
  capricorn: "в Козероге",
  aquarius: "в Водолее",
  pisces: "в Рыбах",
};
