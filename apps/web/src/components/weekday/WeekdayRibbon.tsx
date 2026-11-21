import Link from "next/link";
import { WEEKDAY_PATH, WEEKDAY_PLANETS } from "@/lib/weekday-planets";
import { PlanetGlyph } from "./PlanetGlyph";

// Лента «дни недели и планеты» под таблицей «День за днём»: семь знаков, каждый ведёт к своей карточке на странице дней недели
export function WeekdayRibbon() {
  return (
    <section className="weekday-ribbon" aria-labelledby="weekday-ribbon-title">
      <h2 id="weekday-ribbon-title">Дни недели и планеты</h2>
      <p>У каждого дня недели есть своя планета-покровитель. Это не прогноз, а образ дня и вопрос, с которым удобно его прожить.</p>
      <ul>
        {WEEKDAY_PLANETS.map((planet) => (
          <li key={planet.slug} data-planet={planet.glyph}>
            <Link href={`${WEEKDAY_PATH}#${planet.slug}`}>
              <span className="weekday-mark" aria-hidden="true">
                <PlanetGlyph glyph={planet.glyph} size={26} />
              </span>
              <span className="weekday-ribbon__day">{planet.dayShort}</span>
              <span className="weekday-ribbon__planet">{planet.planet}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
