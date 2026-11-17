import type { Matrix, MatrixPoint } from "@oracle/core";
import { arcanumByNumber } from "@oracle/content";
import Link from "next/link";
import { arcanumPath } from "@/lib/arcana-paths";
import { KEY_POINTS } from "@/lib/matrix-view";

type KeyPoint = (typeof KEY_POINTS)[number]["point"];

export const FIRST_KEY_POINT: KeyPoint = KEY_POINTS[0].point;

export function isKeyPoint(point: MatrixPoint): point is KeyPoint {
  return KEY_POINTS.some((key) => key.point === point);
}

type Props = { matrix: Matrix; selected: KeyPoint; onSelect: (point: KeyPoint) => void };

// Короткая трактовка выбранной ключевой позиции прямо под схемой: полный текст остаётся в карточках ниже
export function MatrixFocus({ matrix, selected, onSelect }: Props) {
  const current = KEY_POINTS.find(({ point }) => point === selected)!;
  const arcanum = arcanumByNumber(matrix[selected]);
  return (
    <div className="matrix-focus card stack">
      <div className="matrix-focus__tabs" role="group" aria-label="Ключевые позиции">
        {KEY_POINTS.map(({ point, label }) => (
          <button key={point} type="button" className="matrix-focus__tab" aria-pressed={point === selected} onClick={() => onSelect(point)}>
            {label}
          </button>
        ))}
      </div>
      <div className="matrix-focus__body stack" aria-live="polite">
        <p className="eyebrow">
          {current.label} · точка {selected}
        </p>
        <p className="matrix-focus__name">
          <span className="matrix-focus__number">{arcanum.number}</span> {arcanum.name}
        </p>
        <p>{arcanum[current.key][0]}</p>
        <Link className="touch-link" href={arcanumPath(arcanum)}>
          Читать об аркане «{arcanum.name}» целиком
        </Link>
      </div>
    </div>
  );
}
