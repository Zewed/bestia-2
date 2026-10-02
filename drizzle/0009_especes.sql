CREATE TYPE "public"."regime" AS ENUM('carnivore', 'herbivore', 'omnivore');--> statement-breakpoint
CREATE TABLE "espece" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"attaque" double precision NOT NULL,
	"vie" double precision NOT NULL,
	"vitesse" double precision NOT NULL,
	"charge" double precision NOT NULL,
	"taille" double precision NOT NULL,
	"regime" "regime" NOT NULL,
	"entretien_par_heure" double precision NOT NULL,
	"biome_id" text NOT NULL,
	"rarete_id" text NOT NULL,
	"role_id" text,
	"illustration" text,
	"source" text,
	CONSTRAINT "espece_attaque_positive" CHECK ("espece"."attaque" >= 0),
	CONSTRAINT "espece_vie_positive" CHECK ("espece"."vie" > 0),
	CONSTRAINT "espece_vitesse_positive" CHECK ("espece"."vitesse" > 0),
	CONSTRAINT "espece_charge_positive" CHECK ("espece"."charge" >= 0),
	CONSTRAINT "espece_taille_positive" CHECK ("espece"."taille" > 0),
	CONSTRAINT "espece_entretien_positif" CHECK ("espece"."entretien_par_heure" >= 0)
);
--> statement-breakpoint
ALTER TABLE "espece" ADD CONSTRAINT "espece_biome_id_biome_id_fk" FOREIGN KEY ("biome_id") REFERENCES "public"."biome"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "espece" ADD CONSTRAINT "espece_rarete_id_rarete_id_fk" FOREIGN KEY ("rarete_id") REFERENCES "public"."rarete"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "espece" ADD CONSTRAINT "espece_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;