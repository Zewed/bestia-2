CREATE TABLE "territoire" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "territoire_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"chef_id" integer NOT NULL,
	"foyer_case_id" integer NOT NULL,
	"ne_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "territoire_chef_id_unique" UNIQUE("chef_id"),
	CONSTRAINT "territoire_foyer_case_id_unique" UNIQUE("foyer_case_id")
);
--> statement-breakpoint
ALTER TABLE "case_du_monde" ADD COLUMN "imprenable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "territoire" ADD CONSTRAINT "territoire_chef_id_chef_id_fk" FOREIGN KEY ("chef_id") REFERENCES "public"."chef"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "territoire" ADD CONSTRAINT "territoire_foyer_case_id_case_du_monde_id_fk" FOREIGN KEY ("foyer_case_id") REFERENCES "public"."case_du_monde"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Un Territoire qui disparaît (compte supprimé) rend sa Case Foyer prenable : la Case redevient libre.
CREATE FUNCTION "foyer_rendu_prenable"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE "case_du_monde" SET "imprenable" = false WHERE "id" = OLD."foyer_case_id";
  RETURN OLD;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "territoire_disparu" AFTER DELETE ON "territoire" FOR EACH ROW EXECUTE FUNCTION "foyer_rendu_prenable"();
--> statement-breakpoint
-- Les chefs déjà nés reçoivent leur Territoire : leur seule Case devient leur Foyer, imprenable.
INSERT INTO "territoire" ("chef_id", "foyer_case_id")
SELECT "chef_id", "id" FROM "case_du_monde" WHERE "chef_id" IS NOT NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "case_du_monde" SET "imprenable" = true WHERE "id" IN (SELECT "foyer_case_id" FROM "territoire");
