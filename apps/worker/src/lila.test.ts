import type { Prompt, ReportWriter } from "@oracle/ai";
import {
  activateLilaGameForPurchase,
  addLilaMove,
  createLilaGame,
  createPurchase,
  createTestDb,
  finishLilaGame,
  getLilaConclusion,
  getLilaGame,
  markPurchaseSucceeded,
  seedUser,
  type Database,
} from "@oracle/db/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { runConclusion, runGuideMove } from "./lila";

const GUIDE = "На этой клетке может проявляться тема, которая связана с вашим вопросом о работе и решении. ".repeat(3).trim();
const CHAPTER = `${"Глава о вашем пути и вашем намерении, которая связывает клетки и записи в одну картину. ".repeat(4).trim()}\n\n${"Вторая часть главы: что может повторяться и что с этим можно делать. ".repeat(4).trim()}`;

let db: Database;
let userId: string;
let gameId: string;

// Ход 1 — бросок 3 без шестёрки: пустой; ход 2 — шестёрка, выход на клетку 1; ход 3 — 3, клетка 4
beforeEach(async () => {
  db = await createTestDb();
  userId = (await seedUser(db, { externalId: "w-1" })).userId;
  const purchase = await createPurchase(db, { userId, product: "lila_session", receiptEmail: "a@b.ru", amountKopecks: 49_000 });
  const created = await createLilaGame(db, { userId, intention: "Что мне важно?", mode: "guided", status: "awaiting_payment", purchaseId: purchase.id });
  if (!created.ok) throw new Error("no game");
  gameId = created.game.id;
  await markPurchaseSucceeded(db, purchase.id, new Date());
  await activateLilaGameForPurchase(db, purchase.id);
  for (const roll of [3, 6, 3]) await addLilaMove(db, { gameId, userId, roll, customDie: false });
});

const writer = (answer: string): ReportWriter & { prompts: Prompt[] } => {
  const w = {
    name: "fake",
    prompts: [] as Prompt[],
    async complete(prompt: Prompt) {
      w.prompts.push(prompt);
      return answer;
    },
  };
  return w;
};

describe("runGuideMove", () => {
  test("saves the paragraph for a real move and sends no identifiers to the model", async () => {
    const w = writer(GUIDE);
    await runGuideMove({ gameId, n: 2 }, { db, writer: w, log: vi.fn() });
    expect((await getLilaGame(db, gameId))!.moves[1]).toMatchObject({ guideSource: "ai", guideText: GUIDE });
    const sent = JSON.stringify(w.prompts);
    expect(sent).not.toContain(gameId);
    expect(sent).not.toContain(userId);
    expect(sent).toContain("Что мне важно?");
  });

  test("marks a wasted move and a missing writer as «none» without calling the model", async () => {
    const w = writer(GUIDE);
    await runGuideMove({ gameId, n: 1 }, { db, writer: w, log: vi.fn() });
    expect(w.prompts).toHaveLength(0);
    expect((await getLilaGame(db, gameId))!.moves[0]!.guideSource).toBe("none");
    await runGuideMove({ gameId, n: 3 }, { db, writer: null, log: vi.fn() });
    expect((await getLilaGame(db, gameId))!.moves[2]!.guideSource).toBe("none");
  });

  test("marks «none» when the answer never passes the checks, and skips a missing move or game or one already done", async () => {
    await runGuideMove({ gameId, n: 2 }, { db, writer: writer("Коротко."), log: vi.fn() });
    expect((await getLilaGame(db, gameId))!.moves[1]!.guideSource).toBe("none");
    const log = vi.fn();
    await runGuideMove({ gameId, n: 99 }, { db, writer: writer(GUIDE), log });
    await runGuideMove({ gameId: "3b241101-e2bb-4255-8caf-4136c566a962", n: 1 }, { db, writer: writer(GUIDE), log });
    const again = writer(GUIDE);
    await runGuideMove({ gameId, n: 2 }, { db, writer: again, log });
    expect(again.prompts).toHaveLength(0);
    expect(log).toHaveBeenCalledWith("info", "guide skipped", expect.objectContaining({ reason: "no_move" }));
    expect(log).toHaveBeenCalledWith("info", "guide skipped", expect.objectContaining({ reason: "no_guided_game" }));
    expect(log).toHaveBeenCalledWith("info", "guide skipped", expect.objectContaining({ reason: "already_done" }));
  });

  test("does not log the model's text", async () => {
    const log = vi.fn();
    await runGuideMove({ gameId, n: 2 }, { db, writer: writer("Плохой ответ с секретной фразой."), log });
    expect(JSON.stringify(log.mock.calls)).not.toContain("секретной");
  });
});

describe("runConclusion", () => {
  async function finish() {
    for (let i = 0; i < 8; i += 1) await addLilaMove(db, { gameId, userId, roll: 1, customDie: false });
    expect((await finishLilaGame(db, { gameId, userId, now: new Date() })).ok).toBe(true);
  }

  test("writes four chapters from the model for a finished guided game, once", async () => {
    await finish();
    await runConclusion({ gameId }, { db, writer: writer(CHAPTER), log: vi.fn() });
    const saved = await getLilaConclusion(db, gameId);
    expect(saved!.chapters.map((c) => [c.id, c.source])).toEqual([
      ["path", "ai"],
      ["repeats", "ai"],
      ["noticed", "ai"],
      ["outcome", "ai"],
    ]);
    const second = writer(CHAPTER);
    await runConclusion({ gameId }, { db, writer: second, log: vi.fn() });
    expect(second.prompts).toHaveLength(0);
  });

  test("assembles a fallback conclusion without a writer", async () => {
    await finish();
    await runConclusion({ gameId }, { db, writer: null, log: vi.fn() });
    expect((await getLilaConclusion(db, gameId))!.chapters.every((c) => c.source === "fallback")).toBe(true);
  });

  test("skips a game that is still active", async () => {
    const log = vi.fn();
    await runConclusion({ gameId }, { db, writer: null, log });
    expect(await getLilaConclusion(db, gameId)).toBeNull();
    expect(log).toHaveBeenCalledWith("info", "conclusion skipped", expect.objectContaining({ reason: "not_finished" }));
  });
});
