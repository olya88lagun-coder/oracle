# Задача 2 — `packages/db`: пользователи, вход, профиль рождения, удаление данных

**Files:**
- Create (перенос из Граней без правок): `packages/db/tsconfig.json`, `packages/db/vitest.config.ts`, `packages/db/drizzle.config.ts`, `packages/db/scripts/dev-db.mjs`, `packages/db/scripts/migrate.mjs`, `packages/db/src/client.ts`, `packages/db/src/types.ts`, `packages/db/src/uuid.ts`
- Create: `packages/db/package.json`, `packages/db/src/schema.ts`, `packages/db/src/users.ts`, `packages/db/src/profiles.ts`, `packages/db/src/delete-user.ts`, `packages/db/src/testing.ts`, `packages/db/src/index.ts`
- Test: `packages/db/src/users.test.ts`, `packages/db/src/profiles.test.ts`, `packages/db/src/delete-user.test.ts`
- Create (генерирует drizzle-kit): `packages/db/drizzle/0000_*.sql`, `packages/db/drizzle/meta/*`

**Interfaces:**
- Consumes: —
- Produces (всё экспортируется из `@oracle/db`, тестовые помощники — из `@oracle/db/testing`):
  - `type Database`; `createDb(databaseUrl: string, options?: { maxConnections?: number }): Database`
  - таблицы `users`, `authIdentities`, `birthProfiles`; `type AuthProvider = "vk"`
  - `type IdentityInput = { provider: AuthProvider; externalId: string; displayName: string }`
  - `type Consent = { version: string; at: Date }`
  - `type UserRecord = { id: string; displayName: string }`
  - `upsertUserFromIdentity(db, identity: IdentityInput, consent: Consent | null): Promise<{ ok: true; user: UserRecord; created: boolean } | { ok: false; reason: "CONSENT_REQUIRED" }>`
  - `getUser(db, userId: string): Promise<UserRecord | null>` — `null` для удалённых и не-UUID
  - `saveBirthDate(db, userId: string, isoDate: string, now: Date): Promise<void>` — вставка или замена
  - `getBirthDate(db, userId: string): Promise<string | null>` — `"YYYY-MM-DD"`
  - `deleteUserData(db, userId: string): Promise<{ deleted: boolean }>`
  - `createTestDb(): Promise<Database>`; `seedUser(db, p: { externalId: string; displayName?: string }): Promise<{ userId: string }>`

## Зачем

Портрет хранит дату рождения на сервере, чтобы её переиспользовали все практики и она была доступна с любого устройства (спецификация 3). Пользователь создаётся только с согласием (152-ФЗ). Удаление данных — обязательная кнопка: удаляются профиль рождения и способы входа, пользователь помечается `deleted_at`. Мягкое удаление пользователя нужно заранее: в плане 2 на пользователя будут ссылаться покупки, которые хранятся для налогового учёта.

Схема повторяет Грани, но без пола (обращение нейтральное) и без Telegram (вход только через VK ID). Дата рождения — отдельная таблица `birth_profiles`: в плане 6 в неё добавятся время и город рождения.

## Шаги

- [ ] **Шаг 1. Перенос неизменных файлов.**

```bash
cd /c/dev/oracle
mkdir -p packages/db/src packages/db/scripts
G=/c/dev/grani-test/packages/db
cp $G/tsconfig.json $G/vitest.config.ts $G/drizzle.config.ts packages/db/
cp $G/scripts/dev-db.mjs $G/scripts/migrate.mjs packages/db/scripts/
cp $G/src/client.ts $G/src/types.ts $G/src/uuid.ts packages/db/src/
grep -rni grani packages/db || echo "clean"
```

Ожидается `clean`.

`packages/db/package.json`:

