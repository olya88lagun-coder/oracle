import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";
import { createPurchase, createTestDb, getReport, purchases, saveReport, seedUser, type Database, type StoredChapter } from "./testing";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

const CHAPTERS: StoredChapter[] = [
  { id: "core", source: "ai", paragraphs: ["Первый абзац.", "Второй абзац."] },
  {
    id: "scenario",
    source: "fallback",
    scenario: { pattern: "п", tension: "н", resource: "р", blindSpot: "с", turningPoint: "т", experiment: "э", question: "в?" },
  },
];

async function purchaseId() {
  const { userId } = await seedUser(db, { externalId: "vk-1" });
  const created = await createPurchase(db, { userId, product: "matrix_report", birthDate: "1988-11-18", receiptEmail: "a@b.ru", amountKopecks: 29_000 });
  return created.id;
}

describe("reports", () => {
  test("are saved once per purchase — the first text wins", async () => {
    const id = await purchaseId();

    expect(await saveReport(db, { purchaseId: id, chapters: CHAPTERS })).toEqual({ created: true });
    expect(await saveReport(db, { purchaseId: id, chapters: [] })).toEqual({ created: false });

    expect((await getReport(db, id))?.chapters).toEqual(CHAPTERS);
  });

  test("are missing for an unknown or malformed purchase", async () => {
    expect(await getReport(db, "00000000-0000-4000-8000-000000000000")).toBeNull();
    expect(await getReport(db, "nope")).toBeNull();
  });

  test("go away together with their purchase", async () => {
    const id = await purchaseId();
    await saveReport(db, { purchaseId: id, chapters: CHAPTERS });

    await db.delete(purchases).where(eq(purchases.id, id));

    expect(await getReport(db, id)).toBeNull();
  });
});
