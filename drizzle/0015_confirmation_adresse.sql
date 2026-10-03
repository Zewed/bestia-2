CREATE TABLE "lien_confirmation" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lien_confirmation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"compte_id" integer NOT NULL,
	"empreinte_jeton" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"utilise_le" timestamp with time zone,
	CONSTRAINT "lien_confirmation_empreinte_jeton_unique" UNIQUE("empreinte_jeton")
);
--> statement-breakpoint
ALTER TABLE "compte" ADD COLUMN "email_confirme_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lien_confirmation" ADD CONSTRAINT "lien_confirmation_compte_id_compte_id_fk" FOREIGN KEY ("compte_id") REFERENCES "public"."compte"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lien_confirmation_par_compte" ON "lien_confirmation" USING btree ("compte_id","cree_le");