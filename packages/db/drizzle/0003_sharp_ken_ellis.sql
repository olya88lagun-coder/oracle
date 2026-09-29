CREATE TYPE "public"."guide_source" AS ENUM('ai', 'none');--> statement-breakpoint
ALTER TYPE "public"."product" ADD VALUE 'lila_session';--> statement-breakpoint
CREATE TABLE "lila_conclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"chapters" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lila_conclusions_game_id_unique" UNIQUE("game_id")
);
--> statement-breakpoint
ALTER TABLE "lila_moves" ADD COLUMN "guide_text" text;--> statement-breakpoint
ALTER TABLE "lila_moves" ADD COLUMN "guide_source" "guide_source";--> statement-breakpoint
ALTER TABLE "lila_conclusions" ADD CONSTRAINT "lila_conclusions_game_id_lila_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."lila_games"("id") ON DELETE cascade ON UPDATE no action;