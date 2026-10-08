-- US-0926 : les Bêtes sauvages parties de leur Case avant la fin de leur présence, en suivant une Expédition (étape 40) :
-- la seule trace qu'elles laissent en base, leurs apparitions se recalculant à la demande (src/monde/betes-sauvages.ts).
CREATE TABLE "bete_partie" (
	"case_id" integer NOT NULL,
	"numero" bigint NOT NULL,
	"partie_le" timestamp with time zone NOT NULL,
	CONSTRAINT "bete_partie_case_id_numero_pk" PRIMARY KEY("case_id","numero")
);
--> statement-breakpoint
ALTER TABLE "bete_partie" ADD CONSTRAINT "bete_partie_case_id_case_du_monde_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case_du_monde"("id") ON DELETE no action ON UPDATE no action;
