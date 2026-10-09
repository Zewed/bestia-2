-- US-0975 : les Bêtes de naissance, communes, posées autour de chaque nouveau Foyer et réservées à son Territoire, écrites
-- avec leur Case, leur Espèce et leur présence (src/monde/betes-de-naissance.ts) ; et, sur chaque Territoire, l'instant où
-- il les a reçues : null pour les Territoires déjà nés, qui les recevront au retour de leur chef, une seule fois.
CREATE TABLE "bete_de_naissance" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bete_de_naissance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"territoire_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"espece_id" text NOT NULL,
	"arrivee" timestamp with time zone NOT NULL,
	"depart" timestamp with time zone NOT NULL,
	CONSTRAINT "bete_de_naissance_une_par_case" UNIQUE("territoire_id","case_id"),
	CONSTRAINT "bete_de_naissance_depart_apres_arrivee" CHECK ("bete_de_naissance"."depart" > "bete_de_naissance"."arrivee")
);
--> statement-breakpoint
ALTER TABLE "territoire" ADD COLUMN "betes_de_naissance_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bete_de_naissance" ADD CONSTRAINT "bete_de_naissance_territoire_id_territoire_id_fk" FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bete_de_naissance" ADD CONSTRAINT "bete_de_naissance_case_id_case_du_monde_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case_du_monde"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bete_de_naissance" ADD CONSTRAINT "bete_de_naissance_espece_id_espece_id_fk" FOREIGN KEY ("espece_id") REFERENCES "public"."espece"("id") ON DELETE no action ON UPDATE no action;