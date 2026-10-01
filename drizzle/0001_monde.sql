CREATE TABLE "monde" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "monde_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nom" text NOT NULL,
	"ne_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monde_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
-- Un Monde ne se réinitialise jamais : la base elle-même refuse de l'effacer ou de le vider.
CREATE FUNCTION "monde_jamais_efface"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Un Monde ne se réinitialise jamais : impossible de l''effacer.';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "monde_jamais_efface_ligne" BEFORE DELETE ON "monde" FOR EACH ROW EXECUTE FUNCTION "monde_jamais_efface"();
--> statement-breakpoint
CREATE TRIGGER "monde_jamais_vide" BEFORE TRUNCATE ON "monde" FOR EACH STATEMENT EXECUTE FUNCTION "monde_jamais_efface"();
--> statement-breakpoint
-- Le premier Monde, Aube, créé une seule fois.
INSERT INTO "monde" ("nom") VALUES ('Aube') ON CONFLICT ("nom") DO NOTHING;
