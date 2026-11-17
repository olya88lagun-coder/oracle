export const PHASES = ["new", "waxingCrescent", "firstQuarter", "waxingGibbous", "full", "waningGibbous", "lastQuarter", "waningCrescent"] as const;
export type PhaseId = (typeof PHASES)[number];
