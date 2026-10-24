import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";
import {
  claimPurchaseAnalytics,
  createTestDb,
  purchases,
  seedUser,
  type Database,
} from "./testing";
import * as schema from "./schema";

let db: Database;
let userId: string;

beforeEach(async () => {
  db = await createTestDb();
  ({ userId } = await seedUser(db, { externalId: "analytics-user" }));
});

type PurchaseFixture = Partial<typeof purchases.$inferInsert>;

async function paid(overrides: PurchaseFixture = {}, targetDb = db) {
  const [row] = await targetDb.insert(purchases).values({
    userId,
    product: "matrix_report",
    amountKopecks: 39_000,
    status: "succeeded",
    paidAt: new Date("2026-10-24T09:00:00Z"),
    yookassaPaymentId: `payment-${randomUUID()}`,
    receiptEmail: "private@example.test",
    birthDate: "1990-03-07",
    ...overrides,
  }).returning();
  return row!;
}

describe("claimPurchaseAnalytics", () => {
  test("returns actual product and amount, with an independent anonymous transaction id", async () => {
    const purchase = await paid({ product: "natal_report", amountKopecks: 47_500 });
    const events = await claimPurchaseAnalytics(db, userId);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      transactionId: expect.stringMatching(/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i),
      product: "natal_report",
      amountKopecks: 47_500,
    });
    expect(events[0]!.transactionId).not.toBe(purchase.id);
    expect(events[0]!.transactionId).not.toBe(userId);
    expect(Object.keys(events[0]!).sort()).toEqual(["amountKopecks", "product", "transactionId"]);
  });

  test("claims each purchase once across repeated calls without changing the purchase", async () => {
    const purchase = await paid();
    expect(await claimPurchaseAnalytics(db, userId)).toHaveLength(1);
    expect(await claimPurchaseAnalytics(db, userId)).toEqual([]);
    const [unchanged] = await db.select().from(purchases).where(eq(purchases.id, purchase.id));
    expect(unchanged).toEqual(purchase);
  });

  test("only one concurrent browser receives each purchase event", async () => {
    await paid();
    const results = await Promise.all(Array.from({ length: 8 }, () => claimPurchaseAnalytics(db, userId)));
    expect(results.flat()).toHaveLength(1);
    expect(results.filter((events) => events.length > 0)).toHaveLength(1);
  });

  test.each([
    ["free owner access", { amountKopecks: 0, yookassaPaymentId: null }],
    ["zero amount with payment id", { amountKopecks: 0 }],
    ["negative amount", { amountKopecks: -100 }],
    ["pending", { status: "pending" }],
    ["canceled", { status: "canceled" }],
    ["missing paid timestamp", { paidAt: null }],
    ["missing gateway payment", { yookassaPaymentId: null }],
  ] satisfies [string, PurchaseFixture][])("ignores %s", async (_name, overrides) => {
    await paid(overrides);
    expect(await claimPurchaseAnalytics(db, userId)).toEqual([]);
  });

  test("does not claim another user's purchase", async () => {
    const { userId: otherId } = await seedUser(db, { externalId: "other-user" });
    await paid({ userId: otherId });
    expect(await claimPurchaseAnalytics(db, userId)).toEqual([]);
    expect(await claimPurchaseAnalytics(db, otherId)).toHaveLength(1);
  });

  test("returns no events for malformed user ids", async () => {
    await paid();
    expect(await claimPurchaseAnalytics(db, "not-a-uuid")).toEqual([]);
    expect(await claimPurchaseAnalytics(db, "")).toEqual([]);
    expect(await claimPurchaseAnalytics(db, userId)).toHaveLength(1);
  });

  test("returns at most 50 events and leaves the remainder for the next call", async () => {
    for (let index = 0; index < 51; index++) await paid();
    const first = await claimPurchaseAnalytics(db, userId);
    const second = await claimPurchaseAnalytics(db, userId);
    expect(first).toHaveLength(50);
    expect(second).toHaveLength(1);
    expect(new Set([...first, ...second].map((event) => event.transactionId)).size).toBe(51);
    expect(await claimPurchaseAnalytics(db, userId)).toEqual([]);
  });
});

test("migration suppresses historical successes while a prior pending purchase paid later stays eligible", async () => {
  const client = new PGlite();
  const migratedDb = drizzle(client, { schema }) as unknown as Database;
  const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8")) as {
    entries: { tag: string }[];
  };
  const analyticsIndex = journal.entries.findIndex(({ tag }) => tag.startsWith("0008_"));
  expect(analyticsIndex, "purchase analytics migration must be registered").toBeGreaterThanOrEqual(0);
  for (const { tag } of journal.entries.slice(0, analyticsIndex)) {
    await client.exec(readFileSync(new URL(`../drizzle/${tag}.sql`, import.meta.url), "utf8"));
  }
  const { userId: oldUser } = await seedUser(migratedDb, { externalId: "pre-migration" });
  const historical = await paid({ userId: oldUser }, migratedDb);
  const free = await paid({ userId: oldUser, amountKopecks: 0, yookassaPaymentId: null }, migratedDb);
  const pending = await paid({ userId: oldUser, status: "pending", paidAt: null }, migratedDb);
  const migration = journal.entries[analyticsIndex]!;

  await client.exec(readFileSync(new URL(`../drizzle/${migration.tag}.sql`, import.meta.url), "utf8"));

  expect(await claimPurchaseAnalytics(migratedDb, oldUser)).toEqual([]);
  const { rows } = await client.query<{ purchase_id: string }>("select purchase_id from purchase_analytics");
  expect(rows.map((row) => row.purchase_id).sort()).toEqual([historical.id, free.id].sort());
  await migratedDb.update(purchases).set({ status: "succeeded", paidAt: new Date() }).where(eq(purchases.id, pending.id));
  expect(await claimPurchaseAnalytics(migratedDb, oldUser)).toEqual([
    { transactionId: expect.any(String), product: "matrix_report", amountKopecks: 39_000 },
  ]);
  expect(await claimPurchaseAnalytics(migratedDb, oldUser)).toEqual([]);
  await client.close();
});
