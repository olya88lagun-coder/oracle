import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";
import type { Database } from "./types";
import { upsertUserFromIdentity } from "./users";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

export async function createTestDb(): Promise<Database> {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder });
  return db as unknown as Database;
}

// Пользователь с согласием — общая подготовка для тестов репозиториев и сервисов
export async function seedUser(db: Database, p: { externalId: string; displayName?: string }): Promise<{ userId: string }> {
  const outcome = await upsertUserFromIdentity(
    db,
    { provider: "vk", externalId: p.externalId, displayName: p.displayName ?? p.externalId },
    { version: "test", at: new Date("2026-09-24T10:00:00Z") },
  );
  if (!outcome.ok) throw new Error("seed user was not created");
  return { userId: outcome.user.id };
}

export * from "./index";
