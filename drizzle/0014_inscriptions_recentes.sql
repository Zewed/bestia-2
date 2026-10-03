CREATE TABLE "inscription_recente" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inscription_recente_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"empreinte_reseau" text NOT NULL,
	"le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "inscription_recente_par_connexion" ON "inscription_recente" USING btree ("empreinte_reseau","le");