import Link from "next/link";
import { WEEKDAY_PLANETS } from "@/lib/weekday-planets";
import { PlanetGlyph } from "./PlanetGlyph";

// Семь карточек дней: образ, вопрос для себя и ссылка на практику. Сегодняшний день отмечен рамкой и словом «Сегодня»; восьмой ячейкой — короткое «как этим пользоваться»
export function WeekdayCards({ today }: { today: number }) {
  return (
    <ol className="weekday-cards">
      {WEEKDAY_PLANETS.map((planet, index) => {
        const isToday = index === today;
        return (
          <li key={planet.slug} id={planet.slug} className="weekday-card" data-today={isToday || undefined} aria-current={isToday ? "date" : undefined}>
            <div className="weekday-card__head">
              <span className="weekday-mark" aria-hidden="true">
                <PlanetGlyph glyph={planet.glyph} size={28} />
              </span>
              <div>
                <p className="weekday-card__planet">{planet.planet}</p>
                <h3>{planet.day}</h3>
              </div>
              {isToday && <span className="weekday-card__badge">Сегодня</span>}
            </div>
            <p className="weekday-card__archetype">
              <span className="weekday-card__label">Образ</span>
              {planet.archetype}
            </p>
            <p className="weekday-card__question">
              <span className="weekday-card__label">Вопрос для себя</span>
              {planet.question}
            </p>
            <p className="weekday-card__practice">
              {planet.practice.lead}{" "}
              <Link href={planet.practice.href}>
                {planet.practice.label}
              </Link>
            </p>
          </li>
        );
      })}
      <li className="weekday-card weekday-card--how">
        <h3>Как этим пользоваться</h3>
        <ol>
          <li>Утром прочитайте образ дня.</li>
          <li>Днём заметьте, где он отзывается.</li>
          <li>Вечером вернитесь к вопросу.</li>
        </ol>
      </li>
    </ol>
  );
}
