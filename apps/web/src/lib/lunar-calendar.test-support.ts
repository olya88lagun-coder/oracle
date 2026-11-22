import type { MonthPage } from "./lunar-calendar";

// Упрощённое представление страницы месяца для сравнения со снимком Москвы
export const MONTH_BASELINE_NOW = new Date("2026-11-22T09:00:00Z");
export const MONTH_BASELINE_MONTHS: readonly [number, number][] = [[2026, 11], [2027, 3]];

export function plainMonthPage(page: MonthPage) {
  return {
    cells: page.cells.map((cell) => [cell.date, cell.label, cell.phase, cell.lunarNumber, cell.lunarChange, cell.riseSet, cell.riseMin, cell.setMin, cell.signChange ? 1 : 0, cell.keyPoint?.label ?? ""]),
    weeks: page.weeks,
    events: page.events.map((event) => [event.label, event.date, event.dayIndex, event.at]),
    timeline: page.timeline.map((item) => [item.title, item.label, item.date, item.at]),
    signRuns: page.signRuns.map((run) => [run.signName, run.label]),
    ribbon: page.ribbon.map((segment) => [segment.sign, segment.from.toFixed(6), segment.to.toFixed(6), segment.label]),
    curveEvents: page.curve.events,
    rows: page.rows.map((row) => [row.date, row.label, row.lunar, row.riseSet, row.percent]),
    faq: page.faq.map((item) => item.answer),
    summary: page.summary,
    afterMonth: page.afterMonth,
  };
}
