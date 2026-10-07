ALTER TABLE "stock" ADD COLUMN "plein_depuis" timestamp with time zone;--> statement-breakpoint
-- Les Stocks déjà pleins le sont depuis le dernier calcul de leur Territoire.
UPDATE "stock" SET "plein_depuis" = "territoire"."calcule_jusqu_a"
FROM "territoire" WHERE "territoire"."id" = "stock"."territoire_id" AND "stock"."quantite" >= "stock"."limite";
