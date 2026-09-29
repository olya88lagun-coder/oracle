import { beforeEach, describe, expect, test } from "vitest";
import { createPurchase, markPurchaseSucceeded } from "./purchases";
import { addLilaMove, createLilaGame, getActiveLilaGame, getLilaGame } from "./lila";
import {
  abandonAwaitingLilaGames,
  activateLilaGameForPurchase,
  getAwaitingLilaGame,
  getLilaConclusion,
  getLilaGameByPurchase,
  rebindLilaGamePurchase,
  saveLilaConclusion,
  saveLilaGuide,
} from "./lila-guided";
import { createTestDb, seedUser } from "./testing";
import type { Database } from "./types";

let db: Database;
let userId: string;

beforeEach(async () => {
  db = await createTestDb();
  userId = (await seedUser(db, { externalId: "g-1" })).userId;
});

const purchase = () => createPurchase(db, { userId, product: "lila_session", receiptEmail: "a@b.ru", amountKopecks: 49_000 });
async function awaiting(intention = "С проводником") {
  const p = await purchase();
  const created = await createLilaGame(db, { userId, intention, mode: "guided", status: "awaiting_payment", purchaseId: p.id });
  if (!created.ok) throw new Error("no game");
  return { purchase: p, game: created.game };
}

describe("a purchase without a birth date", () => {
  test("is stored with a null date", async () => {
    expect((await purchase()).birthDate).toBeNull();
  });
});

describe("awaiting games", () => {
  test("are found by purchase and by user, and abandoned in bulk", async () => {
    const { purchase: p, game } = await awaiting();
    expect((await getLilaGameByPurchase(db, p.id))?.id).toBe(game.id);
    expect((await getAwaitingLilaGame(db, userId))?.id).toBe(game.id);
    await abandonAwaitingLilaGames(db, userId);
    expect(await getAwaitingLilaGame(db, userId)).toBeNull();
    expect((await getLilaGame(db, game.id))!.status).toBe("abandoned");
  });

  test("get a new purchase on retry, only for their owner", async () => {
    const { game } = await awaiting();
    const next = await purchase();
    expect(await rebindLilaGamePurchase(db, { gameId: game.id, userId, purchaseId: next.id })).toBe(true);
    expect((await getLilaGameByPurchase(db, next.id))?.id).toBe(game.id);
    const other = (await seedUser(db, { externalId: "g-2" })).userId;
    expect(await rebindLilaGamePurchase(db, { gameId: game.id, userId: other, purchaseId: next.id })).toBe(false);
  });
});

describe("activateLilaGameForPurchase", () => {
  test("turns an awaiting game into an active guided game, once", async () => {
    const { purchase: p, game } = await awaiting();
    await markPurchaseSucceeded(db, p.id, new Date());
    expect(await activateLilaGameForPurchase(db, p.id)).toBe("activated");
    expect(await getActiveLilaGame(db, userId)).toMatchObject({ id: game.id, mode: "guided", status: "active" });
    expect(await activateLilaGameForPurchase(db, p.id)).toBe("already_active");
  });

  test("is blocked while another game is active", async () => {
    await createLilaGame(db, { userId, intention: "Свободная" });
    const { purchase: p, game } = await awaiting();
    expect(await activateLilaGameForPurchase(db, p.id)).toBe("blocked");
    expect((await getLilaGame(db, game.id))!.status).toBe("awaiting_payment");
  });

  test("revives a game that was abandoned before its payment arrived", async () => {
    const { purchase: p } = await awaiting();
    await abandonAwaitingLilaGames(db, userId);
    expect(await activateLilaGameForPurchase(db, p.id)).toBe("activated");
  });

  test("reports a missing game", async () => {
    expect(await activateLilaGameForPurchase(db, "3b241101-e2bb-4255-8caf-4136c566a962")).toBe("missing");
  });
});

describe("saveLilaGuide", () => {
  test("stores the paragraph once and lets null mean «none»", async () => {
    const { purchase: p, game } = await awaiting();
    await markPurchaseSucceeded(db, p.id, new Date());
    await activateLilaGameForPurchase(db, p.id);
    await addLilaMove(db, { gameId: game.id, userId, roll: 6, customDie: false });
    await addLilaMove(db, { gameId: game.id, userId, roll: 1, customDie: false });
    expect(await saveLilaGuide(db, { gameId: game.id, n: 1, text: "Абзац проводника." })).toBe(true);
    expect(await saveLilaGuide(db, { gameId: game.id, n: 1, text: "Другой абзац." })).toBe(false);
    expect(await saveLilaGuide(db, { gameId: game.id, n: 2, text: null })).toBe(true);
    const moves = (await getLilaGame(db, game.id))!.moves;
    expect(moves.map((m) => [m.guideSource, m.guideText])).toEqual([
      ["ai", "Абзац проводника."],
      ["none", null],
    ]);
  });
});

describe("conclusions", () => {
  test("are saved once per game and read back", async () => {
    const { game } = await awaiting();
    const chapters = [{ id: "path" as const, source: "fallback" as const, paragraphs: ["Текст."] }];
    expect(await getLilaConclusion(db, game.id)).toBeNull();
    expect(await saveLilaConclusion(db, { gameId: game.id, chapters })).toEqual({ created: true });
    expect(await saveLilaConclusion(db, { gameId: game.id, chapters: [] })).toEqual({ created: false });
    expect((await getLilaConclusion(db, game.id))!.chapters).toEqual(chapters);
  });
});
