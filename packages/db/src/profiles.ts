import { eq, sql } from "drizzle-orm";
import { birthProfiles } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

export type BirthPlace = { name: string; latitude: number; longitude: number; zone: string };
// time — "HH:MM" или null (время неизвестно); place — null, пока карту не сохраняли
export type BirthProfile = { birthDate: string; time: string | null; place: BirthPlace | null };

// Дата уже проверена parseBirthDate из @oracle/core: сюда приходит только "YYYY-MM-DD".
// Время и место рождения остаются, только если дата не изменилась: иначе они относились бы к другому дню.
// Одним оператором: сравнение идёт со значением, которое лежит в базе до обновления
export async function saveBirthDate(db: Database, userId: string, isoDate: string, now: Date): Promise<void> {
  const sameDate = sql`"birth_profiles"."birth_date" = ${isoDate}::date`;
  const keep = (column: string) => sql`CASE WHEN ${sameDate} THEN ${sql.raw(`"birth_profiles"."${column}"`)} ELSE NULL END`;
  await db
    .insert(birthProfiles)
    .values({ userId, birthDate: isoDate, updatedAt: now })
    .onConflictDoUpdate({
      target: birthProfiles.userId,
      set: {
        birthDate: isoDate,
        birthTime: keep("birth_time"),
        birthPlaceName: keep("birth_place_name"),
        birthLatitude: keep("birth_latitude"),
        birthLongitude: keep("birth_longitude"),
        birthZone: keep("birth_zone"),
        updatedAt: now,
      },
    });
}

// Одна запись: дата, время и место сохраняются вместе (дата общая с матрицей). Данные уже проверены сервисом
export async function saveBirthPlace(
  db: Database,
  userId: string,
  profile: { birthDate: string; time: string | null; place: BirthPlace },
  now: Date,
): Promise<void> {
  const columns = {
    birthDate: profile.birthDate,
    birthTime: profile.time,
    birthPlaceName: profile.place.name,
    birthLatitude: profile.place.latitude,
    birthLongitude: profile.place.longitude,
    birthZone: profile.place.zone,
    updatedAt: now,
  };
  await db
    .insert(birthProfiles)
    .values({ userId, ...columns })
    .onConflictDoUpdate({ target: birthProfiles.userId, set: columns });
}

export async function getBirthDate(db: Database, userId: string): Promise<string | null> {
  if (!isUuid(userId)) return null;
  const [row] = await db.select({ birthDate: birthProfiles.birthDate }).from(birthProfiles).where(eq(birthProfiles.userId, userId)).limit(1);
  return row?.birthDate ?? null;
}

export async function getBirthProfile(db: Database, userId: string): Promise<BirthProfile | null> {
  if (!isUuid(userId)) return null;
  const [row] = await db.select().from(birthProfiles).where(eq(birthProfiles.userId, userId)).limit(1);
  if (!row) return null;
  const place =
    row.birthPlaceName !== null && row.birthLatitude !== null && row.birthLongitude !== null && row.birthZone !== null
      ? { name: row.birthPlaceName, latitude: row.birthLatitude, longitude: row.birthLongitude, zone: row.birthZone }
      : null;
  return { birthDate: row.birthDate, time: row.birthTime ? row.birthTime.slice(0, 5) : null, place };
}
