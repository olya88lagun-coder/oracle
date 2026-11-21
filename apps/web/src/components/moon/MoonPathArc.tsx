// Путь Луны по небу в выбранный день: дуга от восхода до захода; если смотрим сегодняшний день и Луна сейчас над горизонтом — на дуге светится точка.
// Рисунок декоративный (aria-hidden): восход и заход продублированы текстом рядом
const RX = 100;
const RY = 52;
const CX = 120;
const BASE = 66;

export function MoonPathArc({ rise, set, progress }: { rise: string | null; set: string | null; progress: number | null }) {
  const angle = progress === null ? null : Math.PI * (1 - progress);
  return (
    <figure className="moon-arc">
      <svg className="moon-arc__svg" viewBox="0 0 240 84" aria-hidden="true" focusable="false">
        <line className="moon-arc__horizon" x1={8} x2={232} y1={BASE} y2={BASE} />
        <path className="moon-arc__path" d={`M ${CX - RX} ${BASE} A ${RX} ${RY} 0 0 1 ${CX + RX} ${BASE}`} fill="none" />
        {angle !== null && <circle className="moon-arc__dot" cx={(CX + RX * Math.cos(angle)).toFixed(1)} cy={(BASE - RY * Math.sin(angle)).toFixed(1)} r={6} />}
      </svg>
      <figcaption className="moon-arc__times">
        <span>Восход <strong>{rise ?? "—"}</strong></span>
        <span>Заход <strong>{set ?? "—"}</strong></span>
      </figcaption>
    </figure>
  );
}
