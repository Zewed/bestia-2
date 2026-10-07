ALTER TABLE "voyageur" ADD COLUMN "sort" text;--> statement-breakpoint
ALTER TABLE "voyageur" ADD COLUMN "sort_le" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "voyageur_aux_portes" ON "voyageur" USING btree ("territoire_id") WHERE "voyageur"."sort" is null;--> statement-breakpoint
ALTER TABLE "voyageur" ADD CONSTRAINT "voyageur_sort_connu" CHECK ("voyageur"."sort" in ('accueilli', 'refuse', 'reparti'));--> statement-breakpoint
ALTER TABLE "voyageur" ADD CONSTRAINT "voyageur_sort_date" CHECK (("voyageur"."sort" is null) = ("voyageur"."sort_le" is null));--> statement-breakpoint
-- US-0337 : chaque Voyageur qui attend déjà aux portes reçoit son départ, à l'instant que le jeu donne à ceux qui
-- arriveront (departDuVoyageur, src/monde/voyageurs.ts) : VOYAGEUR_ATTEND_HEURES (12 heures) après son arrivée. Un
-- départ déjà passé s'applique au prochain rattrapage du Territoire, à son marque-page : le temps ne recule pas.
INSERT INTO "evenement" ("element", "element_id", "survient_le", "type", "donnees")
SELECT 'territoire', "territoire_id", "arrive_le" + interval '12 hours', 'depart_voyageur', jsonb_build_object('voyageur', "id")
FROM "voyageur"
WHERE "sort" IS NULL;
