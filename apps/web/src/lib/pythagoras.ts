import { SQUARE_LINE_TITLES } from "@oracle/content/numerology-format";
import { calculatePythagorasSquare, type PythagorasSquare, type SquareLineId } from "@oracle/core";
import { DATE_ERROR } from "./matrix-save";
import { NUMEROLOGY_PATH } from "./numerology";

// Квадрат Пифагора (docs/superpowers/specs/2026-11-08-pythagoras-square-design.md)
export const PYTHAGORAS_PATH = `${NUMEROLOGY_PATH}/kvadrat-pifagora`;
export const squareCellPath = (cell: number): string => `${PYTHAGORAS_PATH}/${cell}`;
export const SQUARE_LINES_PATH = `${PYTHAGORAS_PATH}/linii`;
export const PYTHAGORAS_COMPAT_PATH = `${PYTHAGORAS_PATH}/sovmestimost`;

// Названия на сайте; в традиции 4 — «здоровье», 8 — «долг»: о здоровье и долге не пишем
export const SQUARE_CELL_NAMES: Readonly<Record<number, string>> = {
  1: "Характер и воля",
  2: "Энергия",
  3: "Интерес к знаниям",
  4: "Выносливость",
  5: "Логика и интуиция",
  6: "Труд и мастерство",
  7: "Удача и талант",
  8: "Ответственность",
  9: "Память и ум",
};
export const SQUARE_LINE_NAMES: Readonly<Record<SquareLineId, string>> = SQUARE_LINE_TITLES;

// Раздел страницы ячейки для числа цифр: пусто, 1–4, пять и больше — последний вариант
export function squareVariant(cell: number, count: number): { title: string; anchor: string } {
  if (count === 0) return { title: "Пустая ячейка", anchor: "pusto" };
  const digits = String(cell).repeat(Math.min(count, 5));
  return { title: count >= 5 ? `${digits} и больше` : digits, anchor: digits };
}

export type SquareOutcome = { ok: true; iso: string; square: PythagorasSquare } | { ok: false; error: string };

export function squareOutcome(iso: string, today: Date): SquareOutcome {
  const square = calculatePythagorasSquare(iso, today);
  return square ? { ok: true, iso, square } : { ok: false, error: DATE_ERROR };
}

export const SQUARE_FAQ = [
  { question: "Как рассчитать квадрат Пифагора по дате рождения?", answer: "Выпишите цифры даты и посчитайте четыре рабочих числа: сумму всех цифр, сумму цифр этой суммы, первое число минус удвоенную первую ненулевую цифру дня и сумму цифр результата. Все цифры, кроме нулей, разложите по девяти ячейкам. Например, 14.05.1987: 1 + 4 + 0 + 5 + 1 + 9 + 8 + 7 = 35, затем 3 + 5 = 8, 35 − 2 × 1 = 33 и 3 + 3 = 6. В квадрат идут цифры 14051987 и 35, 8, 33, 6." },
  { question: "Почему у других калькуляторов другой квадрат?", answer: "Методики расходятся. Некоторые сайты для рождённых после 2000 года прибавляют к расчёту 19, другие раскладывают квадрат по строкам, а не по столбцам, и поэтому иначе называют линии. Мы считаем всех по одной формуле Александрова и раскладываем цифры классически: первый столбец — 1, 2, 3." },
  { question: "Что значит пустая ячейка?", answer: "Это значит, что цифры этой ячейки нет ни в дате, ни в рабочих числах. В символическом прочтении это не недостаток, а качество, которое проявляется иначе или которое можно развивать сознательно. Описание пустой ячейки есть на странице каждой цифры." },
  { question: "Что такое линии квадрата?", answer: "Линии — три строки, три столбца и две диагонали квадрата. Количество цифр в трёх ячейках линии читают как выраженность темы: целеустремлённости, семьи, самооценки, темперамента и других." },
  { question: "Почему ячейка 4 называется «Выносливость», а не «здоровье»?", answer: "В традиции её называют ячейкой здоровья. Квадрат Пифагора — символическая практика, он не может ничего сказать о здоровье и не заменяет врача. Мы читаем ячейку 4 как образ запаса сил и ритма нагрузки и отдыха." },
  { question: "Это предсказание или тест личности?", answer: "Ни то ни другое. Квадрат Пифагора — символическая практика для самопознания, научного подтверждения у неё нет. Его можно читать как повод задуматься о своих сильных сторонах, а не как оценку или прогноз." },
] as const;
