import { and, asc, eq, isNull } from "drizzle-orm";
import { authIdentities, type AuthProvider, users } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

export type IdentityInput = { provider: AuthProvider; externalId: string; displayName: string };
export type Consent = { version: string; at: Date };
export type UserRecord = { id: string; displayName: string };
export type UpsertOutcome = { ok: true; user: UserRecord; created: boolean } | { ok: false; reason: "CONSENT_REQUIRED" };

async function findOwner(db: Database, provider: AuthProvider, externalId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: authIdentities.userId })
    .from(authIdentities)
    .innerJoin(users, eq(users.id, authIdentities.userId))
    .where(and(eq(authIdentities.provider, provider), eq(authIdentities.externalId, externalId), isNull(users.deletedAt)))
    .limit(1);
  return row?.userId ?? null;
}

export async function upsertUserFromIdentity(db: Database, identity: IdentityInput, consent: Consent | null): Promise<UpsertOutcome> {
  const ownerId = await findOwner(db, identity.provider, identity.externalId);
  if (ownerId) {
    await db.transaction(async (tx) => {
      await tx
        .update(authIdentities)
        .set({ displayName: identity.displayName })
        .where(and(eq(authIdentities.provider, identity.provider), eq(authIdentities.externalId, identity.externalId)));
      if (consent) await tx.update(users).set({ consentVersion: consent.version, consentedAt: consent.at }).where(eq(users.id, ownerId));
    });
    return { ok: true, created: false, user: { id: ownerId, displayName: identity.displayName } };
  }
  if (!consent) return { ok: false, reason: "CONSENT_REQUIRED" };
  const user = await db.transaction(async (tx) => {
    const [created] = await tx.insert(users).values({ consentVersion: consent.version, consentedAt: consent.at }).returning({ id: users.id });
    await tx.insert(authIdentities).values({
      userId: created!.id,
      provider: identity.provider,
      externalId: identity.externalId,
      displayName: identity.displayName,
    });
    return created!;
  });
  return { ok: true, created: true, user: { id: user.id, displayName: identity.displayName } };
}

export async function getUser(db: Database, userId: string): Promise<UserRecord | null> {
  if (!isUuid(userId)) return null;
  const [row] = await db
    .select({ id: users.id, displayName: authIdentities.displayName })
    .from(users)
    .innerJoin(authIdentities, eq(authIdentities.userId, users.id))
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .orderBy(asc(authIdentities.createdAt))
    .limit(1);
  return row ?? null;
}
