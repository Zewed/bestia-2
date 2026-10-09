-- US-0920 : l'instant du jeu où le joueur a rappelé une Expédition (null sans rappel) : elle fait demi-tour aussitôt, et
-- son retour dure le temps d'aller déjà fait (src/expeditions/phase.ts). Une Expédition ne se rappelle qu'une fois
-- partie. Purement additive : aucune Expédition déjà partie n'a été rappelée.
ALTER TABLE "expedition" ADD COLUMN "rappelee_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expedition" ADD CONSTRAINT "expedition_rappelee_apres_son_depart" CHECK ("expedition"."rappelee_le" >= "expedition"."part_le");