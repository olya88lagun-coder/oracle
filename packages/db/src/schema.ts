import { date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const authProviderEnum = pgEnum("auth_provider", ["vk"]);
export const productEnum = pgEnum("product", ["matrix_report"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["pending", "succeeded", "canceled"]);

export type AuthProvider = (typeof authProviderEnum.enumValues)[number];
export type PurchaseStatus = (typeof purchaseStatusEnum.enumValues)[number];

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

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Пользователь при удалении данных только помечается, поэтому ссылка всегда жива: запись об оплате нужна для налогового учёта
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    product: productEnum("product").notNull(),
    // Снимок даты на момент покупки: смена даты в портрете разбор не трогает. Дата и e-mail стираются при удалении данных
    birthDate: date("birth_date", { mode: "string" }),
    receiptEmail: text("receipt_email"),
    amountKopecks: integer("amount_kopecks").notNull(),
    status: purchaseStatusEnum("status").notNull().default("pending"),
    yookassaPaymentId: text("yookassa_payment_id").unique(),
    confirmationUrl: text("confirmation_url"),
    createdAt: createdAt(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("purchases_user_idx").on(t.userId, t.createdAt)],
);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .unique()
    .references(() => purchases.id, { onDelete: "cascade" }),
  chapters: jsonb("chapters").notNull(),
  createdAt: createdAt(),
});
