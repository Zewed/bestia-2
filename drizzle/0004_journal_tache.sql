CREATE TABLE "passage_tache" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "passage_tache_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"debut" timestamp with time zone NOT NULL,
	"duree_ms" integer NOT NULL,
	"rattrapes" integer NOT NULL,
	"echecs" integer NOT NULL,
	"restants" integer NOT NULL,
	"erreurs" jsonb DEFAULT '[]'::jsonb NOT NULL
);
