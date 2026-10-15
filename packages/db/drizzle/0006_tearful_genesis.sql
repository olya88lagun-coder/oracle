ALTER TABLE "birth_profiles" ADD COLUMN "birth_time" time;--> statement-breakpoint
ALTER TABLE "birth_profiles" ADD COLUMN "birth_place_name" text;--> statement-breakpoint
ALTER TABLE "birth_profiles" ADD COLUMN "birth_latitude" double precision;--> statement-breakpoint
ALTER TABLE "birth_profiles" ADD COLUMN "birth_longitude" double precision;--> statement-breakpoint
ALTER TABLE "birth_profiles" ADD COLUMN "birth_zone" text;--> statement-breakpoint
ALTER TABLE "birth_profiles" ADD CONSTRAINT "birth_profiles_place_all_or_none" CHECK (("birth_profiles"."birth_place_name" IS NULL AND "birth_profiles"."birth_latitude" IS NULL AND "birth_profiles"."birth_longitude" IS NULL AND "birth_profiles"."birth_zone" IS NULL)
        OR ("birth_profiles"."birth_place_name" IS NOT NULL AND "birth_profiles"."birth_latitude" IS NOT NULL AND "birth_profiles"."birth_longitude" IS NOT NULL AND "birth_profiles"."birth_zone" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "birth_profiles" ADD CONSTRAINT "birth_profiles_time_needs_place" CHECK ("birth_profiles"."birth_time" IS NULL OR "birth_profiles"."birth_place_name" IS NOT NULL);