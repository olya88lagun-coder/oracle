import { beforeEach, describe, expect, test } from "vitest";
import { addLilaMove, createLilaGame, finishLilaGame, getActiveLilaGame, getLilaGame, getLilaGameForUser, importLilaGame, listLilaGames, saveLilaNote } from "./lila";
import { createTestDb, seedUser } from "./testing";
import type { Database } from "./types";

let db: Database;
let userId: string;
const now = new Date("2026-10-01T10:00:00Z");

beforeEach(async () => {
  db = await createTestDb();
  userId = (await seedUser(db, { externalId: "lila-1" })).userId;
});

const start = async (intention = "Что мне важно увидеть?") => {
  const created = await createLilaGame(db, { userId, intention });
  if (!created.ok) throw new Error("no game");
  return created.game;
};
const roll = (gameId: string, value: number, customDie = false) => addLilaMove(db, { gameId, userId, roll: value, customDie });

describe("createLilaGame", () => {
  test("creates an active free game at position 0", async () => {
    const game = await start();
    expect(game).toMatchObject({ mode: "free", status: "active", position: 0, movesCount: 0, purchaseId: null });
  });

  test("refuses a second active game, but allows one after the first is closed", async () => {
    const first = await start();
    expect(await createLilaGame(db, { userId, intention: "Другое" })).toEqual({ ok: false, error: "active_exists" });
    await finishLilaGame(db, { gameId: first.id, userId, now });
    expect((await createLilaGame(db, { userId, intention: "Другое" })).ok).toBe(true);
  });

  test("a game awaiting payment does not block an active one", async () => {
    await createLilaGame(db, { userId, intention: "Ждёт оплаты", mode: "guided", status: "awaiting_payment" });
    expect((await createLilaGame(db, { userId, intention: "Свободная" })).ok).toBe(true);
  });
});

describe("addLilaMove", () => {
  test("numbers moves from 1, moves the piece and stores the transition", async () => {
    const game = await start();
    await roll(game.id, 6);
    await roll(game.id, 5);
    const result = await roll(game.id, 6);
    if (!result.ok) throw new Error("move failed");
    expect(result.game.position).toBe(8);
    expect(result.game.movesCount).toBe(3);
    expect(result.game.moves.map((m) => [m.n, m.landed, m.to, m.transition])).toEqual([
      [1, 1, 1, "none"],
      [2, 6, 6, "none"],
      [3, 12, 8, "snake"],
    ]);
  });

  test("two moves in a row keep distinct numbers", async () => {
    const game = await start();
    await Promise.all([roll(game.id, 6), roll(game.id, 1)]);
    expect((await getLilaGame(db, game.id))!.moves.map((m) => m.n)).toEqual([1, 2]);
  });

  test("a stranger cannot move and a closed game cannot move", async () => {
    const game = await start();
    const other = (await seedUser(db, { externalId: "lila-2" })).userId;
    expect(await addLilaMove(db, { gameId: game.id, userId: other, roll: 6, customDie: false })).toEqual({ ok: false, error: "not_found" });
    expect(await addLilaMove(db, { gameId: "not-a-uuid", userId, roll: 6, customDie: false })).toEqual({ ok: false, error: "not_found" });
    await finishLilaGame(db, { gameId: game.id, userId, now });
    expect(await roll(game.id, 6)).toEqual({ ok: false, error: "not_active" });
  });

  test("rejects a roll outside 1-6 and a broken user id without an exception", async () => {
    const game = await start();
    expect(await roll(game.id, 7)).toEqual({ ok: false, error: "invalid" });
    expect(await roll(game.id, 1.5)).toEqual({ ok: false, error: "invalid" });
    expect(await addLilaMove(db, { gameId: game.id, userId: "not-a-uuid", roll: 6, customDie: false })).toEqual({ ok: false, error: "not_found" });
  });

  test("stops at the move limit", async () => {
    const game = await start();
    for (let i = 0; i < 120; i += 1) expect((await roll(game.id, 1)).ok).toBe(true);
    expect(await roll(game.id, 1)).toEqual({ ok: false, error: "limit" });
  });

  test("stops at the goal", async () => {
    const imported = await importLilaGame(db, { userId, intention: "Путь к цели", moves: [6, 3, 6, 5, 4].map((r) => ({ roll: r, customDie: false, note: null })), replaceActive: false });
    if (!imported.ok) throw new Error("import failed");
    expect(imported.game.position).toBe(68);
    expect(await roll(imported.game.id, 1)).toEqual({ ok: false, error: "at_goal" });
  });
});

describe("saveLilaNote", () => {
  test("saves, replaces and clears a note of the owner's active game only", async () => {
    const game = await start();
    await roll(game.id, 6);
    expect(await saveLilaNote(db, { gameId: game.id, userId, n: 1, note: "Заметила." })).toBe(true);
    expect((await getLilaGame(db, game.id))!.moves[0]!.note).toBe("Заметила.");
    expect(await saveLilaNote(db, { gameId: game.id, userId, n: 1, note: null })).toBe(true);
    expect((await getLilaGame(db, game.id))!.moves[0]!.note).toBeNull();
    expect(await saveLilaNote(db, { gameId: game.id, userId, n: 9, note: "нет хода" })).toBe(false);
    expect(await saveLilaNote(db, { gameId: game.id, userId, n: 1, note: "я".repeat(501) })).toBe(false);
    const other = (await seedUser(db, { externalId: "lila-3" })).userId;
    expect(await saveLilaNote(db, { gameId: game.id, userId: other, n: 1, note: "чужая" })).toBe(false);
  });
});

