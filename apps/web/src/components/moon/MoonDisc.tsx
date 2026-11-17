import { discLitPath, PHASES, type PhaseId } from "@oracle/core/moon";

type Props = { illumination: number; waxing: boolean; phase: PhaseId; size?: "large" | "mini"; showTicks?: boolean };

const LARGE = { box: 400, radius: 150, ticksRadius: 182, tick: 4 } as const;
const MINI = { box: 100, radius: 44 } as const;

// Диск Луны по точной фазе: освещённая часть — путь из @oracle/core/moon, а не набор картинок. Декоративный: те же сведения есть текстом рядом.
// Оформление — Codex (docs/design/codex-brief-luna-today.md)
export function MoonDisc({ illumination, waxing, phase, size = "large", showTicks = size === "large" }: Props) {
  const mini = size === "mini";
  const box = mini ? MINI.box : LARGE.box;
  const radius = mini ? MINI.radius : LARGE.radius;
  const center = box / 2;
  const lit = discLitPath(illumination, waxing, radius);
  return (
    <svg className={mini ? "moon-disc__svg moon-mini" : "moon-disc__svg"} viewBox={`0 0 ${box} ${box}`} aria-hidden="true" focusable="false">
      <circle className="moon-disc__base" cx={center} cy={center} r={radius} />
      {lit && <path className="moon-disc__lit" transform={`translate(${center} ${center})`} d={lit} />}
      <circle className="moon-disc__rim" cx={center} cy={center} r={radius} />
      {showTicks && !mini && (
        <g className="moon-disc__ticks">
          {PHASES.map((id, index) => {
            // Новолуние сверху, дальше по часовой стрелке с шагом 45°
            const angle = ((index * 45 - 90) * Math.PI) / 180;
            return <circle key={id} className={`moon-disc__tick${id === phase ? " is-current" : ""}`} data-phase={id} cx={Math.round((center + LARGE.ticksRadius * Math.cos(angle)) * 100) / 100} cy={Math.round((center + LARGE.ticksRadius * Math.sin(angle)) * 100) / 100} r={LARGE.tick} />;
          })}
        </g>
      )}
    </svg>
  );
}
