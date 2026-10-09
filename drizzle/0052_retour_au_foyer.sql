-- US-0916 : l'instant du jeu où une Expédition est rentrée au Foyer (null tant qu'elle est en cours) ; rentrée, elle n'est
-- pas effacée. Le retour est un événement du Territoire, programmé au départ (src/expeditions/retour.ts) : celles déjà
-- parties reçoivent ici le leur, à l'heure que donne retourDUneExpedition (src/expeditions/phase.ts) : le départ, l'aller,
-- le séjour, puis le retour, qui dure autant que l'aller. Le mécanisme du temps l'applique à cet instant, ou au marque-page
-- du Territoire s'il est déjà passé. Purement additive, et rejouable sans rien changer : seules les Expéditions en cours,
-- au trajet chiffré, sans retour programmé, en reçoivent un.
ALTER TABLE "expedition" ADD COLUMN IF NOT EXISTS "rentree_le" timestamp with time zone;--> statement-breakpoint
INSERT INTO "evenement" ("element", "element_id", "survient_le", "type", "donnees")
SELECT 'territoire', x."territoire_id", x."part_le" + make_interval(mins => 2 * x."trajet_minutes" + x."sejour_minutes"), 'retour_expedition',
  jsonb_build_object('expedition', x."id")
FROM "expedition" x
WHERE x."rentree_le" IS NULL AND x."trajet_minutes" IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM "evenement" e
  WHERE e."element" = 'territoire' AND e."element_id" = x."territoire_id" AND e."type" = 'retour_expedition'
    AND e."donnees"->>'expedition' = x."id"::text
);
