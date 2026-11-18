import { ARCANA_COUNT, calculateMatrix } from "@oracle/core";

export type ExampleStep = { point: "A" | "B" | "C" | "D" | "E"; label: string; formula: string; arcanum: number };
export type ArcanumExample = { day: number; month: number; year: number; dateLabel: string; steps: ExampleStep[] };

const digits = (n: number): number[] => [...String(n)].map(Number);
const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

// «14 + 9 + 8 = 31 → 3 + 1 = 4»: слагаемые, сумма и, пока больше 22, сложение цифр
export function sumChain(parts: readonly number[]): string {
  let total = sum(parts);
  let text = `${parts.join(" + ")} = ${total}`;
  while (total > ARCANA_COUNT) {
    const next = digits(total);
    total = sum(next);
    text += ` → ${next.join(" + ")} = ${total}`;
  }
  return text;
}

// Учебный пример для аркана N: вымышленная дата, в которой N стоит в личности (день рождения N), и расчёт остальных ключевых точек по шагам.
// Месяц и год подбираются по номеру аркана, поэтому у разных арканов разные примеры.
export function arcanumExample(number: number): ArcanumExample {
  const day = number;
  const month = ((number * 5) % 12) + 1;
  const year = 1960 + ((number * 11) % 50);
  const matrix = calculateMatrix({ day, month, year });
  const yearDigits = digits(year);
  const step = (point: ExampleStep["point"], label: string, formula: string): ExampleStep => ({ point, label, formula, arcanum: matrix[point] });
  return {
    day,
    month,
    year,
    dateLabel: `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`,
    steps: [
      step("A", "Личность (точка A): день рождения", `${day}`),
      step("B", "Точка B: месяц рождения", `${month}`),
      step("C", "Точка C: цифры года", sumChain(yearDigits)),
      step("D", "Задача (точка D): A + B + C", sumChain([matrix.A, matrix.B, matrix.C])),
      step("E", "Центр (точка E): A + B + C + D", sumChain([matrix.A, matrix.B, matrix.C, matrix.D])),
    ],
  };
}

