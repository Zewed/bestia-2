-- US-0325 : l'instant exact où la Famine a commencé, tenu à jour par le mécanisme du temps (PRODUIRE,
-- src/monde/production.ts), comme famine_imminente_depuis. Rien à remplir : un Territoire déjà en Famine reçoit son
-- état à son premier rattrapage, daté du marque-page d'où ce rattrapage part, sans remonter dans le passé.
ALTER TABLE "territoire" ADD COLUMN "famine_depuis" timestamp with time zone;
