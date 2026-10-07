ALTER TABLE "stock" ADD COLUMN "produit_depuis_visite" numeric(24, 6) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "territoire" ADD COLUMN "vu_le" timestamp with time zone;