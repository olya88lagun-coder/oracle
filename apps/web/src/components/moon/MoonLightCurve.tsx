import type { MonthPage } from "@/lib/lunar-calendar";

// Кривая освещённости Луны по дням месяца: линия «рисуется» (pathLength=1), отметка «сейчас» ставится оформлением по переменной --today
// (её выставляет MoonTodayMark). Декоративна: те же даты есть в списке ключевых дат.
// SVG растягивается на всю ширину карточки (preserveAspectRatio="none"), поэтому отметки главных фаз — HTML-точки поверх него, с положением в процентах:
// кружки внутри растянутого SVG превращались бы в овалы. Оформление — Codex (docs/design/codex-brief-lunar-calendar.md)
export function MoonLightCurve({ curve, width, height }: { curve: MonthPage["curve"]; width: number; height: number }) {
  return (
    <figure className="moon-curve">
      <div className="moon-curve__plot">
        <svg className="moon-curve__svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" data-width={width} data-height={height} aria-hidden="true" focusable="false">
          <path className="moon-curve__area" d={curve.area} />
          <path className="moon-curve__line" d={curve.line} pathLength={1} fill="none" />
          <line className="moon-curve__now" x1={0} x2={0} y1={0} y2={height} />
        </svg>
        <ul className="moon-curve__events" aria-hidden="true">
          {curve.events.map((event) => (
            <li key={`${event.kind}-${event.x}`} className="moon-curve__event" data-kind={event.kind} style={{ left: `${((event.x / width) * 100).toFixed(2)}%`, top: `${((event.y / height) * 100).toFixed(2)}%` }} />
          ))}
        </ul>
      </div>
      <figcaption>Освещённость Луны по дням месяца</figcaption>
    </figure>
  );
}
