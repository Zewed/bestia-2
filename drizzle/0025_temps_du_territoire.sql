ALTER TABLE "territoire" ADD COLUMN "calcule_jusqu_a" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
-- Un Territoire déjà né a été calculé jusqu'à sa naissance.
UPDATE "territoire" SET "calcule_jusqu_a" = "ne_le";
--> statement-breakpoint
-- Son marque-page ne recule jamais, comme celui du Monde.
CREATE TRIGGER "territoire_temps_ne_recule_jamais" BEFORE UPDATE OF "calcule_jusqu_a" ON "territoire" FOR EACH ROW EXECUTE FUNCTION "temps_ne_recule_jamais"();
