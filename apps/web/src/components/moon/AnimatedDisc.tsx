"use client";

import { useEffect, useRef, useState } from "react";
import type { PhaseId } from "@oracle/core/moon/visual";
import { MoonDisc } from "./MoonDisc";

export type MoonView = {
  date: string;
  dateLabel: string;
  illumination: number;
  waxing: boolean;
  phase: PhaseId;
  phaseName: string;
};

type DiscLight = Pick<MoonView, "illumination" | "waxing">;

function lightAngle({ illumination, waxing }: DiscLight) {
  const angle = Math.acos(1 - 2 * illumination);
  return waxing ? angle : Math.PI * 2 - angle;
}

// Большая Луна, терминатор которой плавно «переливается» к фазе нового вида (~440 мс); при «меньше движения» меняется сразу.
// Вынесена из MoonExplorer, чтобы тем же приёмом пользовались «Луна сегодня» и лунный календарь
export function AnimatedDisc({ view, animateIntro }: { view: MoonView; animateIntro: boolean }) {
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
