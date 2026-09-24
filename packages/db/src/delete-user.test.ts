import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";
import { authIdentities, birthProfiles, createTestDb, deleteUserData, getUser, saveBirthDate, seedUser, users, type Database } from "./testing";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
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
});
