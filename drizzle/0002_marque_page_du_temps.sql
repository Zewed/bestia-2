ALTER TABLE "monde" ADD COLUMN "calcule_jusqu_a" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
-- Un Monde déjà né a été calculé jusqu'à sa naissance.
UPDATE "monde" SET "calcule_jusqu_a" = "ne_le";
--> statement-breakpoint
-- Le marque-page du temps ne recule jamais : sinon, les mêmes heures seraient comptées deux fois.
-- La fonction sert à toute table qui a une colonne calcule_jusqu_a (les Territoires plus tard).
CREATE FUNCTION "temps_ne_recule_jamais"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."calcule_jusqu_a" < OLD."calcule_jusqu_a" THEN
    RAISE EXCEPTION 'Le temps ne recule jamais : % est avant %.', NEW."calcule_jusqu_a", OLD."calcule_jusqu_a";
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "monde_temps_ne_recule_jamais" BEFORE UPDATE OF "calcule_jusqu_a" ON "monde" FOR EACH ROW EXECUTE FUNCTION "temps_ne_recule_jamais"();
