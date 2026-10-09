-- US-0940 : le récit de Rencontre d'un retour d'Expédition : chaque Bête vue, à son heure, et ce qu'il en advint
-- (src/monde/recits.ts), retenu avec le Récit. Purement additive : les Récits déjà écrits restent du texte (null).
ALTER TABLE "recit" ADD COLUMN "rencontres" jsonb;