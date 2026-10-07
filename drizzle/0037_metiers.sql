CREATE TABLE "metier" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"phrase" text NOT NULL,
	"servira" text,
	"ordre" integer NOT NULL
);
--> statement-breakpoint
-- La table naît vide : donnees/metiers.yaml la remplit à la mise en ligne, après les migrations. La contrainte
-- tient dès maintenant, puisqu'aucun Habitant n'a encore de Métier.
ALTER TABLE "habitant" ADD CONSTRAINT "habitant_metier_metier_id_fk" FOREIGN KEY ("metier") REFERENCES "public"."metier"("id") ON DELETE no action ON UPDATE no action;
