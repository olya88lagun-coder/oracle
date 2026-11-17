import { calculateMatrix, formatBirthDateRu, parseBirthDate, type Matrix } from "@oracle/core";

// Вымышленная дата для диаграммы на первом экране до ввода настоящей
export const HERO_EXAMPLE_DATE = "1988-09-14";
export const ROLL_MS = 650;

export type HeroState = { kind: "example" | "date"; iso: string; caption: string; matrix: Matrix };

function exampleHero(today: Date): HeroState {
  const birth = parseBirthDate(HERO_EXAMPLE_DATE, today)!;
  return { kind: "example", iso: HERO_EXAMPLE_DATE, caption: "Пример · вымышленная дата", matrix: calculateMatrix(birth) };
}

// Пустая или невозможная дата оставляет прежнее состояние: диаграмма не мигает пустыми узлами
export function nextHero(value: string, today: Date, previous: HeroState | null): HeroState {
  const birth = parseBirthDate(value, today);
  if (!birth) return previous ?? exampleHero(today);
  return { kind: "date", iso: value, caption: `Ваша матрица · ${formatBirthDateRu(birth)}`, matrix: calculateMatrix(birth) };
}

// «Прокрутка» арканов 1…22: полный круг и добор до нового значения, замедляется к концу; при progress = 1 ровно `to`
export function rollValue(from: number, to: number, progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  const spin = 22 + ((to - from + 22) % 22);
  const eased = 1 - (1 - p) ** 3;
  return ((from - 1 + Math.floor(eased * spin + 1e-9)) % 22) + 1;
}

// Волна: узлы стартуют по очереди, не дольше 336 мс от первого
export function rollDelay(index: number): number {
  return Math.min(index * 12, 336);
}
