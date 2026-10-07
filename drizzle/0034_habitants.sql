CREATE TABLE "habitant" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "habitant_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"territoire_id" integer NOT NULL,
	"metier" text,
	"arrive_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habitant" ADD CONSTRAINT "habitant_territoire_id_territoire_id_fk" FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habitant_par_territoire" ON "habitant" USING btree ("territoire_id");--> statement-breakpoint
-- Un Territoire naît avec trois Habitants sans Métier, quel que soit le chemin de sa naissance.
CREATE FUNCTION "habitants_a_la_naissance"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "habitant" ("territoire_id", "arrive_le") SELECT NEW."id", NEW."ne_le" FROM generate_series(1, 3);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "territoire_ne_avec_ses_habitants" AFTER INSERT ON "territoire" FOR EACH ROW EXECUTE FUNCTION "habitants_a_la_naissance"();
--> statement-breakpoint
-- Les Territoires déjà nés reçoivent les leurs, une seule fois : une migration ne passe qu'une fois.
INSERT INTO "habitant" ("territoire_id", "arrive_le")
SELECT "territoire"."id", "territoire"."ne_le" FROM "territoire" CROSS JOIN generate_series(1, 3);
