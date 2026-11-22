import Link from "next/link";
import { WEEKDAY_PATH, type WeekdayPlanet } from "@/lib/weekday-planets";
import { PlanetGlyph } from "./PlanetGlyph";
import { PlanetArtwork } from "./PlanetArtwork";

// Планета сегодняшнего дня одним блоком: знак, «Сегодня четверг — день Юпитера», образ и вопрос. Ставится под картой дня, на «Луне сегодня» и в шапке страницы дней недели
export function WeekdayStrip({ planet, link = true, artwork = false }: { planet: WeekdayPlanet; link?: boolean; artwork?: boolean }) {
  return (
    <aside className="weekday-strip" data-planet={planet.glyph} aria-label="Планета дня">
      <span className="weekday-mark" aria-hidden="true">
        {artwork ? <PlanetArtwork glyph={planet.glyph} eager /> : <PlanetGlyph glyph={planet.glyph} size={30} />}
      </span>
      <div className="weekday-strip__body">
        <p className="weekday-strip__eyebrow">Планета дня</p>
        <p className="weekday-strip__lead">
          Сегодня {planet.day.toLowerCase()} — день {planet.planetGenitive}
        </p>
        <p className="weekday-strip__archetype">{planet.archetype}</p>
        <p className="weekday-strip__question">{planet.question}</p>
      </div>
      {link && (
        <Link className="weekday-strip__more touch-link" href={WEEKDAY_PATH}>
          Все семь дней
        </Link>
      )}
    </aside>
  );
}
