import type { LifeThread } from "@oracle/core";
import { curveLevels, threadWindow, YEAR_NAMES } from "./life-thread-curve";
import type { ThreadPosterSpec } from "./poster";

// Спека картинки «Нить для сторис»: точки в коробке 1000×300, подписи лет и текущий год. Дата рождения в спеку не попадает
export function threadPosterSpec(thread: LifeThread): ThreadPosterSpec {
  const years = threadWindow(thread.years, thread.currentYear, "window");
  const levels = curveLevels(years.map((item) => item.value));
  const step = years.length > 1 ? 1000 / (years.length - 1) : 0;
  const nowIndex = Math.max(0, years.findIndex((item) => item.year === thread.currentYear));
  const nowValue = years[nowIndex]?.value ?? 1;
  return {
    thread: "thread",
    points: years.map((_, i) => ({ x: i * step, y: (1 - (levels[i] ?? 0)) * 300 })),
    nowIndex,
    yearLabels: years.flatMap((item, i) => (i % 3 === 0 || i === nowIndex ? [{ x: i * step, text: String(item.year) }] : [])),
    nowLabel: `Год ${nowValue} · ${YEAR_NAMES[nowValue]}`,
    footer: "ТВОЙ ОРАКУЛ · TVOY-ORAKUL.RU",
    fileName: "nit-lichnyh-let",
  };
}
