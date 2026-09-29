CREATE TYPE "public"."lila_mode" AS ENUM('free', 'guided');--> statement-breakpoint
CREATE TYPE "public"."lila_status" AS ENUM('awaiting_payment', 'active', 'finished', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."lila_transition" AS ENUM('none', 'snake', 'arrow');--> statement-breakpoint
CREATE TABLE "lila_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mode" "lila_mode" DEFAULT 'free' NOT NULL,
	"status" "lila_status" DEFAULT 'active' NOT NULL,
	"intention" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"moves_count" smallint DEFAULT 0 NOT NULL,
	"purchase_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "lila_games_purchase_id_unique" UNIQUE("purchase_id")
);
--> statement-breakpoint
CREATE TABLE "lila_moves" (
	"game_id" uuid NOT NULL,
	"n" smallint NOT NULL,
	"roll" smallint NOT NULL,
	"from_cell" smallint NOT NULL,
	"landed_cell" smallint NOT NULL,
	"to_cell" smallint NOT NULL,
	"transition" "lila_transition" NOT NULL,
	"custom_die" boolean DEFAULT false NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lila_moves_game_id_n_pk" PRIMARY KEY("game_id","n")
);
--> statement-breakpoint
ALTER TABLE "lila_games" ADD CONSTRAINT "lila_games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lila_games" ADD CONSTRAINT "lila_games_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lila_moves" ADD CONSTRAINT "lila_moves_game_id_lila_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."lila_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lila_games_one_active_uq" ON "lila_games" USING btree ("user_id") WHERE "lila_games"."status" = 'active';--> statement-breakpoint
CREATE INDEX "lila_games_user_idx" ON "lila_games" USING btree ("user_id","created_at");