```json
{
  "name": "@oracle/db",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./testing": "./src/testing.ts"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": {
    "drizzle-orm": "0.45.2",
    "postgres": "3.4.9"
  },
  "devDependencies": {
    "@electric-sql/pglite": "0.5.8",
    "@electric-sql/pglite-socket": "0.2.11",
    "drizzle-kit": "0.31.10"
  }
}
```

- [ ] **Шаг 2. Схема.** `packages/db/src/schema.ts`:

```ts
import { date, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const authProviderEnum = pgEnum("auth_provider", ["vk"]);

export type AuthProvider = (typeof authProviderEnum.enumValues)[number];

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  consentVersion: text("consent_version").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const authIdentities = pgTable(
  "auth_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: authProviderEnum("provider").notNull(),
    externalId: text("external_id").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("auth_identities_provider_external_uq").on(t.provider, t.externalId),
    uniqueIndex("auth_identities_user_provider_uq").on(t.userId, t.provider),
  ],
);

// Время и город рождения добавятся вместе с натальной картой (план 6)
export const birthProfiles = pgTable("birth_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  birthDate: date("birth_date", { mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Шаг 3. Миграция.**

```bash
export PATH="/c/Users/olya8/AppData/Roaming/npm:$PATH"
pnpm install
pnpm --filter @oracle/db db:generate
ls packages/db/drizzle
grep -c "birth_profiles" packages/db/drizzle/0000_*.sql
```

Ожидается файл `0000_<случайное_имя>.sql` и ненулевое число строк с `birth_profiles`.

- [ ] **Шаг 4. Тестовые помощники.** `packages/db/src/testing.ts`:

```ts
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
```

`packages/db/src/index.ts`:

```ts
export * from "./schema";
export * from "./types";
export * from "./client";
export * from "./users";
export * from "./profiles";
export * from "./delete-user";
```

- [ ] **Шаг 5. Тесты пользователей (RED).** `packages/db/src/users.test.ts`:

```ts
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
```

`packages/db/src/profiles.test.ts`:

```ts
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
```

`packages/db/src/delete-user.test.ts`:

```ts
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
```

Запуск: `pnpm vitest run packages/db`. Ожидается FAIL: не найдены модули `./users`, `./profiles`, `./delete-user`.

- [ ] **Шаг 6. Реализация.** `packages/db/src/users.ts`:

```ts
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
```

`packages/db/src/profiles.ts`:

```ts
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
```

`packages/db/src/delete-user.ts`:

```ts
import { and, eq, isNull } from "drizzle-orm";
import { authIdentities, birthProfiles, users } from "./schema";
import type { Database } from "./types";
import { isUuid } from "./uuid";

// Пользователь не удаляется, а помечается: в плане 2 на него будут ссылаться покупки для налогового учёта.
// Способы входа удаляются — тот же аккаунт VK сможет зарегистрироваться заново как новый пользователь
export async function deleteUserData(db: Database, userId: string): Promise<{ deleted: boolean }> {
  if (!isUuid(userId)) return { deleted: false };
  return db.transaction(async (tx) => {
    const [marked] = await tx
      .update(users)
      .set({ deletedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning({ id: users.id });
    if (!marked) return { deleted: false };
    await tx.delete(birthProfiles).where(eq(birthProfiles.userId, userId));
    await tx.delete(authIdentities).where(eq(authIdentities.userId, userId));
    return { deleted: true };
  });
}
```

- [ ] **Шаг 7. GREEN.**

```bash
pnpm vitest run packages/db
pnpm typecheck
```

Ожидается: все тесты PASS.

- [ ] **Шаг 8. Локальная БД запускается.**

```bash
pnpm dev:db
```

Ожидается строка `dev db ready: postgres://postgres:postgres@127.0.0.1:5433/postgres`. Остановить `Ctrl+C`. Каталог `.dev-db/` в git не попадает (`.gitignore`).

- [ ] **Шаг 9. Коммит.**

```bash
git add packages/db pnpm-lock.yaml
git commit -m "feat(db): users, VK identities, birth profiles and data deletion"
```
