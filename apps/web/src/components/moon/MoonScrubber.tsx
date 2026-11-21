"use client";

import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { NatalGlyph } from "@/components/natal/NatalGlyph";
import type { CalendarDay, CalendarEvent, MonthPage, RibbonSegment } from "@/lib/lunar-calendar";

const WIDTH = 720;
const HEIGHT = 160;

// Лента месяца: кривая освещённости и лента знаков в одной дорожке. Провёл мышью или пальцем по кривой — сцена выше перелистывает дни;
// кружки главных фаз и промежутки знаков — кнопки перехода. Для скринридеров и клавиатуры — «ползунок» по дням (стрелки, Home, End).
export function MoonScrubber({ days, events, curve, ribbon, selected, onSelect }: { days: readonly CalendarDay[]; events: readonly CalendarEvent[]; curve: MonthPage["curve"]; ribbon: readonly RibbonSegment[]; selected: number; onSelect: (index: number) => void }) {
  const plot = useRef<HTMLDivElement>(null);
  const count = days.length;
  const dragging = useRef(false);

  const indexAt = (clientX: number) => {
    const rect = plot.current!.getBoundingClientRect();
    return Math.max(0, Math.min(count - 1, Math.floor(((clientX - rect.left) / rect.width) * count)));
  };
  const down = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(indexAt(event.clientX));
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) onSelect(indexAt(event.clientX));
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const target: Partial<Record<string, number>> = { ArrowLeft: selected - 1, ArrowDown: selected - 1, ArrowRight: selected + 1, ArrowUp: selected + 1, Home: 0, End: count - 1, PageDown: selected - 7, PageUp: selected + 7 };
    const next = target[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onSelect(Math.max(0, Math.min(count - 1, next)));
  };

  const day = days[selected]!;
  const point = curve.points[selected]!;
  const centre = (selected + 0.5) / count;
  return (
    <div className="moon-scrub">
      <div className="moon-scrub__stage">
        <div
          ref={plot}
          className="moon-scrub__plot"
          role="slider"
          tabIndex={0}
          aria-label="Дни месяца: проведите по кривой освещённости"
          aria-valuemin={1}
          aria-valuemax={count}
          aria-valuenow={selected + 1}
          aria-valuetext={`${day.label}: ${day.phaseName}, ${day.signLine}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={keys}
        >
          <svg className="moon-scrub__svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path className="moon-scrub__area" d={curve.area} />
            <path className="moon-scrub__line" d={curve.line} pathLength={1} fill="none" />
          </svg>
          <span className="moon-scrub__cursor" aria-hidden="true" style={{ left: `${(centre * 100).toFixed(2)}%`, "--y": `${((point.y / HEIGHT) * 100).toFixed(2)}%` } as CSSProperties}>
            <span className="moon-scrub__dot" />
          </span>
        </div>
        <ul className="moon-scrub__events">
          {curve.events.map((marker, index) => {
            const event = events[index]!;
            return (
              <li key={`${marker.kind}-${marker.x}`} style={{ left: `${((marker.x / WIDTH) * 100).toFixed(2)}%`, top: `${((marker.y / HEIGHT) * 100).toFixed(2)}%` }}>
                <button type="button" className="moon-scrub__event" data-kind={marker.kind} aria-label={`${event.name}, ${event.label}`} title={`${event.name}, ${event.label}`} onClick={() => onSelect(event.dayIndex)} />
              </li>
            );
          })}
        </ul>
      </div>
      <ol className="moon-scrub__ribbon" aria-label="Луна по знакам">
        {ribbon.map((segment) => (
          <li key={segment.from} style={{ flexGrow: Math.max(0.0001, segment.to - segment.from) }}>
            <button
              type="button"
              className="moon-scrub__sign"
              aria-current={centre >= segment.from && centre < segment.to ? "true" : undefined}
              aria-label={`Луна в знаке ${segment.signName}: ${segment.label}`}
              title={`${segment.signName}: ${segment.label}`}
              onClick={() => onSelect(Math.max(0, Math.min(count - 1, Math.round(segment.from * count))))}
            >
              <NatalGlyph id={segment.sign} className="moon-scrub__glyph" />
              <span>{segment.signName}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
