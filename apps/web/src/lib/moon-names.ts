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
