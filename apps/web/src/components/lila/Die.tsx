"use client";

import { useEffect, useState } from "react";

// Точки на гранях в сетке 3×3: номера ячеек слева направо, сверху вниз
const PIPS: Record<number, readonly number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
const SHUFFLE_MS = 90;

type Props = { value: number | null; rolling: boolean };

// Кубик только для глаз: результат озвучивает строка статуса рядом, поэтому сам он скрыт от скринридеров
export function Die({ value, rolling }: Props) {
  const [shown, setShown] = useState<number | null>(value);
  useEffect(() => {
    if (!rolling) return setShown(value);
    const timer = setInterval(() => setShown(1 + Math.floor(Math.random() * 6)), SHUFFLE_MS);
    return () => clearInterval(timer);
  }, [rolling, value]);
  const pips = shown ? PIPS[shown] ?? [] : [];
  return (
    <div className="die" data-rolling={rolling || undefined} data-settled={!rolling && value !== null ? value : undefined} aria-hidden="true">
      {Array.from({ length: 9 }, (_, cell) => (
        <span key={cell} className="die__pip" data-on={pips.includes(cell) || undefined} />
      ))}
    </div>
  );
}
