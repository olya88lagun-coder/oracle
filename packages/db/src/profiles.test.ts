import { beforeEach, describe, expect, test } from "vitest";
import { createTestDb, getBirthDate, saveBirthDate, seedUser, type Database } from "./testing";

const NOW = new Date("2026-09-24T10:00:00Z");

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

describe("birth profile", () => {
  test("is empty for a new user", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-1" });

    expect(await getBirthDate(db, userId)).toBeNull();
  });

  test("stores the date and replaces it on the next save", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-2" });

    await saveBirthDate(db, userId, "1990-03-07", NOW);
    await saveBirthDate(db, userId, "1991-04-08", NOW);

    expect(await getBirthDate(db, userId)).toBe("1991-04-08");
  });

  test("keeps users apart and ignores malformed ids", async () => {
    const a = await seedUser(db, { externalId: "vk-3" });
    const b = await seedUser(db, { externalId: "vk-4" });

    await saveBirthDate(db, a.userId, "1990-03-07", NOW);

    expect(await getBirthDate(db, b.userId)).toBeNull();
    expect(await getBirthDate(db, "not-a-uuid")).toBeNull();
  });
});
