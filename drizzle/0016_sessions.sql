CREATE TABLE "session" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "session_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"compte_id" integer NOT NULL,
	"empreinte_jeton" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	CONSTRAINT "session_empreinte_jeton_unique" UNIQUE("empreinte_jeton")
);
--> statement-breakpoint
ALTER TABLE "compte" ADD COLUMN "derniere_connexion_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_compte_id_compte_id_fk" FOREIGN KEY ("compte_id") REFERENCES "public"."compte"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_par_compte" ON "session" USING btree ("compte_id");