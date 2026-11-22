import { WEEKDAY_PLANETS } from "@/lib/weekday-planets";
import { PlanetArtwork } from "./PlanetArtwork";

// Лента семи дней под героем: знак планеты своего цвета, сокращённое название дня, ссылка на якорь карточки. Сегодняшний день крупнее
export function WeekdayWeekBar({ today }: { today: number }) {
  return (
    <nav className="weekday-bar" aria-label="Дни недели">
      <ol>
        {WEEKDAY_PLANETS.map((planet, index) => (
          <li key={planet.slug}>
            <a className="weekday-bar__day" href={`#${planet.slug}`} data-planet={planet.glyph} aria-current={index === today ? "true" : undefined}>
              <span className="weekday-mark" aria-hidden="true">
                <PlanetArtwork glyph={planet.glyph} eager />
              </span>
              <span className="weekday-bar__name">{planet.dayShort}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
