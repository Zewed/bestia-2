ALTER TABLE "ressource" ADD COLUMN "limite_au_depart" numeric(24, 6) DEFAULT '0' NOT NULL;--> statement-breakpoint
-- 1 000 de chaque Ressource au départ, comme dans donnees/ressources.yaml, qui reste la référence.
UPDATE "ressource" SET "limite_au_depart" = 1000;--> statement-breakpoint
ALTER TABLE "ressource" ADD CONSTRAINT "ressource_limite_positive" CHECK ("ressource"."limite_au_depart" > 0);--> statement-breakpoint
-- Les Stocks déjà là reçoivent la limite de départ de leur Ressource.
ALTER TABLE "stock" ADD COLUMN "limite" numeric(24, 6);--> statement-breakpoint
UPDATE "stock" SET "limite" = "ressource"."limite_au_depart" FROM "ressource" WHERE "ressource"."id" = "stock"."ressource_id";--> statement-breakpoint
ALTER TABLE "stock" ALTER COLUMN "limite" SET NOT NULL;--> statement-breakpoint
-- Un Territoire naît avec, pour chaque Ressource, sa quantité et sa limite de départ.
CREATE OR REPLACE FUNCTION "stocks_a_la_naissance"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "stock" ("territoire_id", "ressource_id", "quantite", "limite")
  SELECT NEW."id", "id", "au_depart", "limite_au_depart" FROM "ressource";
  RETURN NEW;
END;
$$;
