CREATE TABLE "prenom" (
	"nom" text PRIMARY KEY NOT NULL,
	"ordre" integer NOT NULL
);
--> statement-breakpoint
-- Les prénoms, pour que les Habitants déjà là et ceux qui naissent avant le chargement des données
-- en reçoivent un ; donnees/prenoms.yaml reste la référence et les met à jour à chaque mise en ligne.
INSERT INTO "prenom" ("nom", "ordre") VALUES
  ('Arno', 1),
  ('Aski', 2),
  ('Avel', 3),
  ('Bael', 4),
  ('Bori', 5),
  ('Brune', 6),
  ('Cael', 7),
  ('Cimi', 8),
  ('Corin', 9),
  ('Dalu', 10),
  ('Dara', 11),
  ('Dorn', 12),
  ('Elio', 13),
  ('Enni', 14),
  ('Esko', 15),
  ('Faro', 16),
  ('Fenn', 17),
  ('Gavi', 18),
  ('Hael', 19),
  ('Hesk', 20),
  ('Huli', 21),
  ('Ilda', 22),
  ('Iro', 23),
  ('Isel', 24),
  ('Jali', 25),
  ('Joran', 26),
  ('Kael', 27),
  ('Kesi', 28),
  ('Koru', 29),
  ('Lenn', 30),
  ('Liro', 31),
  ('Lumi', 32),
  ('Mabo', 33),
  ('Miro', 34),
  ('Moki', 35),
  ('Nara', 36),
  ('Nevo', 37),
  ('Nilo', 38),
  ('Odel', 39),
  ('Oska', 40),
  ('Ovi', 41),
  ('Pazi', 42),
  ('Pell', 43),
  ('Reto', 44),
  ('Ruel', 45),
  ('Runa', 46),
  ('Sael', 47),
  ('Sivi', 48),
  ('Sorn', 49),
  ('Talo', 50),
  ('Tiko', 51),
  ('Tova', 52),
  ('Ulme', 53),
  ('Vali', 54),
  ('Varo', 55),
  ('Vesk', 56),
  ('Wenn', 57),
  ('Wiro', 58),
  ('Zaro', 59),
  ('Zeli', 60)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- La colonne arrive vide, le temps de nommer les Habitants déjà là ; elle devient obligatoire ensuite.
ALTER TABLE "habitant" ADD COLUMN "prenom" text;
--> statement-breakpoint
-- Un Territoire naît avec trois Habitants sans Métier, chacun avec un prénom tiré au hasard, trois
-- prénoms différents. S'il en manquait, la naissance échouerait plutôt que de donner moins de trois Habitants.
CREATE OR REPLACE FUNCTION "habitants_a_la_naissance"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "habitant" ("territoire_id", "arrive_le", "prenom")
  SELECT NEW."id", NEW."ne_le", "tires"."nom"
  FROM generate_series(1, 3) AS "rang"("n")
  LEFT JOIN (SELECT "nom", row_number() OVER (ORDER BY random()) AS "n" FROM "prenom") AS "tires" USING ("n");
  RETURN NEW;
END;
$$;
--> statement-breakpoint
-- Les Habitants déjà là reçoivent chacun le sien, tiré au hasard, sans doublon dans un même Territoire.
WITH "rangs" AS (
  SELECT "id", "territoire_id", row_number() OVER (PARTITION BY "territoire_id" ORDER BY "id") AS "n" FROM "habitant"
), "tirages" AS (
  SELECT "territoires"."territoire_id", "prenom"."nom", row_number() OVER (PARTITION BY "territoires"."territoire_id" ORDER BY random()) AS "n"
  FROM (SELECT DISTINCT "territoire_id" FROM "habitant") AS "territoires" CROSS JOIN "prenom"
)
UPDATE "habitant" SET "prenom" = "tirages"."nom"
FROM "rangs" JOIN "tirages" USING ("territoire_id", "n")
WHERE "habitant"."id" = "rangs"."id";
--> statement-breakpoint
ALTER TABLE "habitant" ALTER COLUMN "prenom" SET NOT NULL;
