import { beforeEach, describe, expect, test } from "vitest";
import {
  attachPayment,
  createPurchase,
  createTestDb,
  findOpenPurchase,
  findPaidPurchase,
  getPurchase,
  getPurchaseByPaymentId,
  listPaidPurchases,
  markPurchaseCanceled,
  markPurchaseSucceeded,
  saveReport,
  seedUser,
  type Database,
} from "./testing";

const PRODUCT = "matrix_report" as const;
const DATE = "1988-11-18";
const T0 = new Date("2026-09-28T10:00:00Z");

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

async function purchase(userId: string, p: { birthDate?: string; email?: string } = {}) {
  return createPurchase(db, { userId, product: PRODUCT, birthDate: p.birthDate ?? DATE, receiptEmail: p.email ?? "a@b.ru", amountKopecks: 29_000 });
}

async function openPurchase(userId: string, p: { birthDate?: string; paymentId: string }) {
  const created = await purchase(userId, p);
  await attachPayment(db, created.id, { paymentId: p.paymentId, confirmationUrl: `https://pay.test/${p.paymentId}` });
  return created;
}

const minuteAgo = () => new Date(Date.now() - 60_000);

describe("purchases", () => {
  test("are created pending with the date snapshot, e-mail and amount", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });

    const created = await purchase(userId);

    expect(created).toMatchObject({ userId, product: PRODUCT, birthDate: DATE, receiptEmail: "a@b.ru", amountKopecks: 29_000, status: "pending", paidAt: null });
    expect(await getPurchase(db, created.id)).toEqual(created);
  });

  test("are found by the payment id after the payment is attached", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const created = await openPurchase(userId, { paymentId: "pay-1" });

    expect((await getPurchaseByPaymentId(db, "pay-1"))?.id).toBe(created.id);
    expect(await getPurchaseByPaymentId(db, "pay-unknown")).toBeNull();
  });

  test("return null for malformed ids", async () => {
    expect(await getPurchase(db, "not-a-uuid")).toBeNull();
  });
});

describe("findOpenPurchase", () => {
  test("finds a recent pending purchase of the same user and date only", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const { userId: otherId } = await seedUser(db, { externalId: "vk-2" });
    const mine = await openPurchase(userId, { paymentId: "pay-1" });
    await openPurchase(userId, { paymentId: "pay-2", birthDate: "1990-05-14" });
    await openPurchase(otherId, { paymentId: "pay-3" });

    expect((await findOpenPurchase(db, { userId, product: PRODUCT, birthDate: DATE, since: minuteAgo() }))?.id).toBe(mine.id);
  });

  test("ignores purchases without a payment link or already decided", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    await purchase(userId);
    const paid = await openPurchase(userId, { paymentId: "pay-1" });
    await markPurchaseSucceeded(db, paid.id, T0);

    expect(await findOpenPurchase(db, { userId, product: PRODUCT, birthDate: DATE, since: minuteAgo() })).toBeNull();
  });

  test("ignores purchases older than the reuse window", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const open = await openPurchase(userId, { paymentId: "pay-1" });

    expect(await findOpenPurchase(db, { userId, product: PRODUCT, birthDate: DATE, since: new Date(open.createdAt.getTime() + 1000) })).toBeNull();
  });
});

describe("status changes", () => {
  test("a pending purchase becomes paid exactly once", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const created = await purchase(userId);

    expect(await markPurchaseSucceeded(db, created.id, T0)).toBe(true);
    expect(await markPurchaseSucceeded(db, created.id, T0)).toBe(false);
    expect(await getPurchase(db, created.id)).toMatchObject({ status: "succeeded", paidAt: T0 });
  });

  test("canceling touches only pending purchases", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const paid = await purchase(userId);
    await markPurchaseSucceeded(db, paid.id, T0);
    const pending = await purchase(userId);

    await markPurchaseCanceled(db, paid.id);
    await markPurchaseCanceled(db, pending.id);

    expect((await getPurchase(db, paid.id))?.status).toBe("succeeded");
    expect((await getPurchase(db, pending.id))?.status).toBe("canceled");
    expect(await markPurchaseSucceeded(db, pending.id, T0)).toBe(false);
  });
});

describe("paid purchases", () => {
  test("findPaidPurchase returns the earliest paid purchase of the date", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const first = await purchase(userId);
    const second = await purchase(userId);
    await markPurchaseSucceeded(db, second.id, T0);
    await markPurchaseSucceeded(db, first.id, T0);

    expect((await findPaidPurchase(db, { userId, product: PRODUCT, birthDate: DATE }))?.id).toBe(first.id);
    expect(await findPaidPurchase(db, { userId, product: PRODUCT, birthDate: "1990-05-14" })).toBeNull();
  });

  test("listPaidPurchases shows paid ones with a ready flag, newest first, without other users", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const { userId: otherId } = await seedUser(db, { externalId: "vk-2" });
    const olderPaidAt = new Date("2026-09-01T10:00:00Z");
    const older = await purchase(userId);
    await markPurchaseSucceeded(db, older.id, olderPaidAt);
    await saveReport(db, { purchaseId: older.id, chapters: [] });
    const newer = await purchase(userId, { birthDate: "1990-05-14" });
    await markPurchaseSucceeded(db, newer.id, T0);
    await purchase(userId);
    const foreign = await purchase(otherId);
    await markPurchaseSucceeded(db, foreign.id, T0);

    expect(await listPaidPurchases(db, userId)).toEqual([
      { id: newer.id, birthDate: "1990-05-14", ready: false, paidAt: T0 },
      { id: older.id, birthDate: DATE, ready: true, paidAt: olderPaidAt },
    ]);
  });
});
