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
