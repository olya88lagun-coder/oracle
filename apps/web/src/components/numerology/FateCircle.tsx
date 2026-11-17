const NODES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 92;

// Мастер-число (11, 22, 33) подсвечивает цифру, к которой сводится: 11 → 2, 22 → 4, 33 → 6
export const fateRoot = (value: number): number => (value > 9 ? [...String(value)].reduce((sum, digit) => sum + Number(digit), 0) : value);

const point = (n: number) => {
  const angle = ((-90 + (n - 1) * 40) * Math.PI) / 180;
  return { x: Math.round((CENTER + RADIUS * Math.cos(angle)) * 10) / 10, y: Math.round((CENTER + RADIUS * Math.sin(angle)) * 10) / 10 };
};

// Круг цифр 1–9 с подсвеченным числом судьбы: рисунок к результату, сам результат (цифра и расчёт) стоит текстом рядом, поэтому круг скрыт от скринридеров
export function FateCircle({ value }: { value: number }) {
  const active = fateRoot(value);
  return (
    <svg className="fate-circle" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false" data-active={active}>
      <circle className="fate-circle__ring" cx={CENTER} cy={CENTER} r={RADIUS} />
      {NODES.map((n) => {
        const { x, y } = point(n);
        return <line key={`spoke-${n}`} className={n === active ? "fate-circle__spoke is-active" : "fate-circle__spoke"} x1={CENTER} y1={CENTER} x2={x} y2={y} />;
      })}
      {NODES.map((n) => {
        const { x, y } = point(n);
        return (
          <g key={n} className={n === active ? "fate-circle__node is-active" : "fate-circle__node"}>
            <circle cx={x} cy={y} r={n === active ? 20 : 15} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
              {n}
            </text>
          </g>
        );
      })}
      <circle className="fate-circle__core" cx={CENTER} cy={CENTER} r={5} />
    </svg>
  );
}
