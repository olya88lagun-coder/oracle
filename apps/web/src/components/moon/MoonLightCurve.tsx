import type { MonthPage } from "@/lib/lunar-calendar";

// Кривая освещённости Луны по дням месяца: линия «рисуется» (pathLength=1), на ней отмечены главные фазы, отметка «сейчас» ставится оформлением
// по переменной --today (её выставляет MoonTodayMark). Декоративна: те же даты есть в списке ключевых дат
// Оформление — Codex (docs/design/codex-brief-lunar-calendar.md)
export function MoonLightCurve({ curve, width, height }: { curve: MonthPage["curve"]; width: number; height: number }) {
  return (
    <figure className="moon-curve">
      <svg className="moon-curve__svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" data-width={width} data-height={height} aria-hidden="true" focusable="false">
        <path className="moon-curve__area" d={curve.area} />
        <path className="moon-curve__line" d={curve.line} pathLength={1} fill="none" />
        <g className="moon-curve__events">
          {curve.events.map((event) => (
            <circle key={`${event.kind}-${event.x}`} className="moon-curve__event" data-kind={event.kind} cx={event.x} cy={event.y} r={5} />
          ))}
        </g>
        <line className="moon-curve__now" x1={0} x2={0} y1={0} y2={height} />
      </svg>
      <figcaption>Освещённость Луны по дням месяца</figcaption>
    </figure>
  );
}
