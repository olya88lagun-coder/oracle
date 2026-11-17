"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PhaseId } from "@oracle/core/moon";
import { MoonDisc } from "./MoonDisc";
import { MoonStrip } from "./MoonStrip";

export type MoonView = {
  date: string;
  dateLabel: string;
  illumination: number;
  waxing: boolean;
  phase: PhaseId;
  phaseName: string;
};

export type MoonCalendarDay = MoonView & { label: string; isToday: boolean };

type DiscLight = Pick<MoonView, "illumination" | "waxing">;

function lightAngle({ illumination, waxing }: DiscLight) {
  const angle = Math.acos(1 - 2 * illumination);
  return waxing ? angle : Math.PI * 2 - angle;
}

function AnimatedDisc({ view, animateIntro }: { view: MoonView; animateIntro: boolean }) {
  const [light, setLight] = useState<DiscLight>(view);
  const displayed = useRef<DiscLight>(view);

  useEffect(() => {
    const from = lightAngle(displayed.current);
    const to = lightAngle(view);
    const distance = ((to - from + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const settle = () => {
      cancelAnimationFrame(frame);
      displayed.current = view;
      setLight(view);
    };

    if (preference.matches || Math.abs(distance) < 0.0001) {
      if (displayed.current !== view) settle();
      return;
    }

    const start = performance.now();
    const draw = (time: number) => {
      const progress = Math.min(1, (time - start) / 440);
      if (progress >= 1) {
        settle();
        return;
      }
      const angle = from + distance * (1 - (1 - progress) ** 3);
      displayed.current = { illumination: (1 - Math.cos(angle)) / 2, waxing: Math.sin(angle) >= 0 };
      setLight(displayed.current);
      frame = requestAnimationFrame(draw);
    };
    const reduce = () => { if (preference.matches) settle(); };
    frame = requestAnimationFrame(draw);
    preference.addEventListener("change", reduce);
    return () => {
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", reduce);
    };
  }, [view]);

  return <MoonDisc {...light} phase={view.phase} animateIntro={animateIntro} />;
}

export function MoonExplorer({ today, days, heading, todayDetails }: {
  today: MoonView;
  days: readonly MoonCalendarDay[];
  heading: ReactNode;
  todayDetails: ReactNode;
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
      <MoonStrip days={days} selected={selected} onSelect={select} />
      <div className="moon-hero__today">
        {selected !== 0 && <p className="moon-hero__today-label">Данные на сегодня</p>}
        {todayDetails}
      </div>
    </header>
  );
}
