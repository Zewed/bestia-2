-- US-0414 : le Monde du jeu est désigné, et non plus le premier par identifiant : c'est le Monde ouvert et pas
-- encore fermé, un seul à la fois, où naissent les chefs. Le plus ancien, Aube, l'est depuis sa naissance : rien
-- ne change à la mise en ligne. Seule une bascule (npm run monde:basculer, jamais lancée à la mise en ligne)
-- ouvre ensuite un Monde généré en entier et ferme l'ancien.
-- « if not exists », « or replace » et la condition de l'UPDATE : la migration se rejoue sans erreur ni changement
-- (elle a d'abord paru avec US-0414 seule ; une base qui l'a reçue ainsi la rejoue).
ALTER TABLE "monde" ADD COLUMN IF NOT EXISTS "ouvert_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "monde" ADD COLUMN IF NOT EXISTS "ferme_le" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monde_un_seul_ouvert" ON "monde" USING btree ((true)) WHERE "monde"."ouvert_le" is not null and "monde"."ferme_le" is null;--> statement-breakpoint
UPDATE "monde" SET "ouvert_le" = "ne_le" WHERE "id" = (SELECT min("id") FROM "monde") AND NOT EXISTS (SELECT 1 FROM "monde" WHERE "ouvert_le" IS NOT NULL);--> statement-breakpoint
-- US-0416 : un Monde où des joueurs vivent ou ont vécu (il compte un chef, ou il a été ouvert) ne se régénère jamais :
-- la base refuse d'effacer ses Cases ou d'en changer la nature (place, anneau, Couronne, Cœur sauvage, Biome). Qui les
-- possède change toujours, et des Cases peuvent encore s'ajouter (npm run monde:couronne). Personne ne vide non plus
-- les Cases de tous les Mondes. Un nouveau Monde se génère à côté (npm run monde:generer).
CREATE OR REPLACE FUNCTION "case_d_un_monde_habite_intacte"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "monde" WHERE "id" = OLD."monde_id" AND "ouvert_le" IS NOT NULL)
     OR EXISTS (SELECT 1 FROM "chef" WHERE "monde_id" = OLD."monde_id") THEN
    RAISE EXCEPTION 'Un Monde où des joueurs vivent ou ont vécu ne se régénère jamais : ses Cases ne changent pas.';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "case_jamais_regeneree" BEFORE UPDATE OF "monde_id", "q", "r", "anneau", "couronne", "coeur", "eloignement", "biome_id", "variante_id" ON "case_du_monde" FOR EACH ROW
  WHEN ((OLD."monde_id", OLD."q", OLD."r", OLD."anneau", OLD."couronne", OLD."coeur", OLD."eloignement", OLD."biome_id", OLD."variante_id")
    IS DISTINCT FROM (NEW."monde_id", NEW."q", NEW."r", NEW."anneau", NEW."couronne", NEW."coeur", NEW."eloignement", NEW."biome_id", NEW."variante_id"))
  EXECUTE FUNCTION "case_d_un_monde_habite_intacte"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "case_jamais_effacee" BEFORE DELETE ON "case_du_monde" FOR EACH ROW EXECUTE FUNCTION "case_d_un_monde_habite_intacte"();
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "cases_jamais_videes" BEFORE TRUNCATE ON "case_du_monde" FOR EACH STATEMENT EXECUTE FUNCTION "monde_jamais_efface"();
