import type { Prompt, ReportWriter } from "@oracle/ai";
import { attachPayment, createPurchase, createTestDb, deleteUserData, getReport, markPurchaseSucceeded, seedUser, type Database } from "@oracle/db/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { runGenerate } from "./generate";

const LONG = "Абзац о том, как арканы проявляются вместе, где ресурс и где перекос, и что с этим можно делать сегодня. ";
const PROSE = JSON.stringify({ paragraphs: [LONG.repeat(4), LONG.repeat(4), LONG.repeat(4)] });
const SCENARIO = JSON.stringify({
  pattern: "Сценарий.",
  tension: "Напряжение.",
  resource: "Ресурс.",
  blindSpot: "Слепая зона.",
  turningPoint: "Точка изменения.",
  experiment: "Эксперимент.",
  question: "Вопрос?",
});

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

function fakeWriter(): ReportWriter & { calls: number } {
  const writer = {
    name: "fake",
    calls: 0,
    async complete(prompt: Prompt) {
      writer.calls += 1;
      return JSON.parse(prompt.user).chapter === "scenario" ? SCENARIO : PROSE;
    },
  };
  return writer;
}

async function paidPurchase(userId: string, paymentId: string) {
  const purchase = await createPurchase(db, { userId, product: "matrix_report", birthDate: "1988-11-18", receiptEmail: "a@b.ru", amountKopecks: 29_000 });
  await attachPayment(db, purchase.id, { paymentId, confirmationUrl: "https://pay.test" });
  await markPurchaseSucceeded(db, purchase.id, new Date());
  return purchase;
}

describe("runGenerate", () => {
  test("writes and saves a seven-chapter report for a paid purchase, logging no text", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const purchase = await paidPurchase(userId, "pay-1");
    const writer = fakeWriter();
    const log = vi.fn();

    await runGenerate({ purchaseId: purchase.id }, { db, writer, log });

    const report = await getReport(db, purchase.id);
    expect(report?.chapters).toHaveLength(7);
    expect(report?.chapters.every((chapter) => chapter.source === "ai")).toBe(true);
    expect(log).toHaveBeenCalledWith("info", "report generated", expect.objectContaining({ purchaseId: purchase.id, created: true }));
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Абзац|1988|a@b\.ru/);
  });

  test("does nothing the second time", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const purchase = await paidPurchase(userId, "pay-1");
    const writer = fakeWriter();
    await runGenerate({ purchaseId: purchase.id }, { db, writer, log: vi.fn() });
    const calls = writer.calls;

    await runGenerate({ purchaseId: purchase.id }, { db, writer, log: vi.fn() });

    expect(writer.calls).toBe(calls);
  });

  test("skips unpaid, unknown and deleted-data purchases", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const pending = await createPurchase(db, { userId, product: "matrix_report", birthDate: "1988-11-18", receiptEmail: "a@b.ru", amountKopecks: 29_000 });
    const { userId: goneId } = await seedUser(db, { externalId: "vk-2" });
    const gone = await paidPurchase(goneId, "pay-2");
    await deleteUserData(db, goneId);
    const log = vi.fn();

    await runGenerate({ purchaseId: pending.id }, { db, writer: null, log });
    await runGenerate({ purchaseId: "00000000-0000-4000-8000-000000000000" }, { db, writer: null, log });
    await runGenerate({ purchaseId: gone.id }, { db, writer: null, log });

    expect(await getReport(db, pending.id)).toBeNull();
    expect(await getReport(db, gone.id)).toBeNull();
    expect(log.mock.calls.map((call) => call[2].reason)).toEqual(["not_paid", "no_purchase", "data_deleted"]);
  });

  test("does not write a second report for a duplicate payment of the same date", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    await paidPurchase(userId, "pay-1");
    const duplicate = await paidPurchase(userId, "pay-2");
    const log = vi.fn();

    await runGenerate({ purchaseId: duplicate.id }, { db, writer: null, log });

    expect(await getReport(db, duplicate.id)).toBeNull();
    expect(log).toHaveBeenCalledWith("warn", "duplicate paid purchase — refund manually", { purchaseId: duplicate.id });
  });

  test("builds the report from the blocks when there is no AI provider", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });
    const purchase = await paidPurchase(userId, "pay-1");

    await runGenerate({ purchaseId: purchase.id }, { db, writer: null, log: vi.fn() });

    expect((await getReport(db, purchase.id))?.chapters.every((chapter) => chapter.source === "fallback")).toBe(true);
  });
});
