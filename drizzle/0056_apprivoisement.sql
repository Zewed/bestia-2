-- US-0934 : l'Apprivoisement : la Bête d'une Rencontre, à portée de l'escorte, suit l'Expédition depuis l'instant où elle
-- l'a vue (vue_le), et a quitté sa Case (src/expeditions/apprivoisement.ts). Une seule Expédition par Bête de naissance ;
-- une Bête sauvage ordinaire laisse sa trace dans bete_partie. Purement additive : les Rencontres déjà retenues n'ont
-- amené aucune Bête.
ALTER TABLE "rencontre" ADD COLUMN "apprivoisee" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "rencontre_une_expedition_par_bete_de_naissance" ON "rencontre" USING btree ("bete_de_naissance_id") WHERE "rencontre"."apprivoisee";