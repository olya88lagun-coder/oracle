ALTER TYPE "public"."product" ADD VALUE 'natal_report';--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "natal_input" jsonb;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "input_key" text;