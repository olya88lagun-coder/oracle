import { LILA_GOAL_CELL, lilaQuestionIndex, lilaVisitCounts } from "@oracle/core";
import type { LilaCell } from "@oracle/content/lila";
import type { GameView } from "./lila-view";

export type Turn = {
  kind: "wait" | "entry" | "step" | "goal";
  roll: number;
  landed: LilaCell | null; // клетка падения (голова змеи, начало стрелы или обычная клетка)
  arrival: LilaCell | null; // итоговая клетка, если она отличается от клетки падения
  transitionText: string | null;
  visit: number; // какой по счёту визит на итоговую клетку
  question: string;
  previousNote: string | null; // запись с прошлого визита на итоговую клетку
};

const LAST_CELL = 72;

function waitQuestion(position: number, roll: number): string {
  if (position === 0) return `Выпало ${roll}. Для начала игры нужна шестёрка. Что вы замечаете, пока ждёте?`;
  const left = (position < LILA_GOAL_CELL ? LILA_GOAL_CELL : LAST_CELL) - position;
  return `Выпало ${roll}, а до конца пути ${left}. Что вы замечаете, пока ждёте нужного броска?`;
}

export function describeTurn(view: GameView, index: number, cellOf: (n: number) => LilaCell): Turn {
  const move = view.moves[index]!;
  if (move.wasted) return { kind: "wait", roll: move.roll, landed: null, arrival: null, transitionText: null, visit: 0, question: waitQuestion(move.from, move.roll), previousNote: null };

  const visits = lilaVisitCounts(view.moves.slice(0, index + 1));
  const landed = cellOf(move.landed);
  const arrival = move.to !== move.landed ? cellOf(move.to) : null;
  const finalCell = arrival ?? landed;
  const visit = visits.get(finalCell.number) ?? 1;
  const previous = view.moves.slice(0, index).findLast((earlier) => !earlier.wasted && earlier.note && (earlier.to === finalCell.number || earlier.landed === finalCell.number));
  return {
    kind: move.entered ? "entry" : move.reachedGoal ? "goal" : "step",
    roll: move.roll,
    landed,
    arrival,
    transitionText: arrival ? landed.transition : null,
    visit,
    question: finalCell.questions[lilaQuestionIndex(visit)],
    previousNote: visit > 1 ? (previous?.note ?? null) : null,
  };
}

const plural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  return mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? few : many;
};

// «14 ходов · 3 змеи · 1 стрела · открыто клеток 11» — строка под заголовком истории партии
export function describeGameFacts(view: GameView): string {
  const snakes = view.moves.filter((move) => move.transition === "snake").length;
  const arrows = view.moves.filter((move) => move.transition === "arrow").length;
  return [
    `${view.movesCount} ${plural(view.movesCount, "ход", "хода", "ходов")}`,
    `${snakes} ${plural(snakes, "змея", "змеи", "змей")}`,
    `${arrows} ${plural(arrows, "стрела", "стрелы", "стрел")}`,
    `открыто клеток ${openedCells(view)}`,
  ].join(" · ");
}

// «Выпало 6 — Рождение.» — подпись у кубика: видна и на вкладке поля, где панели хода нет
export function rollSummary(turn: Turn): string {
  if (turn.kind === "wait") return `Выпало ${turn.roll} — пауза.`;
  const finalCell = turn.arrival ?? turn.landed;
  return finalCell ? `Выпало ${turn.roll} — ${finalCell.name}.` : `Выпало ${turn.roll}.`;
}

export const openedCells = (view: GameView): number => lilaVisitCounts(view.moves.map((move) => ({ landed: move.landed, to: move.to, wasted: move.wasted }))).size;

export function trailOf(view: GameView): number[] {
  const cells: number[] = [];
  for (const move of view.moves) {
    if (move.wasted) continue;
    for (const cell of move.landed === move.to ? [move.to] : [move.landed, move.to]) if (cells.at(-1) !== cell) cells.push(cell);
  }
  return cells;
}
