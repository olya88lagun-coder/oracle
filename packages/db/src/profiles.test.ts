import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";
import {
  birthProfiles,
  createTestDb,
  getBirthDate,
  getBirthProfile,
  saveBirthDate,
  saveBirthPlace,
  seedUser,
  type BirthPlace,
  type Database,
} from "./testing";

const NOW = new Date("2026-09-24T10:00:00Z");
const MOSCOW: BirthPlace = { name: "Москва", latitude: 55.7558, longitude: 37.6173, zone: "Europe/Moscow" };

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

describe("birth profile with time and place", () => {
  test("is null for a new user and for a malformed id", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-p0" });

    expect(await getBirthProfile(db, userId)).toBeNull();
    expect(await getBirthProfile(db, "not-a-uuid")).toBeNull();
  });

  test("round trip: date, time as HH:MM and the place", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-p1" });

    await saveBirthPlace(db, userId, { birthDate: "1990-03-07", time: "12:05", place: MOSCOW }, NOW);

    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1990-03-07", time: "12:05", place: MOSCOW });
    expect(await getBirthDate(db, userId)).toBe("1990-03-07");
  });

  test("keeps an unknown time as null next to the place", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-p2" });

    await saveBirthPlace(db, userId, { birthDate: "1990-03-07", time: null, place: MOSCOW }, NOW);

    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1990-03-07", time: null, place: MOSCOW });
  });

  test("a second save replaces everything", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-p3" });
    const other: BirthPlace = { name: "Новосибирск", latitude: 55.03, longitude: 82.92, zone: "Asia/Novosibirsk" };

    await saveBirthPlace(db, userId, { birthDate: "1990-03-07", time: "12:05", place: MOSCOW }, NOW);
    await saveBirthPlace(db, userId, { birthDate: "1991-04-08", time: null, place: other }, NOW);

    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1991-04-08", time: null, place: other });
  });

  test("a profile with only a date has no time and no place", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-p4" });

    await saveBirthDate(db, userId, "1990-03-07", NOW);

    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1990-03-07", time: null, place: null });
  });

  test("the matrix save of the same date keeps the time and the place", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-p5" });
    await saveBirthPlace(db, userId, { birthDate: "1990-03-07", time: "12:05", place: MOSCOW }, NOW);

    await saveBirthDate(db, userId, "1990-03-07", NOW);

    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1990-03-07", time: "12:05", place: MOSCOW });
  });

  test("the matrix save of another date clears the time and the place", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-p6" });
    await saveBirthPlace(db, userId, { birthDate: "1990-03-07", time: "12:05", place: MOSCOW }, NOW);

    await saveBirthDate(db, userId, "1991-04-08", NOW);

    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1991-04-08", time: null, place: null });
  });
});

describe("birth_profiles CHECK constraints (raw statements, bypassing the TypeScript types)", () => {
  test("rejects a partial place", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-c1" });

    await expect(db.execute(sql`insert into birth_profiles (user_id, birth_date, birth_place_name) values (${userId}, '1990-03-07', 'Москва')`)).rejects.toThrow();
    await expect(
      db.execute(
        sql`insert into birth_profiles (user_id, birth_date, birth_place_name, birth_latitude, birth_longitude) values (${userId}, '1990-03-07', 'Москва', 55, 37)`,
      ),
    ).rejects.toThrow();
    await expect(
      db.execute(
        sql`insert into birth_profiles (user_id, birth_date, birth_latitude, birth_longitude, birth_zone) values (${userId}, '1990-03-07', 55, 37, 'Europe/Moscow')`,
      ),
    ).rejects.toThrow();
    expect(await getBirthProfile(db, userId)).toBeNull();
  });

  test("rejects a time without a place", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-c2" });

    await expect(db.execute(sql`insert into birth_profiles (user_id, birth_date, birth_time) values (${userId}, '1990-03-07', '12:00')`)).rejects.toThrow();
  });

  test("rejects an update that leaves a partial place or a time without a place", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-c3" });
    await saveBirthPlace(db, userId, { birthDate: "1990-03-07", time: "12:05", place: MOSCOW }, NOW);

    await expect(db.execute(sql`update birth_profiles set birth_zone = null where user_id = ${userId}`)).rejects.toThrow();
    await expect(
      db.execute(
        sql`update birth_profiles set birth_place_name = null, birth_latitude = null, birth_longitude = null, birth_zone = null where user_id = ${userId}`,
      ),
    ).rejects.toThrow();
    expect(await getBirthProfile(db, userId)).toEqual({ birthDate: "1990-03-07", time: "12:05", place: MOSCOW });
  });

  test("accepts a full place with a null time and a date-only row", async () => {
    const { userId } = await seedUser(db, { externalId: "vk-c4" });
    const { userId: other } = await seedUser(db, { externalId: "vk-c5" });

    await db.insert(birthProfiles).values({ userId, birthDate: "1990-03-07", birthPlaceName: "Москва", birthLatitude: 55, birthLongitude: 37, birthZone: "Europe/Moscow" });
    await db.insert(birthProfiles).values({ userId: other, birthDate: "1990-03-07" });

    expect(await getBirthProfile(db, userId)).toMatchObject({ time: null, place: { name: "Москва" } });
    expect(await getBirthProfile(db, other)).toEqual({ birthDate: "1990-03-07", time: null, place: null });
  });
});
