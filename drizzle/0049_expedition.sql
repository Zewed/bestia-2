-- US-0911 : les Expéditions en cours, avec leur destination, leur départ, leur trajet (null pour une escorte tant
-- qu'US-0912 ne règle pas son allure) et leur séjour ; leur escorte, Espèce par Espèce ; et, sur chaque Habitant,
-- l'Expédition où il est parti (null : au Foyer). Purement additive : aucune Expédition n'existe encore.
CREATE TABLE "expedition" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "expedition_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"territoire_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"part_le" timestamp with time zone NOT NULL,
	"trajet_minutes" integer,
	"sejour_minutes" integer NOT NULL,
	CONSTRAINT "expedition_trajet_positif" CHECK ("expedition"."trajet_minutes" > 0),
	CONSTRAINT "expedition_sejour_positif" CHECK ("expedition"."sejour_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "expedition_escorte" (
	"expedition_id" integer NOT NULL,
	"espece_id" text NOT NULL,
	"nombre" integer NOT NULL,
	CONSTRAINT "expedition_escorte_expedition_id_espece_id_pk" PRIMARY KEY("expedition_id","espece_id"),
	CONSTRAINT "expedition_escorte_au_moins_une" CHECK ("expedition_escorte"."nombre" > 0)
);
--> statement-breakpoint
ALTER TABLE "habitant" ADD COLUMN "expedition_id" integer;--> statement-breakpoint
ALTER TABLE "expedition" ADD CONSTRAINT "expedition_territoire_id_territoire_id_fk" FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedition" ADD CONSTRAINT "expedition_case_id_case_du_monde_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case_du_monde"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedition_escorte" ADD CONSTRAINT "expedition_escorte_expedition_id_expedition_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expedition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedition_escorte" ADD CONSTRAINT "expedition_escorte_espece_id_espece_id_fk" FOREIGN KEY ("espece_id") REFERENCES "public"."espece"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expedition_par_territoire" ON "expedition" USING btree ("territoire_id");--> statement-breakpoint
ALTER TABLE "habitant" ADD CONSTRAINT "habitant_expedition_id_expedition_id_fk" FOREIGN KEY ("expedition_id") REFERENCES "public"."expedition"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habitant_par_expedition" ON "habitant" USING btree ("expedition_id");