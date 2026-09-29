import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";
import {
  attachPayment,
  authIdentities,
  birthProfiles,
  createPurchase,
  addLilaMove,
  createLilaGame,
  createTestDb,
  deleteUserData,
  getLilaGame,
  getLilaConclusion,
  getPurchase,
  getReport,
  getUser,
  listLilaGames,
  markPurchaseSucceeded,
  saveBirthDate,
  saveLilaConclusion,
  saveLilaGuide,
  saveLilaNote,
  activateLilaGameForPurchase,
  saveReport,
  seedUser,
  users,
  type Database,
} from "./testing";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

describe("deleteUserData and Lila games", () => {
  test("removes the intention, the moves and the notes of every game of the user, and leaves other users alone", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-lila" });
    const { userId: otherId } = await seedUser(db, { externalId: "vk-lila-2" });
    const created = await createLilaGame(db, { userId, intention: "Личное намерение" });
    const other = await createLilaGame(db, { userId: otherId, intention: "Чужое" });
    if (!created.ok || !other.ok) throw new Error("no game");
    await addLilaMove(db, { gameId: created.game.id, userId, roll: 6, customDie: false });
    await saveLilaNote(db, { gameId: created.game.id, userId, n: 1, note: "Личная запись" });

    await deleteUserData(db, userId);

    expect(await getLilaGame(db, created.game.id)).toBeNull();
    expect(await listLilaGames(db, userId)).toEqual([]);
    expect((await getLilaGame(db, other.game.id))?.intention).toBe("Чужое");
  });
});

describe("deleteUserData and paid Lila sessions", () => {
  test("removes the game, the guide paragraphs and the conclusion but keeps the payment record without the e-mail", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-lila-paid" });
    const purchase = await createPurchase(db, { userId, product: "lila_session", receiptEmail: "a@b.ru", amountKopecks: 49_000 });
    const created = await createLilaGame(db, { userId, intention: "Личное", mode: "guided", status: "awaiting_payment", purchaseId: purchase.id });
    if (!created.ok) throw new Error("no game");
    await markPurchaseSucceeded(db, purchase.id, new Date());
    await activateLilaGameForPurchase(db, purchase.id);
    await addLilaMove(db, { gameId: created.game.id, userId, roll: 6, customDie: false });
    await saveLilaGuide(db, { gameId: created.game.id, n: 1, text: "Абзац." });
    await saveLilaConclusion(db, { gameId: created.game.id, chapters: [{ id: "path", source: "fallback", paragraphs: ["Итог."] }] });

    await deleteUserData(db, userId);

    expect(await getLilaGame(db, created.game.id)).toBeNull();
    expect(await getLilaConclusion(db, created.game.id)).toBeNull();
    expect(await getPurchase(db, purchase.id)).toMatchObject({ amountKopecks: 49_000, status: "succeeded", receiptEmail: null });
  });
});

describe("deleteUserData", () => {
  test("removes the birth profile and identities and marks the user deleted", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    await saveBirthDate(db, userId, "1990-03-07", new Date());

    expect(await deleteUserData(db, userId)).toEqual({ deleted: true });

    expect(await db.select().from(birthProfiles)).toEqual([]);
    expect(await db.select().from(authIdentities).where(eq(authIdentities.userId, userId))).toEqual([]);
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    expect(user!.deletedAt).toBeInstanceOf(Date);
    expect(await getUser(db, userId)).toBeNull();
  });

  test("lets the same VK account sign up again as a new user", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-2" });
    await deleteUserData(db, userId);

    const again = await seedUser(db, { externalId: "vk-2" });

    expect(again.userId).not.toBe(userId);
  });

  test("does nothing for an unknown, malformed or already deleted user", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-3" });
    await deleteUserData(db, userId);

    expect(await deleteUserData(db, userId)).toEqual({ deleted: false });
    expect(await deleteUserData(db, "not-a-uuid")).toEqual({ deleted: false });
  });

  test("removes reports and wipes the date and e-mail from purchases but keeps the payment record", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-4" });
    const { userId: otherId } = await seedUser(db, { externalId: "vk-5" });
    const paidAt = new Date("2026-09-28T10:00:00Z");
    const mine = await createPurchase(db, { userId, product: "matrix_report", birthDate: "1988-11-18", receiptEmail: "a@b.ru", amountKopecks: 29_000 });
    await attachPayment(db, mine.id, { paymentId: "pay-1", confirmationUrl: "https://pay.test/1" });
    await markPurchaseSucceeded(db, mine.id, paidAt);
    await saveReport(db, { purchaseId: mine.id, chapters: [] });
    const theirs = await createPurchase(db, { userId: otherId, product: "matrix_report", birthDate: "1990-05-14", receiptEmail: "c@d.ru", amountKopecks: 29_000 });
    await saveReport(db, { purchaseId: theirs.id, chapters: [] });

    await deleteUserData(db, userId);

    expect(await getReport(db, mine.id)).toBeNull();
    expect(await getPurchase(db, mine.id)).toMatchObject({
      birthDate: null,
      receiptEmail: null,
      status: "succeeded",
      amountKopecks: 29_000,
      paidAt,
      yookassaPaymentId: "pay-1",
    });
    expect(await getReport(db, theirs.id)).not.toBeNull();
    expect(await getPurchase(db, theirs.id)).toMatchObject({ birthDate: "1990-05-14", receiptEmail: "c@d.ru" });
  });
});
