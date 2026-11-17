"use client";

import { useEffect } from "react";

const MOSCOW_OFFSET_MS = 3 * 3_600_000;

// Без разметки. Страница собрана заранее, поэтому момент «сейчас» узнаём в браузере: выставляем на корень `.moon-month` долю месяца
// в переменной --today (0…1) и data-has-today. В другом месяце ничего не ставим: отметки «сейчас» на кривой и ленте нет
export function MoonTodayMark({ year, month }: { year: number; month: number }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".moon-month");
    if (!root) return;
    const start = Date.UTC(year, month - 1, 1) - MOSCOW_OFFSET_MS;
    const end = Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1) - MOSCOW_OFFSET_MS;
    const share = (Date.now() - start) / (end - start);
    if (share < 0 || share >= 1) return;
    root.style.setProperty("--today", share.toFixed(4));
    root.dataset.hasToday = "true";
    return () => {
      root.style.removeProperty("--today");
      delete root.dataset.hasToday;
    };
  }, [year, month]);
  return null;
}
