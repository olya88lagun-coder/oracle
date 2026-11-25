import Link from "next/link";
import { WEEKDAY_TRADITION } from "@/lib/weekday-planets";

// Короткий блок про халдейский порядок: откуда взялась связка день–планета, без прогнозов
export function WeekdayTradition() {
  const text = WEEKDAY_TRADITION;
  return (
    <section className="weekday-tradition" aria-labelledby="weekday-tradition-title">
      <h2 id="weekday-tradition-title">{text.title}</h2>
      <p className="weekday-tradition__lead">{text.lead}</p>
      <ul className="weekday-tradition__points">
        {text.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="weekday-tradition__method">
        <Link className="touch-link" href={text.methodHref}>{text.methodLabel}</Link>
      </p>
    </section>
  );
}
