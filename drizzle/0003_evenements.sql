CREATE TABLE "evenement" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "evenement_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"element" text NOT NULL,
	"element_id" integer NOT NULL,
	"survient_le" timestamp with time zone NOT NULL,
	"type" text NOT NULL,
	"donnees" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"traite_le" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "evenement_a_traiter" ON "evenement" USING btree ("element","element_id","survient_le");