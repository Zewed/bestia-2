CREATE TYPE "public"."famille_de_ressource" AS ENUM('nourriture', 'materiaux');--> statement-breakpoint
CREATE TABLE "ressource" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"famille" "famille_de_ressource" NOT NULL,
	"ordre" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock" (
	"territoire_id" integer NOT NULL,
	"ressource_id" text NOT NULL,
	"quantite" numeric(24, 6) DEFAULT '0' NOT NULL,
	CONSTRAINT "stock_territoire_id_ressource_id_pk" PRIMARY KEY("territoire_id","ressource_id"),
	CONSTRAINT "stock_jamais_negatif" CHECK ("stock"."quantite" >= 0)
);
--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_territoire_id_territoire_id_fk" FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_ressource_id_ressource_id_fk" FOREIGN KEY ("ressource_id") REFERENCES "public"."ressource"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Les quatre Ressources, pour que les Territoires déjà nés reçoivent leurs Stocks tout de suite ;
-- donnees/ressources.yaml reste la référence et les met à jour à chaque mise en ligne.
INSERT INTO "ressource" ("id", "nom", "famille", "ordre") VALUES
  ('viande', 'Viande', 'nourriture', 1),
  ('vegetaux', 'Végétaux', 'nourriture', 2),
  ('bois', 'Bois', 'materiaux', 3),
  ('pierre', 'Pierre', 'materiaux', 4)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Un Territoire naît avec un Stock vide de chaque Ressource, quel que soit le chemin de sa naissance.
CREATE FUNCTION "stocks_a_la_naissance"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "stock" ("territoire_id", "ressource_id") SELECT NEW."id", "id" FROM "ressource";
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "territoire_ne_avec_ses_stocks" AFTER INSERT ON "territoire" FOR EACH ROW EXECUTE FUNCTION "stocks_a_la_naissance"();
--> statement-breakpoint
-- Les Territoires déjà nés reçoivent les leurs, vides.
INSERT INTO "stock" ("territoire_id", "ressource_id")
SELECT "territoire"."id", "ressource"."id" FROM "territoire" CROSS JOIN "ressource"
ON CONFLICT DO NOTHING;
