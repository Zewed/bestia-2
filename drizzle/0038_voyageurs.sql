CREATE TABLE "voyageur" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "voyageur_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"territoire_id" integer NOT NULL,
	"prenom" text NOT NULL,
	"arrive_le" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "voyageur" ADD CONSTRAINT "voyageur_territoire_id_territoire_id_fk" FOREIGN KEY ("territoire_id") REFERENCES "public"."territoire"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "voyageur_par_territoire" ON "voyageur" USING btree ("territoire_id");--> statement-breakpoint
-- US-0331 : l'écart avant l'arrivée « numero » d'un Territoire, tiré comme le jeu le tire (ecartAvantVoyageur,
-- src/monde/voyageurs.ts) : par un hachage du Territoire et du numéro, de la moitié à une fois et demie la moyenne
-- de VOYAGEUR_TOUTES_LES_HEURES (8 heures, soit 28 800 000 millisecondes), en millisecondes entières.
CREATE FUNCTION "ecart_avant_voyageur"("territoire_id" integer, "numero" integer) RETURNS interval LANGUAGE sql IMMUTABLE AS $$
  SELECT ((28800000::bigint * (2147483648 + ('x' || substr(md5("territoire_id"::text || ':' || "numero"::text), 1, 8))::bit(32)::bigint)) / 4294967296)
    * interval '1 millisecond'
$$;
--> statement-breakpoint
-- Un Territoire naît avec sa première arrivée de Voyageur programmée, quel que soit le chemin de sa naissance.
CREATE FUNCTION "premiere_arrivee_a_la_naissance"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "evenement" ("element", "element_id", "survient_le", "type", "donnees")
  VALUES ('territoire', NEW."id", date_trunc('milliseconds', NEW."ne_le" + "ecart_avant_voyageur"(NEW."id", 1)), 'arrivee_voyageur', '{"numero": 1}');
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "territoire_ne_avec_sa_premiere_arrivee" AFTER INSERT ON "territoire" FOR EACH ROW EXECUTE FUNCTION "premiere_arrivee_a_la_naissance"();
--> statement-breakpoint
-- Les Territoires déjà nés reçoivent la leur, comptée depuis la mise en ligne et non depuis leur naissance : pas de
-- Voyageurs du passé. Un marque-page en avance sur l'heure réelle (temps accéléré, hors production) compte à sa place.
INSERT INTO "evenement" ("element", "element_id", "survient_le", "type", "donnees")
SELECT 'territoire', "id", date_trunc('milliseconds', greatest(now(), "calcule_jusqu_a") + "ecart_avant_voyageur"("id", 1)), 'arrivee_voyageur', '{"numero": 1}'
FROM "territoire";