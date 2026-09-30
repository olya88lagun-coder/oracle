import Image from "next/image";
import type { CSSProperties } from "react";
import { BOARD_COLUMNS, BOARD_ROWS, CELLS, GOAL_CELL, cellPosition, getCell, isLilaCellNumber, lineForCell, type LilaCellNumber } from "./board-data";

export type LilaBoardVariant = "full" | "compact" | "locator";

type BoardProps = {
  current: number;
  trail?: number[];
  variant?: LilaBoardVariant;
};

// Поле нарисовано на холсте 1920×1720: клетки по 200 px и поле 60 px вокруг под рамку (docs/design/codex-brief-lila-board.md).
// Номера, фишка и след выводятся поверх картинки по тем же координатам
const CANVAS = { width: 1920, height: 1720, margin: 60, cell: 200 } as const;

const BASE_SRC = "/lila/board-base.webp";
const PATHS_SRC = { full: "/lila/board-paths.svg", compact: "/lila/board-paths-compact.svg" } as const;

type Point = { x: number; y: number };

function centerPoint(number: LilaCellNumber): Point {
  const { col, row } = cellPosition(number);
  return { x: CANVAS.margin + col * CANVAS.cell + CANVAS.cell / 2, y: CANVAS.margin + row * CANVAS.cell + CANVAS.cell / 2 };
}

export function Board({ current, trail = [], variant = "full" }: BoardProps) {
  const safeCurrent = isLilaCellNumber(current) ? current : 1;
  const safeTrail = trail.filter(isLilaCellNumber);
  const currentPoint = centerPoint(safeCurrent);
  const classes = ["lila-board", `lila-board--${variant}`].join(" ");
  const style = {
    "--lila-token-x": ((currentPoint.x / CANVAS.width) * 100).toFixed(3),
    "--lila-token-y": ((currentPoint.y / CANVAS.height) * 100).toFixed(3),
  } as CSSProperties;

  return (
    <figure className={classes} style={style}>
      <div className="lila-board__paper">
        <Image className="lila-board__base" src={BASE_SRC} alt="" fill unoptimized sizes="(min-width: 900px) 640px, 100vw" />
        {variant !== "locator" ? <Image className="lila-board__art" src={PATHS_SRC[variant]} alt="" fill unoptimized sizes="(min-width: 900px) 640px, 100vw" /> : null}
        {safeTrail.length > 1 ? (
          <svg className="lila-board__trail-layer" viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`} aria-hidden="true" focusable="false">
            <path className="lila-board__trail" d={trailPath(safeTrail)} />
          </svg>
        ) : null}

        {/* Названия и переходы читает список ниже: сами клетки для экранных программ скрыты */}
        <div className="lila-board__cells" aria-hidden="true">
          {CELLS.map((cell) => {
            const position = cellPosition(cell.number);
            const tipX = position.col < 2 ? "start" : position.col > BOARD_COLUMNS - 3 ? "end" : "center";
            const tipY = position.row < 2 ? "below" : "above";
            return (
              <div
                key={cell.number}
                className={[
                  "lila-board__cell",
                  cell.number === safeCurrent ? "lila-board__cell--current" : "",
                  cell.number === GOAL_CELL ? "lila-board__cell--goal" : "",
                  safeTrail.includes(cell.number) ? "lila-board__cell--trail" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ gridColumn: position.col + 1, gridRow: position.row + 1 }}
                data-name={cell.name}
                data-tip-x={tipX}
                data-tip-y={tipY}
              >
                <span className="lila-board__number">{cell.number}</span>
              </div>
            );
          })}
        </div>

        <span className="lila-board__token" aria-hidden="true" />
      </div>

      {variant !== "locator" ? (
        <figcaption className="lila-board__legend">
          <span>
            <i className="lila-board__legend-line lila-board__legend-line--arrow" aria-hidden="true" />
            стрела
          </span>
          <span>
            <i className="lila-board__legend-line lila-board__legend-line--snake" aria-hidden="true" />
            змея
          </span>
          <span>
            <i className="lila-board__legend-dot lila-board__legend-dot--current" aria-hidden="true" />
            текущая клетка
          </span>
          <span>
            <i className="lila-board__legend-dot lila-board__legend-dot--goal" aria-hidden="true" />
            цель — 68
          </span>
        </figcaption>
      ) : null}

      <ol className="visually-hidden">
        {CELLS.map((cell) => (
          <li key={`sr-${cell.number}`}>{cellScreenReaderText(cell.number, safeCurrent)}</li>
        ))}
      </ol>
    </figure>
  );
}

function trailPath(trail: LilaCellNumber[]) {
  return trail
    .map((number, index) => {
      const point = centerPoint(number);
      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    })
    .join(" ");
}

function cellLabel(number: LilaCellNumber) {
  const cell = getCell(number);
  const relation = lineForCell(number);
  const relationText = relation ? `, ${relation.kind === "snake" ? "змея" : "стрела"} на ${relation.to}` : "";
  const goalText = number === GOAL_CELL ? ", цель игры" : "";

  return `${number}, ${cell.name}${relationText}${goalText}`;
}

function cellScreenReaderText(number: LilaCellNumber, current: LilaCellNumber) {
  const currentText = number === current ? " — вы здесь" : "";
  return `${cellLabel(number)}${currentText}`;
}

export const BOARD_GRID = { columns: BOARD_COLUMNS, rows: BOARD_ROWS } as const;
