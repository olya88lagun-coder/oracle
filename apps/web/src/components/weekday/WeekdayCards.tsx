import Link from "next/link";
import { Icon } from "@/components/Icon";
import { WEEKDAY_PLANETS } from "@/lib/weekday-planets";
import { PlanetArtwork } from "./PlanetArtwork";
import { WeekdayCardFold } from "./WeekdayCardFold";

const STEPS = [
  { icon: "sunrise", when: "Утром", text: "прочитайте образ дня." },
  { icon: "sun", when: "Днём", text: "заметьте, где он отзывается." },
  { icon: "moon", when: "Вечером", text: "вернитесь к вопросу." },
] as const;

// Семь карточек дней: образ, вопрос для себя, маленькое действие, откуда название дня и ссылка на практику. Сегодняшний день отмечен рамкой и словом «Сегодня»; восьмой ячейкой — «как этим пользоваться»
export function WeekdayCards({ today }: { today: number }) {
  return (
    <ol className="weekday-cards">
      {WEEKDAY_PLANETS.map((planet, index) => {
        const isToday = index === today;
        return (
          <li key={planet.slug} id={planet.slug} className="weekday-card" data-planet={planet.glyph} data-today={isToday || undefined} aria-current={isToday ? "date" : undefined}>
            <div className="weekday-card__art" aria-hidden="true"><PlanetArtwork glyph={planet.glyph} size="card" /></div>
            <div className="weekday-card__head">
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
            <WeekdayCardFold open={isToday}>
              <p className="weekday-card__question">
                <span className="weekday-card__label">Вопрос для себя</span>
                {planet.question}
              </p>
              <p className="weekday-card__action">
                <span className="weekday-card__label">Маленькое действие</span>
                {planet.action}
              </p>
              <p className="weekday-card__etymology">{planet.etymology}</p>
              <p className="weekday-card__practice">
                {planet.practice.lead}{" "}
                <Link href={planet.practice.href}>
                  {planet.practice.label}
                </Link>
              </p>
            </WeekdayCardFold>
          </li>
        );
      })}
      <li className="weekday-card weekday-card--how">
        <h3>Как этим пользоваться</h3>
        <ol className="weekday-how">
          {STEPS.map((step) => (
            <li key={step.when}>
              <span className="weekday-how__icon" aria-hidden="true"><Icon name={step.icon} size={22} /></span>
              <span><strong>{step.when}</strong> {step.text}</span>
            </li>
          ))}
        </ol>
      </li>
    </ol>
  );
}
