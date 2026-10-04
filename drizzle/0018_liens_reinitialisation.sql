CREATE TABLE "lien_reinitialisation" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lien_reinitialisation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"compte_id" integer NOT NULL,
	"empreinte_jeton" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"utilise_le" timestamp with time zone,
	CONSTRAINT "lien_reinitialisation_empreinte_jeton_unique" UNIQUE("empreinte_jeton")
);
--> statement-breakpoint
ALTER TABLE "lien_reinitialisation" ADD CONSTRAINT "lien_reinitialisation_compte_id_compte_id_fk" FOREIGN KEY ("compte_id") REFERENCES "public"."compte"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lien_reinitialisation_par_compte" ON "lien_reinitialisation" USING btree ("compte_id","cree_le");