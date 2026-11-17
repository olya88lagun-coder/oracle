import { useId } from "react";
import { discLitPath, PHASES, type PhaseId } from "@oracle/core/moon/visual";

type Props = { illumination: number; waxing: boolean; phase: PhaseId; size?: "large" | "mini"; showTicks?: boolean; animateIntro?: boolean };

const LARGE = { box: 400, radius: 150, ticksRadius: 182, tick: 4 } as const;
const MINI = { box: 100, radius: 44 } as const;

// Путь из @oracle/core/moon задаёт фазу и обрезает текстуру большого диска. Те же сведения доступны текстом рядом.
// Оформление — Codex (docs/design/codex-brief-luna-today.md)
export function MoonDisc({ illumination, waxing, phase, size = "large", showTicks = size === "large", animateIntro = true }: Props) {
  const scope = useId();
  const discClip = `${scope}-disc`;
  const phaseClip = `${scope}-phase`;
  const mini = size === "mini";
  const box = mini ? MINI.box : LARGE.box;
  const radius = mini ? MINI.radius : LARGE.radius;
  const center = box / 2;
  const lit = discLitPath(illumination, waxing, radius);
  const phaseAngle = PHASES.indexOf(phase) * 45 - 90;
  const texture = "/images/moon/moon-surface.webp";
  return (
    <svg className={mini ? "moon-disc__svg moon-mini" : "moon-disc__svg"} viewBox={`0 0 ${box} ${box}`} aria-hidden="true" focusable="false" data-intro={!mini && animateIntro ? "true" : undefined}>
      {!mini && (
        <defs>
          <clipPath id={discClip}><circle cx={center} cy={center} r={radius} /></clipPath>
          {lit && <clipPath id={phaseClip}><path transform={`translate(${center} ${center})`} d={lit} /></clipPath>}
        </defs>
      )}
      <circle className="moon-disc__base" cx={center} cy={center} r={radius} />
      {!mini && (
        <image className="moon-disc__earthshine" href={texture} x={center - radius} y={center - radius} width={radius * 2} height={radius * 2} clipPath={`url(#${discClip})`} />
      )}
      {lit && <path className="moon-disc__lit" transform={`translate(${center} ${center})`} d={lit} />}
      {!mini && lit && (
        <image className="moon-disc__relief" href={texture} x={center - radius} y={center - radius} width={radius * 2} height={radius * 2} clipPath={`url(#${phaseClip})`} />
      )}
      <circle className="moon-disc__rim" cx={center} cy={center} r={radius} />
      {showTicks && !mini && (
        <g className="moon-disc__ticks">
          <g transform={`rotate(${phaseAngle - 32.4} ${center} ${center})`}>
            <circle className="moon-disc__sweep" cx={center} cy={center} r={LARGE.ticksRadius} pathLength={1} strokeDasharray="0.09 1" />
          </g>
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
