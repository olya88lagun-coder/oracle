"use client";

import { useEffect } from "react";
import { moscowDate } from "@/lib/lunar-calendar-paths";

const MOSCOW_OFFSET_MS = 3 * 3_600_000;

// Без разметки. Страница собрана заранее, поэтому момент «сейчас» узнаём в браузере: ставим на корень `.moon-month` долю месяца
// в переменной --today (0…1) и data-has-today, а строке сегодняшнего дня в таблице «День за днём» — класс is-today и aria-current.
// В другом месяце ничего не ставим: отметок «сейчас» на кривой, ленте и в таблице нет. Сетку и большую Луну отмечает MoonMonthExplorer
export function MoonTodayMark({ year, month }: { year: number; month: number }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".moon-month");
    if (!root) return;
    const now = new Date();
    const start = Date.UTC(year, month - 1, 1) - MOSCOW_OFFSET_MS;
    const end = Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1) - MOSCOW_OFFSET_MS;
    const share = (now.getTime() - start) / (end - start);
    if (share < 0 || share >= 1) return;
    root.style.setProperty("--today", share.toFixed(4));
    root.dataset.hasToday = "true";
    const row = root.querySelector<HTMLElement>(`.moon-days__row[data-date="${moscowDate(now)}"]`);
    row?.classList.add("is-today");
    row?.setAttribute("aria-current", "date");
    return () => {
      root.style.removeProperty("--today");
      delete root.dataset.hasToday;
      row?.classList.remove("is-today");
      row?.removeAttribute("aria-current");
    };
  }, [year, month]);
  return null;
}
