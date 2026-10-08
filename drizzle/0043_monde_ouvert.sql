-- US-0414 : le Monde du jeu est désigné, et non plus le premier par identifiant : c'est le Monde ouvert et pas
-- encore fermé, un seul à la fois, où naissent les chefs. Le plus ancien, Aube, l'est depuis sa naissance : rien
-- ne change à la mise en ligne. Seule une bascule (npm run monde:basculer, jamais lancée à la mise en ligne)
-- ouvre ensuite un Monde généré en entier et ferme l'ancien.
-- « if not exists » et la dernière condition : la migration se rejoue sans erreur ni changement.
ALTER TABLE "monde" ADD COLUMN IF NOT EXISTS "ouvert_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "monde" ADD COLUMN IF NOT EXISTS "ferme_le" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monde_un_seul_ouvert" ON "monde" USING btree ((true)) WHERE "monde"."ouvert_le" is not null and "monde"."ferme_le" is null;--> statement-breakpoint
UPDATE "monde" SET "ouvert_le" = "ne_le" WHERE "id" = (SELECT min("id") FROM "monde") AND NOT EXISTS (SELECT 1 FROM "monde" WHERE "ouvert_le" IS NOT NULL);
