"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type TouchEvent } from "react";
import { PosterButton } from "@/components/PosterButton";
import type { CalendarDay } from "@/lib/lunar-calendar";
import { lunarDayPathOfDate } from "@/lib/lunar-calendar-paths";
import type { MoonPosterSpec } from "@/lib/poster-moon";
import { AnimatedDisc, type MoonView } from "./AnimatedDisc";
import { MoonDiary } from "./MoonDiary";
import { MoonPathArc } from "./MoonPathArc";

export type SceneDiary = { ready: boolean; note: string; canWrite: boolean; onSave: (text: string) => void; stats: { inMonth: number; streak: number } };

const splitRiseSet = (riseSet: string): [string | null, string | null] => {
  const [rise, set] = riseSet.split(" / ");
  return [rise && rise !== "—" ? rise : null, set && set !== "—" ? set : null];
};

// «Лунная сцена» выбранного дня: живая Луна, гравюра знака на фоне, лунные сутки с символом, путь Луны по небу, главная фаза дня,
// счётчик до ближайшей фазы, вопрос дня с дневником и картинка для сторис. Свайп влево и вправо листает дни
export function MoonDayScene({ day, view, year, started, isToday, progress, countdown, diary, onStep, onToday }: {
  day: CalendarDay;
  view: MoonView;
  year: number;
  started: boolean;
  isToday: boolean;
  progress: number | null;
  countdown: string | null;
  diary: SceneDiary;
  onStep: (delta: -1 | 1) => void;
  onToday: (() => void) | null;
}) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  const start = (event: TouchEvent) => {
    const point = event.changedTouches[0]!;
    touch.current = { x: point.clientX, y: point.clientY };
  };
  const end = (event: TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    if (!from) return;
    const point = event.changedTouches[0]!;
    const dx = point.clientX - from.x;
    // Горизонтальный жест листает дни; почти вертикальный — это прокрутка страницы
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(point.clientY - from.y) * 1.6) onStep(dx < 0 ? 1 : -1);
  };

  const [rise, set] = splitRiseSet(day.riseSet);
  const point = day.keyPoint;
  const prompt = point?.question ?? day.lunarQuestion ?? "Что вы заметили в этот день?";
  const poster: MoonPosterSpec = {
    moon: "today",
    title: isToday ? "Луна сегодня" : "Луна в этот день",
    dateLabel: `${day.label} ${year}`,
    illumination: day.illumination,
    waxing: day.waxing,
    phaseName: day.phaseName,
    signImage: day.signImageLarge,
    signLine: day.signLine,
    dayLine: day.dayLine,
    rise,
    set,
    footer: "ТВОЙ ОРАКУЛ · TVOY-ORAKUL.RU",
    fileName: `luna-${day.date}`,
  };

  return (
    <section className="moon-scene" aria-labelledby="moon-scene-title" data-sign={day.sign} data-today={isToday ? "true" : undefined} onTouchStart={start} onTouchEnd={end}>
      {day.signImage && <Image key={day.sign} className="moon-scene__art" src={day.signImage} alt="" width={480} height={480} unoptimized sizes="(min-width: 900px) 420px, 100vw" priority />}
      <div className="moon-scene__moon">
        <figure className="moon-disc" data-phase={day.phase} data-waxing={day.waxing ? "true" : "false"}>
          <AnimatedDisc view={view} animateIntro={!started} />
          <figcaption id="moon-month-selected" className="moon-disc__caption" aria-live="polite" aria-atomic="true">
            <time dateTime={day.date}>{day.label}</time> · {day.phaseName} · освещено {Math.round(day.illumination * 100)} %
          </figcaption>
        </figure>
        <div className="moon-scene__nav" role="group" aria-label="Переход между днями">
          <button type="button" className="button button--ghost" onClick={() => onStep(-1)} aria-label="Предыдущий день">←</button>
          {onToday && <button type="button" className="button button--ghost" onClick={onToday}>Сегодня</button>}
          <button type="button" className="button button--ghost" onClick={() => onStep(1)} aria-label="Следующий день">→</button>
        </div>
      </div>
      <div className="moon-scene__info">
        <h2 id="moon-scene-title" className="moon-scene__title">{isToday ? "Сегодня" : day.label} · {day.phaseName}</h2>
        <p className="moon-scene__line">
          <strong>{day.signLine}</strong>
          <span>{day.dayLine}{day.lunarSymbol ? ` · «${day.lunarSymbol}»` : ""}{day.lunarChange ? ` (${day.lunarChange})` : ""}</span>
          <Link href={day.dayHref}>О лунных сутках →</Link>
          <Link href={lunarDayPathOfDate(day.date)} prefetch={false}>Страница дня →</Link>
        </p>
        {countdown && <p className="moon-scene__countdown" role="timer" aria-live="off">{countdown}</p>}
        <MoonPathArc rise={rise} set={set} progress={progress} />
        {point && (
          <div className="moon-scene__moment" data-kind={point.kind}>
            <strong>{point.title} · {point.label}</strong>
            <p>{point.astronomy}</p>
            <p>{point.symbol}</p>
            {point.action && <Link className="button button--ghost" href={point.action.href}>{point.action.label}</Link>}
          </div>
        )}
        {diary.ready && <MoonDiary key={day.date} prompt={prompt} note={diary.note} canWrite={diary.canWrite} onSave={diary.onSave} stats={diary.stats} />}
        <p className="moon-scene__share"><PosterButton spec={poster} label="Картинка для сторис" /></p>
      </div>
    </section>
  );
}
