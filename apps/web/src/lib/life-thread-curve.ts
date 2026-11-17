import type { ThreadYear } from "@oracle/core";

// Высота точки — символический уровень этапа цикла, а не номер года: 8 («урожай») выше всех, 2 («терпение») тише всех.
// Шкалу принимает владелица вместе с текстами (спека 2026-11-18-life-thread-design.md).
export const THREAD_LEVELS: Readonly<Record<number, number>> = { 1: 0.42, 2: 0.08, 3: 0.5, 4: 0.22, 5: 0.62, 6: 0.4, 7: 0.18, 8: 1, 9: 0.66 };

export const YEAR_NAMES: Readonly<Record<number, string>> = { 1: "старт", 2: "терпение", 3: "самовыражение", 4: "фундамент", 5: "перемены", 6: "забота", 7: "осмысление", 8: "урожай", 9: "завершение" };

const next = (value: number): number => (value % 9) + 1;
const prev = (value: number): number => (value === 1 ? 9 : value - 1);

// Двойное сглаживание (a + 2b + c) / 4 и нормировка на 0…1. За краем списка соседи берутся из цикла: год 9 сменяется годом 1
export function curveLevels(values: readonly number[]): number[] {
  const first = values[0];
  const last = values.at(-1);
  if (first === undefined || last === undefined) return [];
  const extended = [prev(prev(first)), prev(first), ...values, next(last), next(next(last))];
  const level = extended.map((value) => THREAD_LEVELS[value] ?? 0);
  const once = level.map((_, i) => (i === 0 || i === level.length - 1 ? 0 : ((level[i - 1] ?? 0) + 2 * (level[i] ?? 0) + (level[i + 1] ?? 0)) / 4));
  const twice = values.map((_, j) => ((once[j + 1] ?? 0) + 2 * (once[j + 2] ?? 0) + (once[j + 3] ?? 0)) / 4);
  const low = Math.min(...twice);
  const span = Math.max(...twice) - low;
  return twice.map((value) => (span === 0 ? 0.5 : (value - low) / span));
}

// «Окно»: девять лет назад и вперёд от текущего года, подрезанное по краям списка; «всё» — вся жизнь
export function threadWindow(years: readonly ThreadYear[], currentYear: number, mode: "window" | "all"): readonly ThreadYear[] {
  return mode === "all" ? years : years.filter((item) => item.year >= currentYear - 9 && item.year <= currentYear + 9);
}

type Point = { readonly x: number; readonly y: number };

// Путь SVG по Catmull-Rom: c1 = p1 + (p2 − p0) / 6, c2 = p2 − (p3 − p1) / 6, края дублируются
export function smoothPath(points: readonly Point[]): string {
  const first = points[0];
  if (!first) return "";
  const f = (n: number): string => n.toFixed(1);
  let path = `M${f(first.x)},${f(first.y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)] ?? first;
    const p1 = points[i] ?? first;
    const p2 = points[i + 1] ?? p1;
    const p3 = points[Math.min(points.length - 1, i + 2)] ?? p2;
    path += ` C${f(p1.x + (p2.x - p0.x) / 6)},${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)},${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)},${f(p2.y)}`;
  }
  return path;
}
