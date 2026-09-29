import { canFinishLila, canRollLila, LILA_GOAL_CELL, LILA_INTENTION_MAX_CHARS, LILA_NOTE_MAX_CHARS, type LilaTransition } from "@oracle/core";

const INTENTION_MIN_CHARS = 3;

export type GameStatus = "awaiting_payment" | "active" | "finished" | "abandoned";
type MoveSource = {
  n: number;
  roll: number;
  from: number;
  landed: number;
  to: number;
  transition: LilaTransition;
  customDie: boolean;
  note: string | null;
  guideText?: string | null;
  guideSource?: "ai" | "none" | null;
};
export type GameSource = { id: string; mode: "free" | "guided"; status: GameStatus; intention: string; position: number; movesCount: number; moves: readonly MoveSource[] };

export type MoveView = Omit<MoveSource, "guideText" | "guideSource"> & { entered: boolean; reachedGoal: boolean; wasted: boolean; guideText: string | null; guidePending: boolean };
export type GameView = {
  id: string;
  mode: "free" | "guided";
  status: GameStatus;
  intention: string;
  position: number;
  movesCount: number;
  moves: MoveView[];
  canRoll: boolean;
  canFinish: boolean;
};

// Настоящий ход всегда меняет клетку, поэтому «встали там же» — это пустой ход.
// Абзац проводника ещё пишется, пока у настоящего хода платной партии нет ни текста, ни отметки «не получился»
export const toMoveView = (move: MoveSource, mode: "free" | "guided" = "free"): MoveView => ({
  n: move.n,
  roll: move.roll,
  from: move.from,
  landed: move.landed,
  to: move.to,
  transition: move.transition,
  customDie: move.customDie,
  note: move.note,
  entered: move.from === 0 && move.landed === 1,
  reachedGoal: move.to === LILA_GOAL_CELL && move.landed !== move.from,
  wasted: move.landed === move.from,
  guideText: move.guideText ?? null,
  guidePending: mode === "guided" && move.landed !== move.from && (move.guideSource ?? null) === null,
});

export function toGameView(game: GameSource): GameView {
  const active = game.status === "active";
  const state = { position: game.position, movesCount: game.movesCount };
  return {
    id: game.id,
    mode: game.mode,
    status: game.status,
    intention: game.intention,
    position: game.position,
    movesCount: game.movesCount,
    moves: game.moves.map((move) => toMoveView(move, game.mode)),
    canRoll: active && canRollLila(state),
    canFinish: active && canFinishLila(state),
  };
}

export function normalizeIntention(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length >= INTENTION_MIN_CHARS && text.length <= LILA_INTENTION_MAX_CHARS ? text : null;
}

// Пусто — записи нет; слишком длинное или не строка — ошибка ввода
export function normalizeNote(value: unknown): string | null | "invalid" {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return "invalid";
  const text = value.trim();
  if (text.length > LILA_NOTE_MAX_CHARS) return "invalid";
  return text === "" ? null : text;
}
