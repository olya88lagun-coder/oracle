import type { Matrix } from "@oracle/core";
import { DIAGRAM_LINES, DIAGRAM_POINTS, DIAGRAM_SIZE, pointRows, pointTitle } from "@/lib/matrix-view";

const byPoint = new Map(DIAGRAM_POINTS.map((p) => [p.point, p]));

export function MatrixDiagram({ matrix }: { matrix: Matrix }) {
  return (
    <figure className="matrix-diagram">
      <svg viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`} role="img" aria-labelledby="matrix-diagram-title">
        <title id="matrix-diagram-title">Диаграмма матрицы судьбы: все точки с номерами арканов. Подробная таблица — ниже.</title>
        <circle className="matrix-diagram__ring" cx={DIAGRAM_SIZE / 2} cy={DIAGRAM_SIZE / 2} r={DIAGRAM_SIZE / 2 - 18} />
        {DIAGRAM_LINES.map(([from, to]) => {
          const a = byPoint.get(from)!;
          const b = byPoint.get(to)!;
          return <line key={`${from}-${to}`} className="matrix-diagram__line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
        {DIAGRAM_POINTS.map(({ point, x, y, r, tier }) => (
          <g key={point} className={`matrix-point matrix-point--${tier}`}>
            <title>{pointTitle(point, matrix[point])}</title>
            <circle cx={x} cy={y} r={r} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
              {matrix[point]}
            </text>
          </g>
        ))}
      </svg>
      <table className="visually-hidden">
        <caption>Точки матрицы</caption>
        <thead>
          <tr>
            <th scope="col">Точка</th>
            <th scope="col">Аркан</th>
          </tr>
        </thead>
        <tbody>
          {pointRows(matrix).map((row) => (
            <tr key={row.point}>
              <th scope="row">{row.label}</th>
              <td>
                {row.value}, {row.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
