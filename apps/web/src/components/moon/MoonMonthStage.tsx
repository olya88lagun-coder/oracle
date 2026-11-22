"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { CalendarDay, CalendarEvent, MonthPage } from "@/lib/lunar-calendar";
import { diaryStats, readDiary, withNote, writeDiary, type DiaryNotes } from "@/lib/moon-diary";
import { arcProgress, countdownLabel, nextStageEvent } from "@/lib/moon-stage";
import { zoneDate, zoneMinutes } from "@/lib/moon-zone";
import type { MoonView } from "./AnimatedDisc";
import { MoonDayScene } from "./MoonDayScene";
import { MoonDisc } from "./MoonDisc";
import { MoonPhaseArt } from "./MoonPhaseArt";
import { MoonScrubber } from "./MoonScrubber";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

const toView = (day: CalendarDay): MoonView => ({ date: day.date, dateLabel: day.label, illumination: day.illumination, waxing: day.waxing, phase: day.phase, phaseName: day.phaseName });
const percent = (day: CalendarDay): number => Math.round(day.illumination * 100);

// Одна «лунная сцена» месяца вместо шести блоков: сцена выбранного дня, лента-скраббер и сетка делят одно состояние — выбранный день.
// Выбор: нажатие или фокус в сетке, жест по ленте, кружок главной фазы, знак на ленте, стрелки и свайп в сцене, ссылка вида #2026-11-24.
// В текущем месяце страница открывается на сегодняшнем дне. Дневник хранится только в браузере (moon-diary.ts)
export function MoonMonthStage({ year, month, days, weeks, events, curve, ribbon, afterMonth, initialIndex, zone = "Europe/Moscow" }: {
  year: number;
  month: number;
  days: readonly CalendarDay[];
  weeks: (number | null)[][];
  events: readonly CalendarEvent[];
  curve: MonthPage["curve"];
  ribbon: MonthPage["ribbon"];
  afterMonth: MonthPage["afterMonth"];
  initialIndex: number;
  // Часовой пояс данных (выбранный город); по умолчанию Москва: «сегодня» и положение на дуге считаются по нему
  zone?: string;
}) {
  const [selected, setSelected] = useState(initialIndex);
  const [started, setStarted] = useState(false);
  const [todayIndex, setTodayIndex] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [notes, setNotes] = useState<DiaryNotes>({});
  const gridRef = useRef<HTMLTableElement>(null);
  const views = useMemo(() => days.map(toView), [days]);
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const select = useCallback((index: number) => {
    setStarted(true);
    setSelected(index);
    try {
      window.history.replaceState(null, "", `#${days[index]!.date}`);
    } catch {
      // Адрес не обновился — выбор всё равно работает
    }
  }, [days]);

  // Страница собрана заранее, поэтому «сегодня», ссылку на день и дневник узнаём в браузере
  useEffect(() => {
    const today = days.findIndex((day) => day.date === zoneDate(new Date(), zone));
    const linked = days.findIndex((day) => `#${day.date}` === window.location.hash);
    setNow(Date.now());
    setNotes(readDiary());
    if (today >= 0) setTodayIndex(today);
    const first = linked >= 0 ? linked : today;
    if (first >= 0) setSelected(first);
  }, [days, zone]);

  // Счётчик до ближайшей фазы обновляется раз в полминуты и только пока открыта вкладка
  useEffect(() => {
    if (todayIndex === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [todayIndex]);

  const step = (delta: -1 | 1) => select(Math.max(0, Math.min(days.length - 1, selected + delta)));

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
  const isToday = todayIndex === selected;
  const todayStr = now === null ? null : zoneDate(new Date(now), zone);
  const progress = isToday && now !== null ? arcProgress(day.riseMin, day.setMin, zoneMinutes(now, zone)) : null;
  const upcoming = todayIndex !== null && now !== null ? nextStageEvent(events, afterMonth, now) : null;
  const countdown = upcoming && now !== null ? `До ${upcoming.genitive} — ${countdownLabel(upcoming.at - now)}` : null;
  // Записывать можно до сегодняшнего дня включительно; в будущих месяцах дневник закрыт
  const canWrite = todayStr !== null && day.date <= todayStr;
  const stats = useMemo(() => diaryStats(notes, todayStr ?? "0000-00-00", monthPrefix), [notes, todayStr, monthPrefix]);

  const save = (text: string) => {
    const next = withNote(notes, day.date, text);
    setNotes(next);
    writeDiary(next);
  };

  return (
    <div className="moon-stage" id="moon-calendar" data-sign={day.sign}>
      <div className="moon-stage__bar" aria-hidden="true">
        <MoonDisc size="mini" illumination={day.illumination} waxing={day.waxing} phase={day.phase} animateIntro={false} />
        <span>{day.label} · {day.phaseName}</span>
        <span>{day.signLine}</span>
      </div>
      <MoonDayScene
        day={day}
        view={views[selected]!}
        year={year}
        started={started}
        isToday={isToday}
        progress={progress}
        countdown={countdown}
        diary={{ ready: now !== null, note: notes[day.date] ?? "", canWrite, onSave: save, stats }}
        onStep={step}
        onToday={todayIndex !== null && todayIndex !== selected ? () => select(todayIndex) : null}
      />
      <MoonScrubber days={days} events={events} curve={curve} ribbon={ribbon} selected={selected} onSelect={select} />
      <section className="moon-stage__calendar" aria-labelledby="moon-calendar-title">
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
                  const hasNote = Boolean(notes[cell.date]);
                  const label = `${cell.label}: ${cell.phaseName}, освещено ${percent(cell)} %${cell.keyPoint ? `, ${cell.keyPoint.title.toLowerCase()}` : ""}${cell.signChange ? `, Луна переходит в знак ${cell.signName}` : ""}${hasNote ? ", есть запись" : ""}`;
                  return (
                    <td
                      key={column}
                      className={`moon-month__cell${today ? " is-today" : ""}`}
                      data-date={cell.date}
                      data-phase={cell.phase}
                      data-weekday={column}
                      data-event={cell.keyPoint?.kind}
                      data-sign-change={cell.signChange ? "true" : undefined}
                      data-note={hasNote ? "true" : undefined}
                      aria-current={today ? "date" : undefined}
                      style={{ "--lit": cell.illumination.toFixed(3), "--i": index } as CSSProperties}
                    >
                      <button type="button" className="moon-month__pick" data-index={index} aria-pressed={index === selected} aria-label={label} tabIndex={index === selected ? 0 : -1} onClick={() => select(index)} onFocus={() => select(index)} onKeyDown={(event) => move(event, index)}>
                        <span className="moon-month__date">{cell.day}</span>
                        <MoonPhaseArt phase={cell.phase} illumination={cell.illumination} waxing={cell.waxing} />
                        <span className="moon-month__lunar">{cell.lunarNumber} л. с.</span>
                        <span className="moon-month__sign">{cell.signName}</span>
                        <span className="moon-month__marks" aria-hidden="true" />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="moon-stage__legend">Кружок на ленте и значок в ячейке — главная фаза; фиолетовый знак — день, когда Луна в него перешла; точка — запись в вашем дневнике.</p>
      </section>
    </div>
  );
}
