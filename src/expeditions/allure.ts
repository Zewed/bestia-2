// L'allure d'une Expédition : les minutes de jeu qu'elle met à passer d'une Case à la suivante, dont la durée du trajet
// (US-0912) tirera l'aller et le retour. Sans escorte (US-0909), elle avance au pas des explorateurs (src/reglages.ts) ;
// avec une escorte, au pas de sa Bête la plus lente, qu'US-0912 réglera. Côté serveur comme dans le navigateur.
import { PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE } from "@/reglages";

/** US-0909 : une Expédition part sans escorte quand aucune Bête ne l'accompagne : zéro pour chaque Espèce de l'escorte, ou aucune Espèce. */
export function sansEscorte(escorte: ReadonlyMap<string, number>): boolean {
  return [...escorte.values()].every((betes) => betes === 0);
}

/**
 * US-0909 : l'allure d'une Expédition, en minutes de jeu par Case, d'après son escorte (Espèce par Espèce, le nombre de
 * Bêtes qui partent) : sans escorte, le pas des explorateurs. Celle d'une escorte arrive avec la durée du trajet
 * (US-0912) : d'ici là, aucune n'est demandée.
 */
export function allureMinutesParCase(escorte: ReadonlyMap<string, number>): number {
  if (!sansEscorte(escorte)) throw new Error("L'allure d'une escorte arrive avec la durée du trajet (US-0912).");
  return PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE;
}

/**
 * US-0910 : la durée de l'aller d'une Expédition, en minutes de jeu, jusqu'à une Case à `distance` Cases du Foyer : une
 * Case après l'autre, à son allure ; le retour dure autant (US-0912). Avec une escorte, aucune tant que son allure n'est
 * pas réglée (US-0912) : null, que le récapitulatif ne chiffre pas.
 */
export function dureeDuTrajetMinutes(distance: number, escorte: ReadonlyMap<string, number>): number | null {
  return sansEscorte(escorte) ? distance * allureMinutesParCase(escorte) : null;
}
