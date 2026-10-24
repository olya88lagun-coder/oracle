import type { NatalSnapshot } from "@oracle/core";
import { sql } from "drizzle-orm";
import { boolean, check, date, doublePrecision, index, integer, jsonb, pgEnum, pgTable, primaryKey, smallint, text, time, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const authProviderEnum = pgEnum("auth_provider", ["vk"]);
export const productEnum = pgEnum("product", ["matrix_report", "lila_session", "natal_report"]);
export const guideSourceEnum = pgEnum("guide_source", ["ai", "none"]);
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

// Дата рождения общая для матрицы и натальной карты. Время (HH:MM; пусто = время неизвестно) и место рождения
// добавляются сохранением натальной карты. Колонки места — все пусты или все заполнены; время без места не хранится.
// Смена даты через матрицу стирает время и место (см. saveBirthDate)
export const birthProfiles = pgTable(
  "birth_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    birthDate: date("birth_date", { mode: "string" }).notNull(),
    birthTime: time("birth_time"),
    birthPlaceName: text("birth_place_name"),
    birthLatitude: doublePrecision("birth_latitude"),
    birthLongitude: doublePrecision("birth_longitude"),
    birthZone: text("birth_zone"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "birth_profiles_place_all_or_none",
      sql`(${t.birthPlaceName} IS NULL AND ${t.birthLatitude} IS NULL AND ${t.birthLongitude} IS NULL AND ${t.birthZone} IS NULL)
        OR (${t.birthPlaceName} IS NOT NULL AND ${t.birthLatitude} IS NOT NULL AND ${t.birthLongitude} IS NOT NULL AND ${t.birthZone} IS NOT NULL)`,
    ),
    check("birth_profiles_time_needs_place", sql`${t.birthTime} IS NULL OR ${t.birthPlaceName} IS NOT NULL`),
  ],
);

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
    // Натальный разбор: снимок данных рождения и ключ «те же данные» (дата, время, координаты); у остальных продуктов пусты. Стираются при удалении данных
    natalInput: jsonb("natal_input").$type<NatalSnapshot>(),
    inputKey: text("input_key"),
    receiptEmail: text("receipt_email"),
    // Чек «Мой налог» отправляет владелица вручную; когда отправила, ставится время, а почта стирается
    receiptSentAt: timestamp("receipt_sent_at", { withTimezone: true }),
    amountKopecks: integer("amount_kopecks").notNull(),
    status: purchaseStatusEnum("status").notNull().default("pending"),
    yookassaPaymentId: text("yookassa_payment_id").unique(),
    confirmationUrl: text("confirmation_url"),
    createdAt: createdAt(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("purchases_user_idx").on(t.userId, t.createdAt)],
);

// Одноразовое разрешение браузеру отправить событие покупки; не подтверждает доставку в Метрику.
export const purchaseAnalytics = pgTable("purchase_analytics", {
  purchaseId: uuid("purchase_id")
    .primaryKey()
    .references(() => purchases.id, { onDelete: "cascade" }),
  // Отдельный случайный идентификатор: номер покупки не уходит в аналитику.
  transactionId: uuid("transaction_id").notNull().defaultRandom().unique(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseId: uuid("purchase_id")
    .notNull()
    .unique()
    .references(() => purchases.id, { onDelete: "cascade" }),
  chapters: jsonb("chapters").notNull(),
  createdAt: createdAt(),
});

export const lilaModeEnum = pgEnum("lila_mode", ["free", "guided"]);
export const lilaStatusEnum = pgEnum("lila_status", ["awaiting_payment", "active", "finished", "abandoned"]);
export const lilaTransitionEnum = pgEnum("lila_transition", ["none", "snake", "arrow"]);

export type LilaMode = (typeof lilaModeEnum.enumValues)[number];
export type LilaGameStatus = (typeof lilaStatusEnum.enumValues)[number];

export const lilaGames = pgTable(
  "lila_games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    mode: lilaModeEnum("mode").notNull().default("free"),
    status: lilaStatusEnum("status").notNull().default("active"),
    intention: text("intention").notNull(),
    position: smallint("position").notNull().default(0),
    movesCount: smallint("moves_count").notNull().default(0),
    purchaseId: uuid("purchase_id")
      .unique()
      .references(() => purchases.id),
    createdAt: createdAt(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    // Одна активная партия на человека
    uniqueIndex("lila_games_one_active_uq").on(t.userId).where(sql`${t.status} = 'active'`),
    // И одна ждущая оплаты: двойной клик «Начать с проводником» не создаёт две партии и два платежа
    uniqueIndex("lila_games_one_awaiting_uq").on(t.userId).where(sql`${t.status} = 'awaiting_payment'`),
    index("lila_games_user_idx").on(t.userId, t.createdAt),
  ],
);

export const lilaMoves = pgTable(
  "lila_moves",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => lilaGames.id, { onDelete: "cascade" }),
    n: smallint("n").notNull(),
    roll: smallint("roll").notNull(),
    fromCell: smallint("from_cell").notNull(),
    landedCell: smallint("landed_cell").notNull(),
    toCell: smallint("to_cell").notNull(),
    transition: lilaTransitionEnum("transition").notNull(),
    customDie: boolean("custom_die").notNull().default(false),
    note: text("note"),
    // Абзац проводника: null в guide_source — ещё пишется; «none» — не получился или не нужен (пустой ход, нет ключа)
    guideText: text("guide_text"),
    guideSource: guideSourceEnum("guide_source"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.n] })],
);

export const lilaConclusions = pgTable("lila_conclusions", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .notNull()
    .unique()
    .references(() => lilaGames.id, { onDelete: "cascade" }),
  chapters: jsonb("chapters").notNull(),
  createdAt: createdAt(),
});
