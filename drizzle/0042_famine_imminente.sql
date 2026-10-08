-- US-0322 : l'instant exact où la famine est devenue imminente, tenu à jour par le mécanisme du temps (PRODUIRE,
-- src/monde/production.ts). Rien à remplir : un Territoire déjà sous le seuil reçoit son état à son premier
-- rattrapage, daté du marque-page d'où ce rattrapage part, sans remonter dans le passé.
ALTER TABLE "territoire" ADD COLUMN "famine_imminente_depuis" timestamp with time zone;
