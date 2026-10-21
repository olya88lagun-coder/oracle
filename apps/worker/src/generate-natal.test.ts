import type { Prompt, ReportWriter } from "@oracle/ai";
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

describe("runGenerateNatal with the AI editor", () => {
  const SENTENCE = "Положения этой главы могут складываться в единую картину, где одно усиливает другое, а напряжение подсказывает, на что стоит обратить внимание. ";
  const SCENARIO = JSON.stringify({
    pattern: "Может повторяться привычка откладывать главное.",
    tension: "Напряжение — между желанием сделать и страхом ошибиться.",
    resource: "Опора — спокойная настойчивость.",
    blindSpot: "Легко не замечать собственную усталость.",
    turningPoint: "Остановиться и спросить, чего хочется на самом деле.",
    experiment: "Семь дней подряд записывать одно чувство за день.",
    question: "Где я держу себя сильнее, чем нужно?",
  });
  const writerFor = (answer: (chapter: string) => string): ReportWriter & { prompts: Prompt[] } => {
    const writer = {
      name: "fake",
      prompts: [] as Prompt[],
      async complete(prompt: Prompt) {
        writer.prompts.push(prompt);
        return answer((JSON.parse(prompt.user) as { chapter: string }).chapter);
      },
    };
    return writer;
  };
  const good = (chapter: string) => (chapter === "scenario" ? SCENARIO : Array.from({ length: 4 }, () => SENTENCE.repeat(3).trim()).join("\n\n"));

  test("saves the chapters written by the model and sends it no birth data", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-ai1" });
    const purchase = await paidPurchase(userId, "pay-ai1");
    const writer = writerFor(good);
    const log = vi.fn();

    await runGenerateNatal({ purchaseId: purchase.id }, { db, writer, log });

    const report = await getReport(db, purchase.id);
    expect(report?.chapters).toHaveLength(9);
    expect(report?.chapters.every((chapter) => chapter.source === "ai")).toBe(true);
    expect(writer.prompts).toHaveLength(9);
    for (const prompt of writer.prompts) for (const forbidden of ["1990", "12:00", "Москва", "55.75", "a@b.ru"]) expect(`${prompt.system}${prompt.user}`, forbidden).not.toContain(forbidden);
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/1990|Москва|a@b\.ru/);
  });

  test("a chapter the model keeps getting wrong is assembled from the texts, with attempts logged without the answer", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-ai2" });
    const purchase = await paidPurchase(userId, "pay-ai2");
    const writer = writerFor((chapter) => (chapter === "love" ? "СЕКРЕТ без абзацев" : good(chapter)));
    const log = vi.fn();

    await runGenerateNatal({ purchaseId: purchase.id }, { db, writer, log });

    const report = await getReport(db, purchase.id);
    expect(report?.chapters.find((chapter) => chapter.id === "love")?.source).toBe("fallback");
    expect(report?.chapters.filter((chapter) => chapter.source === "ai")).toHaveLength(8);
    expect(log.mock.calls.filter((call) => call[1] === "natal chapter attempt rejected")).toHaveLength(3);
    expect(JSON.stringify(log.mock.calls)).not.toContain("СЕКРЕТ без абзацев");
  });

  test("without a writer the report is still assembled from the texts", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-ai3" });
    const purchase = await paidPurchase(userId, "pay-ai3");
    await runGenerateNatal({ purchaseId: purchase.id }, { db, writer: null, log: vi.fn() });
    expect((await getReport(db, purchase.id))?.chapters.every((chapter) => chapter.source === "fallback")).toBe(true);
  });
});
