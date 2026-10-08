CREATE TABLE "case_decouverte" (
	"territoire_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	CONSTRAINT "case_decouverte_territoire_id_case_id_pk" PRIMARY KEY("territoire_id","case_id")
);
--> statement-breakpoint
ALTER TABLE "case_decouverte" ADD CONSTRAINT "case_decouverte_territoire_id_territoire_id_fk" FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_decouverte" ADD CONSTRAINT "case_decouverte_case_id_case_du_monde_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case_du_monde"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- US-0436 : les Territoires déjà nés découvrent eux aussi les abords de leur Foyer, et rien de plus : les Cases de son
-- Monde à ABORDS_DU_FOYER_CASES (4) Cases de lui ou moins, comme un Territoire qui naît (abordsDuFoyer,
-- src/monde/brouillard.ts). La distance est le miroir de distance (src/monde/hex.ts), la seule mesure des distances du
-- jeu : le plus grand des écarts sur q, sur r et sur q + r. Les bornes sur q et r, qui en découlent, ne laissent lire
-- que le voisinage du Foyer. « on conflict do nothing » : la migration se rejoue sans rien changer.
INSERT INTO "case_decouverte" ("territoire_id", "case_id")
SELECT t."id", c."id"
FROM "territoire" t
JOIN "case_du_monde" f ON f."id" = t."foyer_case_id"
JOIN "case_du_monde" c ON c."monde_id" = f."monde_id"
  AND c."q" BETWEEN f."q" - 4 AND f."q" + 4
  AND c."r" BETWEEN f."r" - 4 AND f."r" + 4
WHERE greatest(abs(c."q" - f."q"), abs(c."r" - f."r"), abs((c."q" - f."q") + (c."r" - f."r"))) <= 4
ON CONFLICT DO NOTHING;
