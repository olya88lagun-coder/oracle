export const LILA_CELL_COUNT = 72;
export const LILA_GOAL_CELL = 68;
export const LILA_ENTRY_ROLL = 6;
export const LILA_MAX_MOVES = 120;
export const LILA_MIN_MOVES_TO_FINISH = 10;
export const LILA_INTENTION_MAX_CHARS = 300;
export const LILA_NOTE_MAX_CHARS = 500;
const DICE_MAX = 6;
const VISITS_BEFORE_REPEAT_QUESTIONS = 3;

// Классическая схема Хариша Джохари (утверждена 2026-09-24): голова змеи → хвост, начало стрелы → конец
export const LILA_SNAKES: Readonly<Record<number, number>> = { 12: 8, 16: 4, 24: 7, 29: 6, 44: 9, 52: 35, 55: 3, 61: 13, 63: 2, 72: 51 };
export const LILA_ARROWS: Readonly<Record<number, number>> = { 10: 23, 17: 69, 20: 32, 22: 60, 27: 41, 28: 50, 37: 66, 45: 67, 46: 62, 54: 68 };

export type LilaTransition = "none" | "snake" | "arrow";
export type LilaRollResult = {
  roll: number;
  from: number;
  landed: number;
  to: number;
  transition: LilaTransition;
  entered: boolean;
  reachedGoal: boolean;
  wasted: boolean;
};
export type LilaMoveCells = Pick<LilaRollResult, "landed" | "to" | "wasted">;

export const isLilaRoll = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= DICE_MAX;

function jump(cell: number): { to: number; transition: LilaTransition } {
  const snake = LILA_SNAKES[cell];
  if (snake !== undefined) return { to: snake, transition: "snake" };
  const arrow = LILA_ARROWS[cell];
  if (arrow !== undefined) return { to: arrow, transition: "arrow" };
  return { to: cell, transition: "none" };
}

// Позиция 0 — «ещё не родились». Цель 68 — только точным броском; выше цели (69–72, туда ведёт стрела 17→69) идём вперёд до 72
export function applyLilaRoll(position: number, roll: number): LilaRollResult {
  if (!Number.isInteger(position) || position < 0 || position > LILA_CELL_COUNT || position === LILA_GOAL_CELL) throw new RangeError(`position ${position} is not playable`);
  if (!isLilaRoll(roll)) throw new RangeError(`roll ${String(roll)} is not 1-6`);

  const stay: LilaRollResult = { roll, from: position, landed: position, to: position, transition: "none", entered: false, reachedGoal: false, wasted: true };
  if (position === 0) return roll === LILA_ENTRY_ROLL ? { ...stay, landed: 1, to: 1, entered: true, wasted: false } : stay;

  const target = position + roll;
  const limit = position < LILA_GOAL_CELL ? LILA_GOAL_CELL : LILA_CELL_COUNT;
  if (target > limit) return stay;
  const { to, transition } = jump(target);
  return { roll, from: position, landed: target, to, transition, entered: false, reachedGoal: to === LILA_GOAL_CELL, wasted: false };
}

// Посещение — приход на клетку падения и на итоговую клетку (после змеи или стрелы); пустой ход ничего не открывает
export function lilaVisitCounts(moves: readonly LilaMoveCells[]): Map<number, number> {
  const visits = new Map<number, number>();
  const add = (cell: number) => visits.set(cell, (visits.get(cell) ?? 0) + 1);
  for (const move of moves) {
    if (move.wasted) continue;
    add(move.landed);
    if (move.to !== move.landed) add(move.to);
  }
  return visits;
}

// Первый визит — первый вопрос клетки, второй — второй, третий и дальше — третий
export const lilaQuestionIndex = (visits: number): 0 | 1 | 2 => (Math.min(Math.max(visits, 1), VISITS_BEFORE_REPEAT_QUESTIONS) - 1) as 0 | 1 | 2;

export function replayLila(rolls: readonly number[]): { position: number; results: LilaRollResult[] } {
  let position = 0;
  const results: LilaRollResult[] = [];
  for (const roll of rolls) {
    const result = applyLilaRoll(position, roll);
    results.push(result);
    position = result.to;
  }
  return { position, results };
}

type GameState = { position: number; movesCount: number };

export const canRollLila = (state: GameState): boolean => state.position !== LILA_GOAL_CELL && state.movesCount < LILA_MAX_MOVES;
export const canFinishLila = (state: GameState): boolean => state.position === LILA_GOAL_CELL || state.movesCount >= LILA_MIN_MOVES_TO_FINISH;
