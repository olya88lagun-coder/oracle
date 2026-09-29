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
          {ARROWS.map((line, index) => (
            <g key={`arrow-${line.from}-${line.to}`} className="lila-board__arrow">
              <path d={arrowPath(line, index % 2 === 0 ? 16 : -16)} markerEnd={`url(#${arrowMarkerId})`} />
            </g>
          ))}
          {SNAKES.map((line, index) => (
            <Snake key={`snake-${line.from}-${line.to}`} line={line} tone={index % 3} bend={index % 2 === 0 ? 34 : -34} />
          ))}
        </svg>

        {/* Названия и переходы читает список ниже: сами клетки для экранных программ скрыты */}
        <div className="lila-board__cells" aria-hidden="true">
          {CELLS.map((cell) => {
            const relation = lineForCell(cell.number);
            const isCurrent = cell.number === safeCurrent;
            const isGoal = cell.number === GOAL_CELL;
            const isTrail = safeTrail.includes(cell.number);
            const position = cellPosition(cell.number);
            const tipX = position.col < 2 ? "start" : position.col > BOARD_COLUMNS - 3 ? "end" : "center";
            const tipY = position.row < 2 ? "below" : "above";

            return (
              <div
                key={cell.number}
                className={[
                  "lila-board__cell",
                  isCurrent ? "lila-board__cell--current" : "",
                  isGoal ? "lila-board__cell--goal" : "",
                  isTrail ? "lila-board__cell--trail" : "",
                  relation ? `lila-board__cell--${relation.kind}` : "",
                  (position.row + position.col) % 2 === 1 ? "lila-board__cell--alt" : "",
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

const SNAKE_WAVES = 3.5;
const SNAKE_AMPLITUDE = 9;
const SNAKE_STEPS = 32;
const HEAD_INDEX = 3;

// Змея — волнистая линия от головы (клетка змеи) к хвосту; волна затухает к концам, чтобы линия выглядела как тело, а не как помеха
function snakePoints(line: LilaConnection, bend: number): Point[] {
  const from = centerPoint(line.from);
  const to = centerPoint(line.to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  return Array.from({ length: SNAKE_STEPS + 1 }, (_, step) => {
    const t = step / SNAKE_STEPS;
    const arc = 4 * t * (1 - t) * bend;
    const wave = Math.sin(t * Math.PI * 2 * SNAKE_WAVES) * SNAKE_AMPLITUDE * Math.sin(Math.PI * t);
    const offset = arc + wave;
    return { x: from.x + dx * t + normal.x * offset, y: from.y + dy * t + normal.y * offset };
  });
}

function Snake({ line, tone, bend }: { line: LilaConnection; tone: number; bend: number }) {
  const points = snakePoints(line, bend);
  // Голова стоит рядом с клеткой змеи, а не под номером, и смотрит на неё
  const head = points[HEAD_INDEX]!;
  const toward = points[HEAD_INDEX - 2]!;
  const angle = (Math.atan2(toward.y - head.y, toward.x - head.x) * 180) / Math.PI;
  const d = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  return (
    <g className={`lila-board__snake lila-board__snake--${tone}`}>
      <path className="lila-board__snake-body" d={d} />
      <g transform={`translate(${head.x.toFixed(1)} ${head.y.toFixed(1)}) rotate(${angle.toFixed(1)})`}>
        <ellipse className="lila-board__snake-head" cx="3" cy="0" rx="12" ry="8.5" />
        <circle className="lila-board__snake-eye" cx="8" cy="-3.6" r="1.7" />
        <circle className="lila-board__snake-eye" cx="8" cy="3.6" r="1.7" />
      </g>
    </g>
  );
}

function centerPoint(number: LilaCellNumber): Point {
  const position = cellPosition(number);

  return {
    x: position.col * CELL_SIZE + CELL_SIZE / 2,
    y: position.row * CELL_SIZE + CELL_SIZE / 2,
  };
}

const ARROW_START = 0.11;
const ARROW_END = 0.84;
const ARROW_STEPS = 24;

// Стрела идёт по лёгкой дуге и не доходит до центров клеток: начало и наконечник остаются видны рядом с номерами, а не под ними
function arrowPath(line: LilaConnection, bend: number) {
  const from = centerPoint(line.from);
  const to = centerPoint(line.to);
  const control = { x: (from.x + to.x) / 2 + bend, y: (from.y + to.y) / 2 - Math.abs(bend) * 0.35 };
  return Array.from({ length: ARROW_STEPS + 1 }, (_, step) => {
    const t = ARROW_START + ((ARROW_END - ARROW_START) * step) / ARROW_STEPS;
    const u = 1 - t;
    const x = u * u * from.x + 2 * u * t * control.x + t * t * to.x;
    const y = u * u * from.y + 2 * u * t * control.y + t * t * to.y;
    return `${step === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
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
