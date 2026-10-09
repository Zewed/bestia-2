-- US-0912 : le trajet d'une Expédition partie avec une escorte avant qu'il soit chiffré, resté null, l'est désormais comme
-- au départ (dureeDuTrajetMinutes, src/expeditions/allure.ts), avec les valeurs du jour : autant de Cases que la distance
-- de la carte entre le Foyer et la destination (le miroir de distance, src/monde/hex.ts : le plus grand des écarts sur q,
-- sur r et sur q + r), chacune à l'allure de l'Expédition. Celle-ci est le pas des explorateurs, 20 minutes de jeu par
-- Case (PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE) pour une marche à 5 km/h (MARCHE_DES_EXPLORATEURS_KMH) ; ou, si la Bête la
-- plus lente de l'escorte va moins vite, à v km/h, 20 × 5 / v minutes, arrondies à la minute supérieure. Seules les
-- Expéditions sans trajet changent : la migration se rejoue sans rien changer. Aucune n'existe en production.
UPDATE "expedition" x
SET "trajet_minutes" = greatest(abs(c."q" - f."q"), abs(c."r" - f."r"), abs((c."q" - f."q") + (c."r" - f."r")))
  * ceil(20 * 5 / least(5, coalesce((
      SELECT min(e."vitesse") FROM "expedition_escorte" s JOIN "espece" e ON e."id" = s."espece_id" WHERE s."expedition_id" = x."id"
    ), 5)))
FROM "case_du_monde" c, "territoire" t
JOIN "case_du_monde" f ON f."id" = t."foyer_case_id"
WHERE x."trajet_minutes" IS NULL AND c."id" = x."case_id" AND t."id" = x."territoire_id";
