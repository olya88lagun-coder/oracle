import { useId } from "react";
import type { CSSProperties } from "react";
import {
  ARROWS,
  BOARD_COLUMNS,
  BOARD_ROWS,
  CELLS,
  GOAL_CELL,
  SNAKES,
  cellPosition,
  getCell,
  isLilaCellNumber,
  lineForCell,
  type LilaCellNumber,
  type LilaConnection,
} from "./board-data";

export type LilaBoardVariant = "full" | "compact" | "locator";

type BoardProps = {
  current: number;
  trail?: number[];
  variant?: LilaBoardVariant;
};

type Point = {
  x: number;
  y: number;
};

const CELL_SIZE = 100;
const BOARD_WIDTH = BOARD_COLUMNS * CELL_SIZE;
const BOARD_HEIGHT = BOARD_ROWS * CELL_SIZE;

export function Board({ current, trail = [], variant = "full" }: BoardProps) {
  const arrowMarkerId = `lila-arrow-${useId().replace(/:/g, "")}`;
  const safeCurrent = isLilaCellNumber(current) ? current : 1;
  const safeTrail = trail.filter(isLilaCellNumber);
  const currentPoint = centerPoint(safeCurrent);
  const showNames = variant === "full";
  const isLocator = variant === "locator";
  const classes = ["lila-board", `lila-board--${variant}`].join(" ");

  const style = {
    "--lila-token-x": `${(currentPoint.x / BOARD_WIDTH) * 100}%`,
    "--lila-token-y": `${(currentPoint.y / BOARD_HEIGHT) * 100}%`,
  } as CSSProperties;

  return (
    <figure className={classes} style={style}>
      <div className="lila-board__paper">
        <svg className="lila-board__paths" viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} aria-hidden="true" focusable="false">
          <defs>
            <marker id={arrowMarkerId} viewBox="0 0 10 10" refX="8.4" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          {safeTrail.length > 1 ? <path className="lila-board__trail" d={trailPath(safeTrail)} /> : null}
          {ARROWS.map((line) => (
            <path
              key={`arrow-${line.from}-${line.to}`}
              className="lila-board__arrow"
              d={connectionPath(line, 0)}
              markerEnd={`url(#${arrowMarkerId})`}
            />
          ))}
          {SNAKES.map((line, index) => (
            <g key={`snake-${line.from}-${line.to}`} className={`lila-board__snake lila-board__snake--${index % 3}`}>
              <path className="lila-board__snake-body" d={connectionPath(line, index % 2 === 0 ? 42 : -42)} />
              <SnakeHead at={centerPoint(line.from)} />
              <SnakeTail at={centerPoint(line.to)} />
            </g>
          ))}
        </svg>

        <div className="lila-board__cells" aria-hidden={isLocator ? "true" : undefined}>
          {CELLS.map((cell) => {
            const position = cellPosition(cell.number);
            const relation = lineForCell(cell.number);
            const isCurrent = cell.number === safeCurrent;
            const isGoal = cell.number === GOAL_CELL;
            const isTrail = safeTrail.includes(cell.number);
            const shouldShowName = showNames && cell.name.length <= 18;
            const label = cellLabel(cell.number);

            return (
              <div
                key={cell.number}
                className={[
                  "lila-board__cell",
                  isCurrent ? "lila-board__cell--current" : "",
                  isGoal ? "lila-board__cell--goal" : "",
                  isTrail ? "lila-board__cell--trail" : "",
                  relation ? `lila-board__cell--${relation.kind}` : "",
                  shouldShowName ? "" : "lila-board__cell--number-only",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ gridColumn: position.col + 1, gridRow: position.row + 1 }}
                tabIndex={shouldShowName ? undefined : 0}
                aria-label={label}
                data-name={cell.name}
                title={cell.name}
              >
                <span className="lila-board__number">{cell.number}</span>
                {shouldShowName ? <span className="lila-board__name">{cell.name}</span> : null}
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

function SnakeHead({ at }: { at: Point }) {
  return (
    <g className="lila-board__snake-head" transform={`translate(${at.x - 12} ${at.y + 16}) rotate(-18)`}>
      <path d="M 0 7 C 6 -4 23 -3 30 7 C 22 17 7 18 0 7 Z" />
      <circle cx="21" cy="5.5" r="1.7" />
    </g>
  );
}

function SnakeTail({ at }: { at: Point }) {
  return <path className="lila-board__snake-tail" d={`M ${at.x + 18} ${at.y - 14} q 22 -10 34 8`} />;
}

function centerPoint(number: LilaCellNumber): Point {
  const position = cellPosition(number);

  return {
    x: position.col * CELL_SIZE + CELL_SIZE / 2,
    y: position.row * CELL_SIZE + CELL_SIZE / 2,
  };
}

function connectionPath(line: LilaConnection, bend: number) {
  const from = centerPoint(line.from);
  const to = centerPoint(line.to);
  const midX = (from.x + to.x) / 2 + bend;
  const midY = (from.y + to.y) / 2 - Math.abs(bend) * 0.35;

  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
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
