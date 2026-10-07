-- US-0403 : le Cœur sauvage, au milieu du Monde, et sa taille, fixée sur la fiche du Monde. Un Monde déjà né
-- reçoit celle du réglage d'aujourd'hui (COEUR_SAUVAGE_RAYON = 8) : la changer plus tard ne le touchera pas.
-- Chaque Case sait si elle en fait partie ; aucune Case du Monde du jeu, qui n'a que sa Couronne, au bord.
-- US-0405 : chaque Case porte sa distance au Cœur sauvage, tirée de son anneau et de la taille du Cœur de son
-- Monde, comme eloignementDuCoeur (src/monde/hex.ts) : 0 pour les siennes. Rien d'autre ne change : ni les
-- Biomes, ni la Couronne, ni les Territoires.
-- « if not exists » : cette migration a d'abord paru avec US-0403 seule ; une base qui l'a reçue ainsi la rejoue
-- sans erreur.
ALTER TABLE "case_du_monde" ADD COLUMN IF NOT EXISTS "coeur" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "monde" ADD COLUMN IF NOT EXISTS "rayon_coeur" integer;--> statement-breakpoint
UPDATE "monde" SET "rayon_coeur" = 8 WHERE "rayon_coeur" IS NULL AND ("rayon" IS NOT NULL OR EXISTS (SELECT 1 FROM "case_du_monde" WHERE "case_du_monde"."monde_id" = "monde"."id"));--> statement-breakpoint
UPDATE "case_du_monde" SET "coeur" = true FROM "monde" WHERE "monde"."id" = "case_du_monde"."monde_id" AND "case_du_monde"."anneau" < "monde"."rayon_coeur";--> statement-breakpoint
ALTER TABLE "case_du_monde" ADD COLUMN "eloignement" integer;--> statement-breakpoint
UPDATE "case_du_monde" SET "eloignement" = greatest(0, "case_du_monde"."anneau" - ("monde"."rayon_coeur" - 1)) FROM "monde" WHERE "monde"."id" = "case_du_monde"."monde_id";--> statement-breakpoint
ALTER TABLE "case_du_monde" ALTER COLUMN "eloignement" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "case_du_monde" ADD CONSTRAINT "case_coeur_a_zero" CHECK ("case_du_monde"."eloignement" >= 0 and "case_du_monde"."coeur" = ("case_du_monde"."eloignement" = 0));
