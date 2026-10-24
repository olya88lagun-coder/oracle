CREATE TABLE "purchase_analytics" (
	"purchase_id" uuid PRIMARY KEY NOT NULL,
	"transaction_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_analytics_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "purchase_analytics" ADD CONSTRAINT "purchase_analytics_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Historical successful purchases must not become new sales when old reports are reopened.
-- This records a consumed claim, not confirmation of analytics network delivery.
INSERT INTO "purchase_analytics" ("purchase_id")
SELECT "id" FROM "purchases" WHERE "status" = 'succeeded'
ON CONFLICT ("purchase_id") DO NOTHING;
