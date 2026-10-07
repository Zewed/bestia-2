-- US-0403 : le Cœur sauvage, au milieu du Monde, et sa taille, fixée sur la fiche du Monde. Un Monde dont la
-- taille est déjà fixée reçoit celle du réglage d'aujourd'hui (COEUR_SAUVAGE_RAYON = 8) : la changer plus tard
-- ne le touchera pas. Chaque Case sait si elle en fait partie ; aucune Case du Monde du jeu, qui n'a que sa
-- Couronne, au bord. Rien d'autre ne change : ni les Biomes, ni la Couronne, ni les Territoires.
ALTER TABLE "case_du_monde" ADD COLUMN "coeur" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "monde" ADD COLUMN "rayon_coeur" integer;--> statement-breakpoint
UPDATE "monde" SET "rayon_coeur" = 8 WHERE "rayon" IS NOT NULL;--> statement-breakpoint
UPDATE "case_du_monde" SET "coeur" = true FROM "monde" WHERE "monde"."id" = "case_du_monde"."monde_id" AND "case_du_monde"."anneau" < "monde"."rayon_coeur";
