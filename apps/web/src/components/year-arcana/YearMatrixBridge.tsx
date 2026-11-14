"use client";

import { arcanumByNumber } from "@oracle/content";
import { calculateMatrix, parseBirthDate } from "@oracle/core";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MatrixDiagram } from "@/components/matrix/MatrixDiagram";
import { MATRIX_PATH } from "@/lib/arcana-paths";
import { sessionStore } from "@/lib/matrix-save";
import { FREE_MATRIX_CTA, FREE_RESULT_TERMS } from "@/lib/practices";
import { KEY_POINTS } from "@/lib/matrix-view";
import { prepareMatrixHandoff } from "@/lib/year-arcana";
import { reachYearGoal } from "@/lib/year-arcana-analytics";

// Мост из результата в матрицу: аркан года считается от центра матрицы, поэтому показываем матрицу целиком и называем три ключевых аркана.
// Названия видны сразу, значения — в бесплатном расчёте; дата переходит в матрицу через вкладку (prepareMatrixHandoff), как у нижнего блока.
// Диаграмма монтируется, когда блок виден: её «сборка» (анимация) проигрывается на глазах, а не под экраном
export function YearMatrixBridge({ iso }: { iso: string }) {
  const matrix = useMemo(() => {
    const date = parseBirthDate(iso, new Date());
    return date ? calculateMatrix(date) : null;
  }, [iso]);
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = box.current;
    if (!node || seen) return;
    if (typeof IntersectionObserver === "undefined") return setSeen(true);
    const observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && setSeen(true), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  if (!matrix) return null;
  return (
    <aside className="year-bridge stack" aria-labelledby="year-bridge-title">
      <p className="eyebrow">Откуда взялся ваш аркан</p>
      <h3 id="year-bridge-title">Он вырос из вашей матрицы</h3>
      <p>Аркан года считается от Центра вашей матрицы. Вот она целиком — три ключевые позиции открываются бесплатно.</p>
      <div ref={box} className="year-bridge__diagram">
        {seen ? <MatrixDiagram matrix={matrix} /> : <div className="year-bridge__placeholder" aria-hidden="true" />}
      </div>
      <ul className="year-bridge__keys" aria-label="Три ключевые позиции">
        {KEY_POINTS.map(({ point, label }) => (
          <li key={point}>
            <span>{label}</span>
            <strong>{arcanumByNumber(matrix[point]).name}</strong>
          </li>
        ))}
      </ul>
      <p>
        <Link
          className="button button--lavender"
          href={MATRIX_PATH}
          prefetch={false}
          onClick={() => {
            prepareMatrixHandoff(sessionStore(), iso);
            reachYearGoal("year_arcana_to_matrix");
          }}
        >
          {FREE_MATRIX_CTA}
        </Link>
      </p>
      <p className="muted">Дата уже подставлена, расчёт займёт секунду. {FREE_RESULT_TERMS}.</p>
    </aside>
  );
}
