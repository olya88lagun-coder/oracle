import { attachPayment, createPurchase, createTestDb, deleteUserData, getReport, markPurchaseSucceeded, seedUser, type Database } from "@oracle/db/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { runGenerateNatal } from "./generate-natal";

const SNAPSHOT = { date: "1990-03-07", time: "12:00", instant: "1990-03-07T08:00:00.000Z", latitude: 55.7558, longitude: 37.6173, placeName: "Москва" };

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

async function paidPurchase(userId: string, paymentId: string, snapshot = SNAPSHOT) {
  const purchase = await createPurchase(db, { userId, product: "natal_report", natal: snapshot, receiptEmail: "a@b.ru", amountKopecks: 49_000 });
  await attachPayment(db, purchase.id, { paymentId, confirmationUrl: "https://pay.test" });
  await markPurchaseSucceeded(db, purchase.id, new Date());
  return purchase;
}

describe("runGenerateNatal", () => {
  test("saves a nine-chapter fallback report for a paid purchase and logs no birth data", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-n1" });
    const purchase = await paidPurchase(userId, "pay-n1");
    const log = vi.fn();

    await runGenerateNatal({ purchaseId: purchase.id }, { db, log });

    const report = await getReport(db, purchase.id);
    expect(report?.chapters.map((chapter) => chapter.id)).toEqual(["core", "mind", "love", "action", "work", "growth", "depth", "aspects", "scenario"]);
    expect(report?.chapters.every((chapter) => chapter.source === "fallback")).toBe(true);
    expect(log).toHaveBeenCalledWith("info", "natal report generated", expect.objectContaining({ purchaseId: purchase.id, created: true }));
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/1990|12:00|Москва|55\.7|37\.6|a@b\.ru/);
  });

  test("does nothing the second time", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-n2" });
    const purchase = await paidPurchase(userId, "pay-n2");
    await runGenerateNatal({ purchaseId: purchase.id }, { db, log: vi.fn() });
    const first = await getReport(db, purchase.id);
    const log = vi.fn();

    await runGenerateNatal({ purchaseId: purchase.id }, { db, log });

    expect((await getReport(db, purchase.id))?.createdAt).toEqual(first?.createdAt);
    expect(log).not.toHaveBeenCalled();
  });

  test("skips an unpaid purchase and a purchase whose data was deleted", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-n3" });
    const unpaid = await createPurchase(db, { userId, product: "natal_report", natal: SNAPSHOT, receiptEmail: "a@b.ru", amountKopecks: 49_000 });
    const log = vi.fn();
    await runGenerateNatal({ purchaseId: unpaid.id }, { db, log });
    expect(await getReport(db, unpaid.id)).toBeNull();
    expect(log).toHaveBeenCalledWith("info", "natal report skipped", { purchaseId: unpaid.id, reason: "not_paid" });

    const paid = await paidPurchase(userId, "pay-n3", { ...SNAPSHOT, time: "13:00", instant: "1990-03-07T09:00:00.000Z" });
    await deleteUserData(db, userId);
    await runGenerateNatal({ purchaseId: paid.id }, { db, log });
    expect(await getReport(db, paid.id)).toBeNull();
    expect(log).toHaveBeenCalledWith("info", "natal report skipped", { purchaseId: paid.id, reason: "data_deleted" });
    await runGenerateNatal({ purchaseId: "00000000-0000-4000-8000-000000000000" }, { db, log });
    expect(log).toHaveBeenCalledWith("info", "natal report skipped", { purchaseId: "00000000-0000-4000-8000-000000000000", reason: "no_purchase" });
  });

  test("does not write a report for the second payment of the same data", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-n4" });
    const first = await paidPurchase(userId, "pay-n4a");
    const second = await paidPurchase(userId, "pay-n4b");
    const log = vi.fn();

    await runGenerateNatal({ purchaseId: second.id }, { db, log });

    expect(await getReport(db, second.id)).toBeNull();
    expect(log).toHaveBeenCalledWith("warn", "duplicate paid purchase — refund manually", { purchaseId: second.id });
    expect(first.id).not.toBe(second.id);
  });
});
