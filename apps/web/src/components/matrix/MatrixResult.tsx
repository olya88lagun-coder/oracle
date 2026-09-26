import type { Matrix } from "@oracle/core";
import { arcanumByNumber, SECTION_TITLES } from "@oracle/content";
import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { arcanumPath } from "@/lib/arcana-paths";
import { KEY_POINTS, pointTitle, positionRows, PURPOSES } from "@/lib/matrix-view";
import { MatrixDiagram } from "./MatrixDiagram";

type Props = { matrix: Matrix; dateLabel: string; headingRef?: Ref<HTMLHeadingElement>; actions?: ReactNode };

export function MatrixResult({ matrix, dateLabel, headingRef, actions }: Props) {
  const center = arcanumByNumber(matrix.E);
  return (
    <section className="matrix-result stack" aria-labelledby="matrix-result-title">
      <p className="eyebrow eyebrow--line">Ваша матрица · {dateLabel}</p>
      <h2 id="matrix-result-title" className="matrix-result__title" tabIndex={-1} ref={headingRef}>
        Ваша матрица судьбы
      </h2>

      <div className="matrix-result__top">
        <MatrixDiagram matrix={matrix} />
        {/* Ruling 1: a visible compact list of positions next to the diagram (A–E plus the love/money line) */}
        <div className="matrix-positions card stack">
          <h3>Позиции</h3>
          <ul className="matrix-positions__list">
            {positionRows(matrix).map((row) => (
              <li key={row.point}>{pointTitle(row.point, row.value)}</li>
            ))}
          </ul>
        </div>
      </div>

      <ul className="matrix-keys" aria-label="Ключевые точки">
        {KEY_POINTS.map(({ point, key, label }) => {
          const arcanum = arcanumByNumber(matrix[point]);
          return (
            <li key={point} className="card matrix-key stack">
              <div className="matrix-key__head">
                <span className="matrix-key__number" aria-hidden="true">
                  {arcanum.number}
                </span>
                <div>
                  <p className="eyebrow">
                    {label} · точка {point}
                  </p>
                  <h3>
                    <span className="visually-hidden">Аркан {arcanum.number}, </span>
                    {arcanum.name}
                  </h3>
                </div>
              </div>
              {arcanum[key].map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <Link href={arcanumPath(arcanum)}>Подробнее об аркане «{arcanum.name}»</Link>
            </li>
          );
        })}
      </ul>

      <div className="matrix-today">
        <div className="card stack">
          <p className="eyebrow">{SECTION_TITLES.action}</p>
          <p>{center.action}</p>
        </div>
        <div className="card stack">
          <p className="eyebrow">{SECTION_TITLES.question}</p>
          <p className="arcanum-question">{center.question}</p>
        </div>
      </div>

      <section className="card stack" aria-labelledby="matrix-purposes">
        <h3 id="matrix-purposes">Предназначения</h3>
        {/* Ruling 1: three small cards instead of a table — same data, same links */}
        <ul className="matrix-purposes">
          {PURPOSES.map(({ point, label }) => {
            const arcanum = arcanumByNumber(matrix[point]);
            return (
              <li key={point} className="card matrix-purpose stack">
                <p className="eyebrow">{label}</p>
                <p>
                  {arcanum.number} · {arcanum.name}
                </p>
                <Link href={arcanumPath(arcanum)}>об аркане</Link>
              </li>
            );
          })}
        </ul>
      </section>

      {actions}

      <aside className="card matrix-next">
        <span className="tag">Скоро</span>
        <p>Лила — игра с вашим вопросом</p>
      </aside>
    </section>
  );
}
