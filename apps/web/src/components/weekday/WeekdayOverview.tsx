import { WEEKDAY_PLANETS } from "@/lib/weekday-planets";
import { PlanetArtwork } from "./PlanetArtwork";

// Краткая сводка недели: день → планета → образ. Удобно пробежать глазами до длинных карточек
export function WeekdayOverview({ today }: { today: number }) {
  return (
    <section className="weekday-overview" aria-labelledby="weekday-overview-title">
      <h2 id="weekday-overview-title">Семь дней одной недели</h2>
      <p className="weekday-overview__lead">Короткая карта: какой планете соответствует день и на чём удобно задержать внимание.</p>
      <ol className="weekday-overview__list">
        {WEEKDAY_PLANETS.map((planet, index) => {
          const isToday = index === today;
          return (
            <li key={planet.slug} data-planet={planet.glyph} data-today={isToday || undefined}>
              <a className="weekday-overview__row" href={`#${planet.slug}`}>
                <span className="weekday-mark" aria-hidden="true">
                  <PlanetArtwork glyph={planet.glyph} />
                </span>
                <span className="weekday-overview__day">
                  {planet.dayShort}
                  {isToday && <span className="weekday-overview__badge">сегодня</span>}
                </span>
                <span className="weekday-overview__planet">{planet.planet}</span>
                <span className="weekday-overview__archetype">{planet.archetype}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
