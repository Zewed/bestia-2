-- US-0904 : l'effectif d'un Territoire, ses Bêtes apprivoisées comptées par Espèce et par sexe (ADR 0002), qui part avec
-- lui. Vide pour tous : les premières Bêtes viendront des Expéditions (ADR 0008, US-0937, US-0938).
CREATE TYPE "public"."sexe" AS ENUM('male', 'femelle');--> statement-breakpoint
CREATE TABLE "effectif" (
	"territoire_id" integer NOT NULL,
	"espece_id" text NOT NULL,
	"sexe" "sexe" NOT NULL,
	"nombre" integer NOT NULL,
	CONSTRAINT "effectif_territoire_id_espece_id_sexe_pk" PRIMARY KEY("territoire_id","espece_id","sexe"),
	CONSTRAINT "effectif_jamais_negatif" CHECK ("effectif"."nombre" >= 0)
);
--> statement-breakpoint
ALTER TABLE "effectif" ADD CONSTRAINT "effectif_territoire_id_territoire_id_fk" FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "effectif" ADD CONSTRAINT "effectif_espece_id_espece_id_fk" FOREIGN KEY ("espece_id") REFERENCES "public"."espece"("id") ON DELETE no action ON UPDATE no action;