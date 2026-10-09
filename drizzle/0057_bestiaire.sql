-- US-0933 : le Bestiaire de chaque Territoire, une ligne par Espèce connue, avec son état (croisée, puis apprivoisée,
-- puis Couple réuni, dans l'ordre des valeurs), qui ne fait qu'avancer : l'instant du jeu de sa première Rencontre, et
-- cette Rencontre, que les récits signalent « Nouvelle Espèce au Bestiaire » (src/bestiaire/bestiaire.ts). Purement
-- additive.
CREATE TYPE "public"."etat_au_bestiaire" AS ENUM('croisee', 'apprivoisee', 'couple_reuni');--> statement-breakpoint
CREATE TABLE "bestiaire" (
	"territoire_id" integer NOT NULL,
	"espece_id" text NOT NULL,
	"etat" "etat_au_bestiaire" NOT NULL,
	"croisee_le" timestamp with time zone NOT NULL,
	"rencontre_id" integer,
	CONSTRAINT "bestiaire_territoire_id_espece_id_pk" PRIMARY KEY("territoire_id","espece_id"),
	CONSTRAINT "bestiaire_une_espece_par_rencontre" UNIQUE("rencontre_id")
);
--> statement-breakpoint
ALTER TABLE "bestiaire" ADD CONSTRAINT "bestiaire_territoire_id_territoire_id_fk" FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiaire" ADD CONSTRAINT "bestiaire_espece_id_espece_id_fk" FOREIGN KEY ("espece_id") REFERENCES "public"."espece"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bestiaire" ADD CONSTRAINT "bestiaire_rencontre_id_rencontre_id_fk" FOREIGN KEY ("rencontre_id") REFERENCES "public"."rencontre"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Les Rencontres déjà retenues (US-0932) inscrivent leurs Espèces, « croisées », comme le mécanisme du temps le fait
-- désormais : chacune à sa première Rencontre dans le Territoire, dans l'ordre où elles ont été vues, puis apparues.
-- Rejouable sans rien changer : une Espèce déjà inscrite ne l'est pas deux fois.
INSERT INTO "bestiaire" ("territoire_id", "espece_id", "etat", "croisee_le", "rencontre_id")
SELECT DISTINCT ON (x."territoire_id", r."espece_id") x."territoire_id", r."espece_id", 'croisee', r."vue_le", r."id"
FROM "rencontre" r JOIN "expedition" x ON x."id" = r."expedition_id"
ORDER BY x."territoire_id", r."espece_id", r."vue_le", r."apparue_le", r."id"
ON CONFLICT DO NOTHING;
