import type { Matrix } from "@oracle/core";
import type { CSSProperties } from "react";
import { DIAGRAM_LINES, DIAGRAM_POINTS, DIAGRAM_SIZE, KEY_POINTS, pointRows, pointTitle } from "@/lib/matrix-view";

const byPoint = new Map(DIAGRAM_POINTS.map((p) => [p.point, p]));
// Порядок вспышки ключевых точек совпадает с порядком карточек: Личность, Центр, Задача — «Задача» последняя
const KEY_ORDER: readonly string[] = KEY_POINTS.map(({ point }) => point);

export function MatrixDiagram({ matrix }: { matrix: Matrix }) {
  return (
    <figure className="matrix-diagram">
      <svg viewBox={`0 0 ${DIAGRAM_SIZE} ${DIAGRAM_SIZE}`} role="img" aria-labelledby="matrix-diagram-title">
        <title id="matrix-diagram-title">Диаграмма матрицы судьбы: все точки с номерами арканов. Подробная таблица — ниже.</title>
        <circle className="matrix-diagram__ring" cx={DIAGRAM_SIZE / 2} cy={DIAGRAM_SIZE / 2} r={DIAGRAM_SIZE / 2 - 18} />
        {/* pathLength=1 и --i — для «сборки» диаграммы в globals.css: линии прочерчиваются по очереди, ключевые точки вспыхивают последними */}
        {DIAGRAM_LINES.map(([from, to], index) => {
          const a = byPoint.get(from)!;
          const b = byPoint.get(to)!;
          return <line key={`${from}-${to}`} className="matrix-diagram__line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} pathLength={1} style={{ "--i": index } as CSSProperties} />;
        })}
        {DIAGRAM_POINTS.map(({ point, x, y, r, tier }, index) => (
          <g key={point} className={`matrix-point matrix-point--${tier}`} style={{ "--i": index, "--k": KEY_ORDER.indexOf(point) } as CSSProperties}>
            <title>{pointTitle(point, matrix[point])}</title>
            <circle cx={x} cy={y} r={r} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
              {matrix[point]}
            </text>
          </g>
        ))}
      </svg>
      {/* Таблица для скринридеров обёрнута: сама <table> не сжимается до 1px и давала горизонтальную прокрутку на 375px */}
      <div className="visually-hidden">
        <table>
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
      </div>
    </figure>
  );
}
