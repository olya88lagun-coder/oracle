CREATE TYPE "public"."auth_provider" AS ENUM('vk');--> statement-breakpoint
CREATE TABLE "auth_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"external_id" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "birth_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"birth_date" date NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consent_version" text NOT NULL,
	"consented_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "birth_profiles" ADD CONSTRAINT "birth_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_provider_external_uq" ON "auth_identities" USING btree ("provider","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_user_provider_uq" ON "auth_identities" USING btree ("user_id","provider");