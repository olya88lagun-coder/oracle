import { isLilaRoll, LILA_MAX_MOVES, LILA_NOTE_MAX_CHARS, replayLila } from "@oracle/core";
import { toGameView, type GameView } from "./lila-view";

export const GUEST_KEY = "lila:game:v1";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type GuestMove = { roll: number; custom: boolean; note: string | null };
export type GuestGame = { intention: string; moves: GuestMove[]; finished: boolean };

export const guestStart = (intention: string): GuestGame => ({ intention, moves: [], finished: false });

export function guestView(game: GuestGame): GameView {
  const { position, results } = replayLila(game.moves.map((move) => move.roll));
  const moves = results.map((result, index) => ({
    n: index + 1,
    roll: result.roll,
    from: result.from,
    landed: result.landed,
    to: result.to,
    transition: result.transition,
    customDie: game.moves[index]!.custom,
    note: game.moves[index]!.note,
  }));
  const finishable = position === 68 || moves.length >= 10;
  return toGameView({
    id: "guest",
    mode: "free",
    status: game.finished ? (finishable ? "finished" : "abandoned") : "active",
    intention: game.intention,
    position,
    movesCount: moves.length,
    moves,
  });
}

export function guestRoll(game: GuestGame, roll: number, custom: boolean): GuestGame {
  const view = guestView(game);
  if (game.finished || !view.canRoll || !isLilaRoll(roll)) throw new Error("roll is not possible");
  return { ...game, moves: [...game.moves, { roll, custom, note: null }] };
}

export function guestNote(game: GuestGame, n: number, note: string | null): GuestGame {
  if (game.finished || n < 1 || n > game.moves.length || (note !== null && note.length > LILA_NOTE_MAX_CHARS)) throw new Error("note is not possible");
  return { ...game, moves: game.moves.map((move, index) => (index === n - 1 ? { ...move, note } : move)) };
}

export const guestFinish = (game: GuestGame): GuestGame => ({ ...game, finished: true });

// Хранилище может быть недоступно или испорчено — тогда партия просто начнётся заново
export function readGuestGame(storage: StorageLike | null): GuestGame | null {
  try {
    const raw = storage?.getItem(GUEST_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as GuestGame;
    if (typeof value.intention !== "string" || !Array.isArray(value.moves) || value.moves.length > LILA_MAX_MOVES) return null;
    // Невозможный порядок бросков (в том числе после цели) replayLila отвергает исключением
    replayLila(value.moves.map((move) => move.roll));
    return value;
  } catch {
    return null;
  }
}

export function writeGuestGame(storage: StorageLike | null, game: GuestGame): void {
  try {
    storage?.setItem(GUEST_KEY, JSON.stringify(game));
  } catch {
    // партия живёт до перезагрузки страницы
  }
}

export function clearGuestGame(storage: StorageLike | null): void {
  try {
    storage?.removeItem(GUEST_KEY);
  } catch {
    // нечего очищать
  }
}
