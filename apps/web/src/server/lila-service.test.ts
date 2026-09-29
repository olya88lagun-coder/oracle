import { createTestDb, seedUser, type Database } from "@oracle/db/testing";
import { beforeEach, describe, expect, test } from "vitest";
import { activeGame, finishGame, gameById, importGame, rollGame, saveNote, startGame, type LilaDeps } from "./lila-service";

let db: Database;
let userId: string;
let next = 6;
const deps = (): LilaDeps => ({ db, randomRoll: () => next, now: () => new Date("2026-10-01T10:00:00Z") });
const started = async () => {
  const result = await startGame(deps(), { userId, intention: "Что мне важно увидеть?" });
  if (!result.ok) throw new Error(result.error);
  return result.game;
};

beforeEach(async () => {
  db = await createTestDb();
  userId = (await seedUser(db, { externalId: "svc-1" })).userId;
  next = 6;
});

describe("startGame", () => {
  test("creates a game and rejects a bad intention and a second active game", async () => {
    expect((await started()).moves).toEqual([]);
    expect(await startGame(deps(), { userId, intention: "да" })).toEqual({ ok: false, error: "invalid" });
    expect(await startGame(deps(), { userId, intention: "Ещё одно намерение" })).toEqual({ ok: false, error: "active_exists" });
  });
});

describe("rollGame", () => {
  test("uses the server dice, and takes a client roll only as a custom die in 1-6", async () => {
    const game = await started();
    const rolled = await rollGame(deps(), { userId, gameId: game.id, customRoll: undefined });
    expect(rolled).toMatchObject({ ok: true, game: { position: 1, movesCount: 1 } });
    expect(await rollGame(deps(), { userId, gameId: game.id, customRoll: 9 })).toEqual({ ok: false, error: "invalid" });
    expect(await rollGame(deps(), { userId, gameId: game.id, customRoll: "3" })).toEqual({ ok: false, error: "invalid" });
    const custom = await rollGame(deps(), { userId, gameId: game.id, customRoll: 4 });
    expect(custom).toMatchObject({ ok: true, game: { position: 5 } });
    if (custom.ok) expect(custom.game.moves.at(-1)?.customDie).toBe(true);
  });

  test("a stranger and a bad id get not_found", async () => {
    const game = await started();
    const other = (await seedUser(db, { externalId: "svc-2" })).userId;
    expect(await rollGame(deps(), { userId: other, gameId: game.id, customRoll: undefined })).toEqual({ ok: false, error: "not_found" });
    expect(await rollGame(deps(), { userId, gameId: "not-a-uuid", customRoll: undefined })).toEqual({ ok: false, error: "not_found" });
  });

  test("stops at the goal with at_goal", async () => {
    const imported = await importGame(deps(), { userId, payload: { intention: "Путь к цели", moves: [6, 3, 6, 5, 4].map((roll) => ({ roll, custom: false, note: null })) }, replace: false });
    if (!imported.ok) throw new Error(imported.error);
    expect(await rollGame(deps(), { userId, gameId: imported.game.id, customRoll: undefined })).toEqual({ ok: false, error: "at_goal" });
  });
});

describe("saveNote and finishGame", () => {
  test("saves a note, rejects a long one, closes the game", async () => {
    const game = await started();
    await rollGame(deps(), { userId, gameId: game.id, customRoll: undefined });
    expect((await saveNote(deps(), { userId, gameId: game.id, n: 1, note: " Заметила. " })).ok).toBe(true);
    expect(await saveNote(deps(), { userId, gameId: game.id, n: 1, note: "я".repeat(501) })).toEqual({ ok: false, error: "invalid" });
    expect(await saveNote(deps(), { userId, gameId: game.id, n: "1", note: "x" })).toEqual({ ok: false, error: "invalid" });
    expect(await gameById(deps(), { userId, gameId: game.id })).toMatchObject({ ok: true, game: { moves: [{ note: "Заметила." }] } });
    expect((await finishGame(deps(), { userId, gameId: game.id })).ok).toBe(true);
    expect(await activeGame(deps(), { userId })).toBeNull();
  });
});

describe("importGame", () => {
  const payload = { intention: "Из браузера", moves: [{ roll: 6, custom: false, note: null }, { roll: 5, custom: true, note: "Первая запись" }] };

  test("imports a valid guest game and returns the server view", async () => {
    const result = await importGame(deps(), { userId, payload, replace: false });
    expect(result).toMatchObject({ ok: true, game: { position: 6, movesCount: 2, mode: "free" } });
  });

  test("rejects a malformed payload and an impossible roll", async () => {
    expect(await importGame(deps(), { userId, payload: { intention: 5 }, replace: false })).toEqual({ ok: false, error: "invalid" });
    expect(await importGame(deps(), { userId, payload: null, replace: false })).toEqual({ ok: false, error: "invalid" });
    expect(await importGame(deps(), { userId, payload: { ...payload, moves: [{ roll: 9, custom: false, note: null }] }, replace: false })).toEqual({ ok: false, error: "invalid" });
    expect(await importGame(deps(), { userId, payload: { ...payload, moves: [{ roll: 6, custom: false, note: "я".repeat(501) }] }, replace: false })).toEqual({ ok: false, error: "invalid" });
  });

  test("reports an existing active game unless replace is set", async () => {
    await started();
    expect(await importGame(deps(), { userId, payload, replace: false })).toEqual({ ok: false, error: "active_exists" });
    expect((await importGame(deps(), { userId, payload, replace: true })).ok).toBe(true);
  });
});
