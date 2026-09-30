import { getRandomRoll } from "./lila-dice";
import { guestFinish, guestNote, guestRoll, guestView, readGuestGame, writeGuestGame, type GuestGame } from "./lila-guest";
import type { GameView } from "./lila-view";

export type ApiResult = { ok: true; game: GameView } | { ok: false; error: string };
export type GameApi = {
  roll(customRoll?: number): Promise<ApiResult>;
  saveNote(n: number, note: string): Promise<ApiResult>;
  finish(): Promise<ApiResult>;
  // Перечитать партию: так догружается абзац проводника
  refresh(): Promise<ApiResult>;
};
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const MESSAGES: Record<string, string> = {
  invalid: "Проверьте введённое: намерение — от 3 до 300 знаков, запись — до 500.",
  not_found: "Партия не найдена. Обновите страницу.",
  not_active: "Партия уже закрыта.",
  limit: "Достигнут лимит в 120 ходов. Партию можно завершить.",
  at_goal: "Вы уже на клетке 68. Партию можно завершить.",
  too_early: "Партию можно завершить после клетки 68 или с десятого хода.",
  active_exists: "В портрете уже есть активная партия.",
  rate_limited: "Слишком много запросов. Подождите минуту.",
  unauthorized: "Нужно войти через VK ID.",
};
export const lilaErrorMessage = (error: string): string => MESSAGES[error] ?? "Не получилось. Попробуйте ещё раз.";

async function send(url: string, init: RequestInit): Promise<ApiResult> {
  try {
    const response = await fetch(url, init);
    const data = (await response.json().catch(() => null)) as { ok?: boolean; game?: GameView; error?: string } | null;
    if (data?.ok && data.game) return { ok: true, game: data.game };
    return { ok: false, error: data?.error ?? "network" };
  } catch {
    return { ok: false, error: "network" };
  }
}

const post = (url: string, body: unknown): Promise<ApiResult> => send(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const get = (url: string): Promise<ApiResult> => send(url, { method: "GET", cache: "no-store" });

export const startServerGame = (intention: string): Promise<ApiResult> => post("/api/lila/games", { intention });
export const importGuestGame = (game: GuestGame, replace: boolean): Promise<ApiResult> => post("/api/lila/import", { game, replace });

export const serverApi = (gameId: string): GameApi => ({
  roll: (customRoll) => post(`/api/lila/games/${gameId}/roll`, customRoll === undefined ? {} : { roll: customRoll }),
  saveNote: (n, note) => post(`/api/lila/games/${gameId}/note`, { n, note }),
  finish: () => post(`/api/lila/games/${gameId}/finish`, {}),
  refresh: () => get(`/api/lila/games/${gameId}`),
});

// Гость играет по тем же правилам, но целиком в браузере; бросок — из crypto.getRandomValues
export function guestApi(storage: StorageLike | null, random: () => number = getRandomRoll): GameApi {
  const run = (change: (game: GuestGame) => GuestGame): ApiResult => {
    const game = readGuestGame(storage);
    if (!game) return { ok: false, error: "not_found" };
    try {
      const next = change(game);
      writeGuestGame(storage, next);
      return { ok: true, game: guestView(next) };
    } catch {
      return { ok: false, error: "not_active" };
    }
  };
  return {
    roll: async (customRoll) => run((game) => guestRoll(game, customRoll ?? random(), customRoll !== undefined)),
    saveNote: async (n, note) => run((game) => guestNote(game, n, note.trim() === "" ? null : note.trim())),
    finish: async () => run(guestFinish),
    refresh: async () => run((game) => game),
  };
}
