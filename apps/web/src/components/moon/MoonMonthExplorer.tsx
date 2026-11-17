"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { CalendarDay, CalendarEvent } from "@/lib/lunar-calendar";
import { moscowDate } from "@/lib/lunar-calendar-paths";
import { AnimatedDisc, type MoonView } from "./AnimatedDisc";
import { MoonDisc } from "./MoonDisc";

export type ExplorerDay = CalendarDay;
export type ExplorerEvent = CalendarEvent;

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

const toView = (day: ExplorerDay): MoonView => ({ date: day.date, dateLabel: day.label, illumination: day.illumination, waxing: day.waxing, phase: day.phase, phaseName: day.phaseName });
const percent = (day: ExplorerDay): number => Math.round(day.illumination * 100);

// Сетка месяца и большая Луна выбранного дня. День выбирается наведением мыши, фокусом, нажатием, стрелками или кнопкой ключевой даты;
// большая Луна плавно «переливается» к фазе дня. Сетка остаётся настоящей таблицей, внутри ячеек кнопки с одной точкой входа по Tab.
// Оформление и эффекты — Codex (docs/design/codex-brief-lunar-calendar.md)
export function MoonMonthExplorer({ weeks, days, events, initialIndex }: { weeks: (number | null)[][]; days: readonly ExplorerDay[]; events: readonly ExplorerEvent[]; initialIndex: number }) {
  const [selected, setSelected] = useState(initialIndex);
  const [started, setStarted] = useState(false);
  const [todayIndex, setTodayIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const views = useMemo(() => days.map(toView), [days]);

  // Страница собрана заранее, поэтому «сегодня» узнаём в браузере: в текущем месяце выбор переходит на сегодняшний день
  useEffect(() => {
    const index = days.findIndex((day) => day.date === moscowDate(new Date()));
    if (index < 0) return;
    setTodayIndex(index);
    setSelected(index);
  }, [days]);

  const select = (index: number) => {
    if (index === selected) return;
    setStarted(true);
    setSelected(index);
  };

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const destinations: Partial<Record<string, number>> = { ArrowLeft: index - 1, ArrowRight: index + 1, ArrowUp: index - 7, ArrowDown: index + 7, Home: 0, End: days.length - 1 };
    const target = destinations[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(days.length - 1, target));
    select(next);
    gridRef.current?.querySelector<HTMLButtonElement>(`button[data-index="${next}"]`)?.focus();
  }

  const day = days[selected]!;
  return (
    <div className="moon-month__explorer">
      <aside className="moon-month__panel">
        <figure className="moon-disc" data-phase={day.phase} data-waxing={day.waxing ? "true" : "false"}>
          <AnimatedDisc view={views[selected]!} animateIntro={!started} />
          <figcaption id="moon-month-selected" className="moon-disc__caption" aria-live="polite" aria-atomic="true">
            <time dateTime={day.date}>{day.label}</time> · {day.phaseName} · освещено {percent(day)} %
          </figcaption>
        </figure>
        <dl className="moon-month__details">
          <div><dt>Лунные сутки</dt><dd>{day.lunarNumber}-е{day.lunarChange ? `, затем ${day.lunarChange}` : ""}</dd></div>
          <div><dt>Знак Луны</dt><dd>{day.signName}</dd></div>
          <div><dt>Восход и заход</dt><dd>{day.riseSet}</dd></div>
        </dl>
      </aside>
      <section className="moon-month__events" aria-labelledby="moon-events-title">
        <h2 id="moon-events-title">Ключевые даты</h2>
        <ul>
          {events.map((event) => (
            <li key={`${event.kind}-${event.date}`}>
              <button type="button" className="moon-event" data-kind={event.kind} onClick={() => select(event.dayIndex)}>
                <span className="moon-event__name">{event.name}</span> <span className="moon-event__time">{event.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="moon-month__calendar" aria-labelledby="moon-calendar-title">
        <h2 id="moon-calendar-title" className="visually-hidden">Сетка месяца</h2>
        <table ref={gridRef} className="moon-month__grid">
          <caption className="visually-hidden">Календарь месяца: фаза Луны, лунные сутки и знак Луны по дням</caption>
          <thead>
            <tr>{WEEKDAYS.map((weekday) => <th key={weekday} scope="col">{weekday}</th>)}</tr>
          </thead>
          <tbody>
            {weeks.map((week, row) => (
              <tr key={row}>
                {week.map((index, column) => {
                  if (index === null) return <td key={column} className="moon-month__cell is-empty" />;
                  const cell = days[index]!;
                  const today = todayIndex === index;
                  return (
                    <td key={column} className={`moon-month__cell${today ? " is-today" : ""}`} data-date={cell.date} data-phase={cell.phase} data-weekday={column} aria-current={today ? "date" : undefined} style={{ "--lit": cell.illumination.toFixed(3), "--i": index } as CSSProperties}>
                      <button
                        type="button"
                        className="moon-month__pick"
                        data-index={index}
                        aria-pressed={index === selected}
                        aria-label={`${cell.label}: ${cell.phaseName}, освещено ${percent(cell)} %`}
                        tabIndex={index === selected ? 0 : -1}
                        onClick={() => select(index)}
                        onFocus={() => select(index)}
                        onPointerEnter={(event) => { if (event.pointerType === "mouse") select(index); }}
                        onKeyDown={(event) => move(event, index)}
                      >
                        <span className="moon-month__date">{cell.day}</span>
                        <MoonDisc size="mini" illumination={cell.illumination} waxing={cell.waxing} phase={cell.phase} animateIntro={false} />
                        <span className="moon-month__lunar">{cell.lunarNumber} л. с.</span>
                        <span className="moon-month__sign">{cell.signName}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
