import { eq } from "drizzle-orm";
import { birthProfiles } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

// Дата уже проверена parseBirthDate из @oracle/core: сюда приходит только "YYYY-MM-DD"
export async function saveBirthDate(db: Database, userId: string, isoDate: string, now: Date): Promise<void> {
  await db
    .insert(birthProfiles)
    .values({ userId, birthDate: isoDate, updatedAt: now })
    .onConflictDoUpdate({ target: birthProfiles.userId, set: { birthDate: isoDate, updatedAt: now } });
}

export async function getBirthDate(db: Database, userId: string): Promise<string | null> {
  if (!isUuid(userId)) return null;
  const [row] = await db.select({ birthDate: birthProfiles.birthDate }).from(birthProfiles).where(eq(birthProfiles.userId, userId)).limit(1);
  return row?.birthDate ?? null;
}
