import { beforeEach, describe, expect, test } from "vitest";
import { createTestDb, getUser, upsertUserFromIdentity, users, type Database, type IdentityInput } from "./testing";

const CONSENT = { version: "2026-09-v1", at: new Date("2026-09-24T10:00:00Z") };

function identity(overrides: Partial<IdentityInput> = {}): IdentityInput {
  return { provider: "vk", externalId: "1001", displayName: "Аня", ...overrides };
}

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

describe("upsertUserFromIdentity", () => {
  test("refuses to create a user without consent", async () => {
    expect(await upsertUserFromIdentity(db, identity(), null)).toEqual({ ok: false, reason: "CONSENT_REQUIRED" });
  });

  test("creates a user with consent and stores the consent version", async () => {
    const outcome = await upsertUserFromIdentity(db, identity(), CONSENT);

    expect(outcome.ok && outcome.created).toBe(true);
    expect(outcome.ok && outcome.user.displayName).toBe("Аня");
    const [row] = await db.select().from(users);
    expect(row).toMatchObject({ consentVersion: "2026-09-v1", consentedAt: CONSENT.at, deletedAt: null });
  });

  test("finds the existing user on the next login without a new consent and refreshes the name", async () => {
    const first = await upsertUserFromIdentity(db, identity(), CONSENT);

    const second = await upsertUserFromIdentity(db, identity({ displayName: "Анна" }), null);

    expect(second.ok && second.created).toBe(false);
    expect(second.ok && second.user.id).toBe(first.ok && first.user.id);
    expect(second.ok && (await getUser(db, second.user.id))?.displayName).toBe("Анна");
  });

  test("records a newer consent for a returning user", async () => {
    const first = await upsertUserFromIdentity(db, identity(), CONSENT);
    const newer = { version: "2026-10-v2", at: new Date("2026-10-01T10:00:00Z") };

    await upsertUserFromIdentity(db, identity(), newer);

    const [row] = await db.select().from(users);
    expect(first.ok).toBe(true);
    expect(row).toMatchObject({ consentVersion: "2026-10-v2", consentedAt: newer.at });
  });
});

describe("getUser", () => {
  test("returns null for an unknown or malformed id", async () => {
    expect(await getUser(db, "00000000-0000-0000-0000-000000000000")).toBeNull();
    expect(await getUser(db, "not-a-uuid")).toBeNull();
  });
});