describe("finishLilaGame", () => {
  test("a free game closed before ten moves is abandoned and stays out of the history", async () => {
    const game = await start();
    await roll(game.id, 6);
    expect(await finishLilaGame(db, { gameId: game.id, userId, now })).toEqual({ ok: true, status: "abandoned" });
    expect(await listLilaGames(db, userId)).toEqual([]);
  });

  test("from ten moves the game is finished and listed", async () => {
    const game = await start();
    for (let i = 0; i < 10; i += 1) await roll(game.id, 1);
    expect(await finishLilaGame(db, { gameId: game.id, userId, now })).toEqual({ ok: true, status: "finished" });
    const list = await listLilaGames(db, userId);
    expect(list.map((g) => [g.id, g.status, g.finishedAt])).toEqual([[game.id, "finished", now]]);
  });

  test("a guided game cannot be finished too early", async () => {
    const created = await createLilaGame(db, { userId, intention: "С проводником", mode: "guided" });
    if (!created.ok) throw new Error("no game");
    expect(await finishLilaGame(db, { gameId: created.game.id, userId, now })).toEqual({ ok: false, error: "too_early" });
  });

  test("a closed game cannot be finished again, and a stranger gets not_found", async () => {
    const game = await start();
    await finishLilaGame(db, { gameId: game.id, userId, now });
    expect(await finishLilaGame(db, { gameId: game.id, userId, now })).toEqual({ ok: false, error: "not_active" });
    const other = (await seedUser(db, { externalId: "lila-4" })).userId;
    expect(await finishLilaGame(db, { gameId: game.id, userId: other, now })).toEqual({ ok: false, error: "not_found" });
  });
});

describe("getLilaGameForUser", () => {
  test("returns the game to its owner only", async () => {
    const game = await start();
    const other = (await seedUser(db, { externalId: "lila-5" })).userId;
    expect((await getLilaGameForUser(db, game.id, userId))?.id).toBe(game.id);
    expect(await getLilaGameForUser(db, game.id, other)).toBeNull();
    expect(await getLilaGameForUser(db, game.id, "not-a-uuid")).toBeNull();
  });
});

describe("getActiveLilaGame", () => {
  test("returns the active game with its moves, or null", async () => {
    expect(await getActiveLilaGame(db, userId)).toBeNull();
    const game = await start();
    await roll(game.id, 6);
    expect((await getActiveLilaGame(db, userId))!.moves).toHaveLength(1);
  });
});

describe("importLilaGame", () => {
  const moves = [
    { roll: 6, customDie: false, note: null },
    { roll: 5, customDie: true, note: "Первая запись" },
    { roll: 6, customDie: false, note: null },
  ];

  test("replays the guest rolls on the server and keeps notes", async () => {
    const result = await importLilaGame(db, { userId, intention: "Из браузера", moves, replaceActive: false });
    if (!result.ok) throw new Error("import failed");
    expect(result.game).toMatchObject({ status: "active", mode: "free", position: 8, movesCount: 3 });
    expect(result.game.moves.map((m) => [m.n, m.customDie, m.note])).toEqual([
      [1, false, null],
      [2, true, "Первая запись"],
      [3, false, null],
    ]);
  });

  test("refuses when an active game exists, replaces it on request", async () => {
    const existing = await start("В портрете");
    expect(await importLilaGame(db, { userId, intention: "Из браузера", moves, replaceActive: false })).toEqual({ ok: false, error: "active_exists" });
    const replaced = await importLilaGame(db, { userId, intention: "Из браузера", moves, replaceActive: true });
    expect(replaced.ok).toBe(true);
    expect((await getLilaGame(db, existing.id))!.status).toBe("abandoned");
  });

  test("never replaces a guided game, even when replace is requested", async () => {
    const guided = await createLilaGame(db, { userId, intention: "С проводником", mode: "guided" });
    if (!guided.ok) throw new Error("no game");
    expect(await importLilaGame(db, { userId, intention: "Из браузера", moves, replaceActive: true })).toEqual({ ok: false, error: "active_exists" });
    expect((await getLilaGame(db, guided.game.id))!.status).toBe("active");
  });

  test("a failed import leaves the active game as it was", async () => {
    const existing = await start("Уже идёт");
    const result = await importLilaGame(db, { userId, intention: "Из браузера", moves, replaceActive: false });
    expect(result).toEqual({ ok: false, error: "active_exists" });
    expect((await getLilaGame(db, existing.id))!.status).toBe("active");
  });

  test("rejects impossible rolls, too many moves and long notes without changing anything", async () => {
    await start("Уже идёт");
    for (const bad of [
      [{ roll: 9, customDie: false, note: null }],
      Array.from({ length: 121 }, () => ({ roll: 1, customDie: false, note: null })),
      [{ roll: 6, customDie: false, note: "я".repeat(501) }],
    ]) {
      expect(await importLilaGame(db, { userId, intention: "Плохая", moves: bad, replaceActive: true })).toEqual({ ok: false, error: "invalid" });
    }
    expect((await getActiveLilaGame(db, userId))!.intention).toBe("Уже идёт");
  });
});
