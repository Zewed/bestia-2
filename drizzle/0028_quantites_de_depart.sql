ALTER TABLE "ressource" ADD COLUMN "au_depart" numeric(24, 6) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "ressource" ADD CONSTRAINT "ressource_au_depart_positif" CHECK ("ressource"."au_depart" >= 0);--> statement-breakpoint
-- 100 de chaque Ressource au départ, comme dans donnees/ressources.yaml, qui reste la référence.
UPDATE "ressource" SET "au_depart" = 100;
--> statement-breakpoint
-- Un Territoire naît avec la quantité de départ de chaque Ressource.
CREATE OR REPLACE FUNCTION "stocks_a_la_naissance"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "stock" ("territoire_id", "ressource_id", "quantite") SELECT NEW."id", "id", "au_depart" FROM "ressource";
  RETURN NEW;
END;
$$;
--> statement-breakpoint
-- Les Territoires déjà nés la reçoivent aussi, une seule fois : une migration ne passe qu'une fois.
UPDATE "stock" SET "quantite" = "stock"."quantite" + "ressource"."au_depart"
FROM "ressource" WHERE "ressource"."id" = "stock"."ressource_id";
