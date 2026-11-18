import { NUMEROLOGY_SECTION_TITLES } from "@oracle/content/numerology-format";
import type { ThreadTextReader } from "@oracle/content/thread-report";
import { attachPayment, createPurchase, createTestDb, deleteUserData, getThreadReport, markPurchaseSucceeded, seedUser, type Database } from "@oracle/db/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { runGenerateThread } from "./generate-thread";

const BIRTH = "1990-07-15";
const now = () => new Date(Date.UTC(2026, 10, 18));

// Тексты подставляем свои: настоящие «month», «past», «rules» ещё не приняты и numerologyText их не отдаёт
const read: ThreadTextReader = (kind, key) => ({
  kind,
  key,
  title: `${kind}-${key}`,
  description: "",
  batch: 1,
  sections: NUMEROLOGY_SECTION_TITLES[kind as keyof typeof NUMEROLOGY_SECTION_TITLES].map((title) => ({
    title,
    paragraphs: [`СЕКРЕТНЫЙ ${kind}-${key} · ${title}`],
    items: title === "Три правила" || title === "Вопросы себе" ? ["а", "б", "в"] : [],
  })),
  faq: [],
});

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

async function paidPurchase(userId: string, paymentId: string) {
  const purchase = await createPurchase(db, { userId, product: "thread_report", birthDate: BIRTH, receiptEmail: "a@b.ru", amountKopecks: 29_000 });
  await attachPayment(db, purchase.id, { paymentId, confirmationUrl: "https://pay.test" });
  await markPurchaseSucceeded(db, purchase.id, new Date());
  return purchase;
}

describe("runGenerateThread", () => {
  test("saves a six-chapter report for a paid purchase and logs no date or text", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-t1" });
    const purchase = await paidPurchase(userId, "pay-t1");
    const log = vi.fn();

    await runGenerateThread({ purchaseId: purchase.id }, { db, log, now, read });

    const report = await getThreadReport(db, purchase.id);
    expect(report?.chapters.map((chapter) => chapter.id)).toEqual(["now", "years", "past", "periods", "rhythm", "rules"]);
    expect(report?.chapters.every((chapter) => chapter.source === "fallback")).toBe(true);
    expect(log).toHaveBeenCalledWith("info", "thread report generated", { purchaseId: purchase.id, created: true });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/1990|07-15|a@b\.ru|СЕКРЕТНЫЙ/);
  });

  test("does nothing the second time", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-t2" });
    const purchase = await paidPurchase(userId, "pay-t2");
    await runGenerateThread({ purchaseId: purchase.id }, { db, log: vi.fn(), now, read });
    const first = await getThreadReport(db, purchase.id);
    const log = vi.fn();

    await runGenerateThread({ purchaseId: purchase.id }, { db, log, now, read });

    expect((await getThreadReport(db, purchase.id))?.createdAt).toEqual(first?.createdAt);
    expect(log).not.toHaveBeenCalled();
  });

  test("skips an unpaid purchase, a purchase whose date was deleted and an unknown one", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-t3" });
    const unpaid = await createPurchase(db, { userId, product: "thread_report", birthDate: BIRTH, receiptEmail: "a@b.ru", amountKopecks: 29_000 });
    const log = vi.fn();
    await runGenerateThread({ purchaseId: unpaid.id }, { db, log, now, read });
    expect(await getThreadReport(db, unpaid.id)).toBeNull();
    expect(log).toHaveBeenCalledWith("info", "thread report skipped", { purchaseId: unpaid.id, reason: "not_paid" });

    const paid = await paidPurchase(userId, "pay-t3");
    await deleteUserData(db, userId);
    await runGenerateThread({ purchaseId: paid.id }, { db, log, now, read });
    expect(await getThreadReport(db, paid.id)).toBeNull();
    expect(log).toHaveBeenCalledWith("info", "thread report skipped", { purchaseId: paid.id, reason: "data_deleted" });
    await runGenerateThread({ purchaseId: "00000000-0000-4000-8000-000000000000" }, { db, log, now, read });
    expect(log).toHaveBeenCalledWith("info", "thread report skipped", { purchaseId: "00000000-0000-4000-8000-000000000000", reason: "no_purchase" });
  });

  test("does not write a report for the second payment of the same date", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-t4" });
    await paidPurchase(userId, "pay-t4a");
    const second = await paidPurchase(userId, "pay-t4b");
    const log = vi.fn();

    await runGenerateThread({ purchaseId: second.id }, { db, log, now, read });

    expect(await getThreadReport(db, second.id)).toBeNull();
    expect(log).toHaveBeenCalledWith("warn", "duplicate paid purchase — refund manually", { purchaseId: second.id });
  });

  test("ignores a job that carries a matrix or natal purchase", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-t6" });
    const matrix = await createPurchase(db, { userId, product: "matrix_report", birthDate: BIRTH, receiptEmail: "a@b.ru", amountKopecks: 39_000 });
    const natal = await createPurchase(db, {
      userId,
      product: "natal_report",
      natal: { date: BIRTH, time: "12:00", instant: "1990-07-15T08:00:00.000Z", latitude: 55.7558, longitude: 37.6173, placeName: "Москва" },
      receiptEmail: "a@b.ru",
      amountKopecks: 49_000,
    });
    const log = vi.fn();
    for (const [purchase, paymentId] of [[matrix, "pay-t6a"], [natal, "pay-t6b"]] as const) {
      await attachPayment(db, purchase.id, { paymentId, confirmationUrl: "https://pay.test" });
      await markPurchaseSucceeded(db, purchase.id, new Date());
      await runGenerateThread({ purchaseId: purchase.id }, { db, log, now, read });
      expect(await getThreadReport(db, purchase.id)).toBeNull();
      expect(log).toHaveBeenCalledWith("info", "thread report skipped", { purchaseId: purchase.id, reason: "wrong_product" });
    }
  });

  test("fails loudly when the texts are not published yet, without personal data in the error", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-t5" });
    const purchase = await paidPurchase(userId, "pay-t5");

    // читатель без текстов (как до принятия партии 10): сборщик бросает ошибку, воркер не глотает её
    await expect(runGenerateThread({ purchaseId: purchase.id }, { db, log: vi.fn(), now, read: () => undefined })).rejects.toThrow(/thread report: missing/);
    expect(await getThreadReport(db, purchase.id)).toBeNull();
  });

  test("with the real accepted texts the worker saves the full six-chapter report", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-t6" });
    const purchase = await paidPurchase(userId, "pay-t6");

    // настоящий numerologyText: партии 9 и 10 приняты
    await runGenerateThread({ purchaseId: purchase.id }, { db, log: vi.fn(), now });
    const report = await getThreadReport(db, purchase.id);
    expect(report?.chapters.map((chapter) => chapter.id)).toEqual(["now", "years", "past", "periods", "rhythm", "rules"]);
    for (const chapter of report?.chapters ?? []) expect(chapter.blocks.length).toBeGreaterThan(0);
  });
});
