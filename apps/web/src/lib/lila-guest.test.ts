import { describe, expect, test } from "vitest";
import { clearGuestGame, guestFinish, guestNote, guestRoll, guestStart, guestView, GUEST_KEY, readGuestGame, writeGuestGame } from "./lila-guest";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k), data };
};

describe("a guest game", () => {
  test("replays its rolls into the same view the server would build", () => {
    let game = guestStart("Что мне важно увидеть?");
    game = guestRoll(game, 6, false);
    game = guestRoll(game, 5, true);
    game = guestRoll(game, 6, false);
    const view = guestView(game);
    expect(view).toMatchObject({ id: "guest", mode: "free", status: "active", position: 8, movesCount: 3, canRoll: true, canFinish: false });
    expect(view.moves[1]).toMatchObject({ customDie: true, landed: 6 });
    expect(view.moves[2]).toMatchObject({ landed: 12, to: 8, transition: "snake" });
  });

  test("keeps notes, refuses a roll after finishing, and finishes early as a closed game", () => {
    let game = guestRoll(guestStart("Что мне важно увидеть?"), 6, false);
    game = guestNote(game, 1, "Заметила.");
    expect(guestView(game).moves[0]?.note).toBe("Заметила.");
    game = guestFinish(game);
    expect(guestView(game).status).toBe("abandoned");
    expect(() => guestRoll(game, 1, false)).toThrow();
    expect(() => guestNote(game, 1, "поздно")).toThrow();
  });

  test("refuses a roll outside 1-6, a roll at the goal and a note for a missing move", () => {
    const game = guestStart("Что мне важно увидеть?");
    expect(() => guestRoll(game, 9, false)).toThrow();
    expect(() => guestNote(game, 1, "нет хода")).toThrow();
    const atGoal = [6, 3, 6, 5, 4].reduce((g, roll) => guestRoll(g, roll, false), game);
    expect(guestView(atGoal)).toMatchObject({ position: 68, canRoll: false, canFinish: true });
    expect(() => guestRoll(atGoal, 1, false)).toThrow();
  });

  test("survives a round trip through storage and drops corrupt data", () => {
    const storage = memory();
    const game = guestRoll(guestStart("Что мне важно увидеть?"), 6, false);
    writeGuestGame(storage, game);
    expect(readGuestGame(storage)).toEqual(game);
    storage.data.set(GUEST_KEY, "{oops");
    expect(readGuestGame(storage)).toBeNull();
    storage.data.set(GUEST_KEY, JSON.stringify({ intention: "Что мне важно увидеть?", moves: [{ roll: 9, custom: false, note: null }], finished: false }));
    expect(readGuestGame(storage)).toBeNull();
    writeGuestGame(storage, game);
    clearGuestGame(storage);
    expect(readGuestGame(storage)).toBeNull();
  });

  test("works without storage", () => {
    expect(readGuestGame(null)).toBeNull();
    expect(() => writeGuestGame(null, guestStart("Что мне важно увидеть?"))).not.toThrow();
    expect(() => clearGuestGame(null)).not.toThrow();
  });
});
