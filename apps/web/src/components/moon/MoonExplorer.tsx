"use client";

import { useState, type ReactNode } from "react";
import { AnimatedDisc, type MoonView } from "./AnimatedDisc";
import { MoonStrip } from "./MoonStrip";

export type { MoonView };

export type MoonCalendarDay = MoonView & { label: string; isToday: boolean };

export function MoonExplorer({ today, days, heading, todayDetails, ask }: {
  today: MoonView;
  days: readonly MoonCalendarDay[];
  heading: ReactNode;
  todayDetails: ReactNode;
  // Вопрос дня и запись: стоит сразу под диском, до ленты
  ask?: ReactNode;
}) {
  const [selected, setSelected] = useState(0);
  const [started, setStarted] = useState(false);
  const view = selected === 0 ? today : days[selected] ?? today;
  const select = (index: number) => {
    if (index === selected) return;
    setStarted(true);
    setSelected(index);
  };
  return (
    <header className="moon-hero">
      {heading}
      <figure className="moon-disc" data-phase={view.phase} data-waxing={view.waxing}>
        <AnimatedDisc view={view} animateIntro={!started} />
        <figcaption id="moon-selected-phase" className="moon-disc__caption" aria-live="polite" aria-atomic="true">
          {selected !== 0 && <><time dateTime={view.date}>{view.dateLabel}</time> · </>}
          {view.phaseName} · освещено {Math.round(view.illumination * 100)} %
        </figcaption>
      </figure>
      {ask}
      <MoonStrip days={days} selected={selected} onSelect={select} />
      <div className="moon-hero__today">
        {selected !== 0 && <p className="moon-hero__today-label">Данные на сегодня</p>}
        {todayDetails}
      </div>
    </header>
  );
}
