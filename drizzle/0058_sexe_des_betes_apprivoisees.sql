-- US-0937 : le sexe de la Bête apprivoisée, mâle ou femelle, tiré à chances égales à l'Apprivoisement et retenu avec sa
-- Rencontre (src/expeditions/sexe.ts) : il ne change plus. Une Bête restée sur sa Case n'en a pas. Purement additive : les
-- Bêtes apprivoisées avant cette story reçoivent ici le leur, à chances égales, du premier octet d'un hachage de leur
-- Rencontre.
ALTER TABLE "rencontre" ADD COLUMN "sexe" "sexe";--> statement-breakpoint
UPDATE "rencontre"
SET "sexe" = CASE WHEN get_byte(decode(md5('US-0937 ' || "id"), 'hex'), 0) < 128 THEN 'male'::"sexe" ELSE 'femelle'::"sexe" END
WHERE "apprivoisee" AND "sexe" IS NULL;--> statement-breakpoint
ALTER TABLE "rencontre" ADD CONSTRAINT "rencontre_sexe_de_l_apprivoisee" CHECK (("rencontre"."sexe" is not null) = "rencontre"."apprivoisee");
