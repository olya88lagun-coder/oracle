import type { PhaseId } from "@oracle/core/moon/visual";

// Гравюры фаз Луны: apps/web/public/luna/phases/<фаза>.webp (960 px — шапка и превью ссылок), <фаза>-480.webp (карточка), <фаза>-160.webp (мелкий ряд).
// Убывающие фазы — зеркальные копии растущих; картинки полнолуния пока нет, и для неё показывается карточка без рисунка.
export const PHASE_IMAGE_PHASES: readonly PhaseId[] = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "waningGibbous", "lastQuarter", "waningCrescent"];

export type PhaseImageSize = 960 | 480 | 160;

export const phaseImage = (phase: PhaseId, size: PhaseImageSize = 960): string | null =>
  PHASE_IMAGE_PHASES.includes(phase) ? `/luna/phases/${phase}${size === 960 ? "" : `-${size}`}.webp` : null;
