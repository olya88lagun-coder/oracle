import type { CSSProperties } from "react";
import { WEEKDAY_PLANETS } from "@/lib/weekday-planets";
import { PlanetArtwork } from "./PlanetArtwork";

// Художественная сцена семи дней, а не карта Солнечной системы: сегодня в центре.
export function WeekdayWheel({ today }: { today: number | null }) {
  const current = WEEKDAY_PLANETS[today ?? 0]!;
  const companions = WEEKDAY_PLANETS.filter((planet) => planet.glyph !== current.glyph);
  return (
    <figure className="weekday-wheel weekday-system" data-planet={current.glyph} aria-hidden="true">
      <div className="weekday-system__orbit" />
      <div className="weekday-system__centre">
        <PlanetArtwork glyph={current.glyph} size="hero" eager />
      </div>
      {companions.map((planet, index) => {
        const angle = (index * 60 - 90) * Math.PI / 180;
        const position = { left: `${50 + 40 * Math.cos(angle)}%`, top: `${47 + 40 * Math.sin(angle)}%`, "--order": index } as CSSProperties;
        return (
          <div key={planet.glyph} className="weekday-system__companion" data-planet={planet.glyph} style={position}>
            <PlanetArtwork glyph={planet.glyph} eager />
            <span className="weekday-system__label">{planet.planet}</span>
          </div>
        );
      })}
    </figure>
  );
}
