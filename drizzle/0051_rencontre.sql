-- US-0932 : les Rencontres, chaque Bête sauvage qu'une Expédition a vue sur sa Case pendant son séjour, à l'instant du
-- jeu de son apparition, ou de l'arrivée de l'Expédition si elle était déjà là : une Bête sauvage ordinaire par son numéro
-- sur la Case, une Bête de naissance par sa ligne, avec son Espèce et l'instant de son apparition
-- (src/expeditions/rencontres.ts). Purement additive : les Rencontres s'écrivent à mesure que le temps avance.
CREATE TABLE "rencontre" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rencontre_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"expedition_id" integer NOT NULL,
	"numero" bigint,
	"bete_de_naissance_id" integer,
	"espece_id" text NOT NULL,
	"apparue_le" timestamp with time zone NOT NULL,
	"vue_le" timestamp with time zone NOT NULL,
	CONSTRAINT "rencontre_une_par_bete_sauvage" UNIQUE("expedition_id","numero"),
	CONSTRAINT "rencontre_une_par_bete_de_naissance" UNIQUE("expedition_id","bete_de_naissance_id"),
	CONSTRAINT "rencontre_une_bete" CHECK (("rencontre"."numero" is null) <> ("rencontre"."bete_de_naissance_id" is null)),
	CONSTRAINT "rencontre_apres_l_apparition" CHECK ("rencontre"."vue_le" >= "rencontre"."apparue_le")
);
--> statement-breakpoint
ALTER TABLE "rencontre" ADD CONSTRAINT "rencontre_expedition_id_expedition_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expedition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rencontre" ADD CONSTRAINT "rencontre_bete_de_naissance_id_bete_de_naissance_id_fk" FOREIGN KEY ("bete_de_naissance_id") REFERENCES "public"."bete_de_naissance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rencontre" ADD CONSTRAINT "rencontre_espece_id_espece_id_fk" FOREIGN KEY ("espece_id") REFERENCES "public"."espece"("id") ON DELETE no action ON UPDATE no action;