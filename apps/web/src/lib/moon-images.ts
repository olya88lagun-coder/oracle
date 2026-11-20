import type { PhaseId } from "@oracle/core/moon/visual";
import type { SignId } from "@oracle/core/natal";

export type MoonImageSize = 960 | 480 | 160;
// Прежнее имя для картинок фаз
export type PhaseImageSize = MoonImageSize;

// Гравюры восьми фаз Луны: apps/web/public/luna/phases/<фаза>.webp (960 px — шапка и превью ссылок), <фаза>-480.webp (карточка), <фаза>-160.webp (мелкий ряд).
// Если у новой фазы или другого набора картинок нет, уберите её из списка: тогда путь станет null и карточка покажется без рисунка.
export const PHASE_IMAGE_PHASES: readonly PhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"];

const suffix = (size: MoonImageSize): string => (size === 960 ? "" : `-${size}`);

export const phaseImage = (phase: PhaseId, size: MoonImageSize = 960): string | null => (PHASE_IMAGE_PHASES.includes(phase) ? `/luna/phases/${phase}${suffix(size)}.webp` : null);

// Гравюры двенадцати знаков зодиака на Луне: apps/web/public/luna/signs/<знак>.webp, <знак>-480.webp, <знак>-160.webp. У каждой в круге сверху значок знака.
// Лев, Рак и Дева при подготовке слегка выровнены по цвету с остальными (насыщенность и оттенок)
export const SIGN_IMAGE_SIGNS: readonly SignId[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

export const signImage = (sign: SignId, size: MoonImageSize = 960): string | null => (SIGN_IMAGE_SIGNS.includes(sign) ? `/luna/signs/${sign}${suffix(size)}.webp` : null);
