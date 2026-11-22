import type { MoonRibbonData } from "./moon-ribbon";

export const RIBBON_LABEL = "Лунный раздел";

// «Растущая Луна · 89 %»
export const ribbonPhaseLine = (data: MoonRibbonData): string => `${data.phaseName} · ${Math.round(data.illumination * 100)} %`;

// «Луна в Овне · 13-е сутки «Колесо»»
export const ribbonSignLine = (data: MoonRibbonData): string => `Луна ${data.signName} · ${data.lunarDay.number}-е сутки${data.lunarDay.symbol ? ` «${data.lunarDay.symbol}»` : ""}`;
