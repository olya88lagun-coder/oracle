import { GLYPH_PATHS } from "./PlanetGlyph";
import { WEEKDAY_PLANETS } from "@/lib/weekday-planets";

const SIZE = 400;
const C = SIZE / 2;
const NODE_R = 144;
// Планеты по удалённости от Земли (Сатурн сверху, дальше по часовой стрелке) — индексы в WEEKDAY_PLANETS (0 — Луна/понедельник)
const CHALDEAN = [5, 3, 1, 6, 4, 2, 0];

const point = (weekday: number, radius: number) => {
  const angle = ((CHALDEAN.indexOf(weekday) * 360) / 7 - 90) * (Math.PI / 180);
  return { x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle) };
};

// Колесо недели: семь планет по кругу в порядке удалённости, а линия через каждую третью даёт порядок дней недели — Луна, Марс, Меркурий, Юпитер, Венера, Сатурн, Солнце.
// Это старая и точная картинка: семиконечная звезда {7/3}. Рисунок декоративный, весь текст — в карточках дней
export function WeekdayWheel({ today }: { today: number | null }) {
  const star = WEEKDAY_PLANETS.map((_, index) => point(index, NODE_R)).map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`);
  const ticks = Array.from({ length: 84 }, (_, index) => {
    const angle = (index * 360) / 84 - 90;
    const long = index % 12 === 0;
    const from = 186 - (long ? 8 : 3);
    const rad = (angle * Math.PI) / 180;
    return { key: index, x1: C + from * Math.cos(rad), y1: C + from * Math.sin(rad), x2: C + 186 * Math.cos(rad), y2: C + 186 * Math.sin(rad), long };
  });
  return (
    <svg className="weekday-wheel" data-planet={today === null ? undefined : WEEKDAY_PLANETS[today]!.glyph} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
      <circle className="weekday-wheel__ring" cx={C} cy={C} r={186} />
      <g className="weekday-wheel__ticks">
        {ticks.map((tick) => (
          <line key={tick.key} x1={tick.x1.toFixed(1)} y1={tick.y1.toFixed(1)} x2={tick.x2.toFixed(1)} y2={tick.y2.toFixed(1)} data-long={tick.long || undefined} />
        ))}
      </g>
      <circle className="weekday-wheel__ring weekday-wheel__ring--inner" cx={C} cy={C} r={NODE_R} />
      <polygon className="weekday-wheel__star" points={star.join(" ")} pathLength={1} />
      {today !== null && (
        <g className="weekday-wheel__centre" transform={`translate(${C - 24} ${C - 24}) scale(2)`}>
          {GLYPH_PATHS[WEEKDAY_PLANETS[today]!.glyph].map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      )}
      {WEEKDAY_PLANETS.map((planet, index) => {
        const { x, y } = point(index, NODE_R);
        const scale = 30 / 24;
        return (
          <g key={planet.slug} className="weekday-wheel__node" data-today={index === today || undefined}>
            {index === today && <circle className="weekday-wheel__halo" cx={x} cy={y} r={32} />}
            <circle className="weekday-wheel__disc" cx={x} cy={y} r={27} />
            <g className="weekday-wheel__glyph" transform={`translate(${(x - 12 * scale).toFixed(1)} ${(y - 12 * scale).toFixed(1)}) scale(${scale.toFixed(4)})`}>
              {GLYPH_PATHS[planet.glyph].map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
