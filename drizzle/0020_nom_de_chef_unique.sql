ALTER TABLE "chef" ADD COLUMN "cle_nom" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chef" ADD CONSTRAINT "chef_nom_unique_dans_le_monde" UNIQUE("monde_id","cle_nom");--> statement-breakpoint
ALTER TABLE "chef" ADD CONSTRAINT "chef_cle_nom_a_plat" CHECK ("chef"."cle_nom" ~ '^[a-z0-9]+$');