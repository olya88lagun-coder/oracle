import { PosterButton } from "@/components/PosterButton";
import { weekdayPosterSpec } from "@/lib/poster-weekday";
import type { WeekdayPlanet } from "@/lib/weekday-planets";
import { PlanetArtwork } from "./PlanetArtwork";
import { WeekdayCountdown } from "./WeekdayCountdown";

// Первый экран страницы дней недели: что за день сейчас, сколько он ещё продлится и кнопки «поделиться» и «к вопросу дня».
// Глубокий текст (образ, вопрос, действие) лежит в карточке дня ниже, здесь его не повторяем
export function WeekdayNow({ planet }: { planet: WeekdayPlanet }) {
  return (
    <aside className="weekday-strip weekday-now" data-planet={planet.glyph} aria-label="Планета дня">
      <span className="weekday-mark" aria-hidden="true">
        <PlanetArtwork glyph={planet.glyph} eager />
      </span>
      <div className="weekday-strip__body">
        <p className="weekday-strip__eyebrow">Планета дня</p>
        <p className="weekday-strip__lead">
          Сегодня {planet.day.toLowerCase()} — день {planet.planetGenitive}
        </p>
        <p className="weekday-strip__archetype">{planet.archetype}</p>
        <WeekdayCountdown />
      </div>
      <div className="weekday-now__actions">
        <PosterButton spec={weekdayPosterSpec(planet)} />
        <a className="touch-link" href={`#${planet.slug}`}>
          Вопрос и действие дня
        </a>
      </div>
    </aside>
  );
}
