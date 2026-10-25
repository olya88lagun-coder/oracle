import { parseBirthDate } from "./birth-date";
import { calculateMatrix, reduceToArcanum } from "./matrix";

export const ARCANA_YEAR = 2027;
export type YearArcana = { readonly year: 2027; readonly center: number; readonly annual: number; readonly arcanum: number };

// Approved 25.10.2026: R(E + R(raw day + month + digit sum of 2027)).
// This is a calendar-year practice, not the Matrix age perimeter or a forecast.
export function calculateYearArcana(iso: string, today: Date): YearArcana | null {
  const date = parseBirthDate(iso, today);
  if (!date) return null;
  const center = calculateMatrix(date).E;
  const annual = reduceToArcanum(date.day + date.month + 11);
  return { year: ARCANA_YEAR, center, annual, arcanum: reduceToArcanum(center + annual) };
}
