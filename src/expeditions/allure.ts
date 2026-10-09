// L'allure d'une Expédition : les minutes de jeu qu'elle met à passer d'une Case à la suivante, dont la durée du trajet
// (US-0912) tire l'aller et le retour. Sans escorte (US-0909), elle avance au pas des explorateurs (src/reglages.ts) ;
// avec une escorte, au plus lent de ce pas et de celui de sa Bête la plus lente (US-0912). Côté serveur comme dans le
// navigateur.
import { MARCHE_DES_EXPLORATEURS_KMH, PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE } from "@/reglages";

/** US-0912 : une Espèce de l'escorte : la vitesse réelle de ses Bêtes, en km/h (donnees/especes.yaml), et combien en partent. */
export type BetesDeLEscorte = { vitesse: number; nombre: number };

/** US-0909 : une Expédition part sans escorte quand aucune Bête ne l'accompagne : zéro pour chaque Espèce de l'escorte, ou aucune Espèce. */
export function sansEscorte(escorte: ReadonlyMap<string, number>): boolean {
  return [...escorte.values()].every((betes) => betes === 0);
}

/**
 * US-0912 : la vitesse d'une Expédition, en km/h : celle de la marche des explorateurs, ou celle de la Bête la plus lente
 * de son escorte, d'après la vitesse de son Espèce, si elle est plus lente encore : l'Expédition va au plus lent des
 * deux (décidé le 2026-10-08). Les Espèces dont aucune Bête ne part ne comptent pas.
 */
export function vitesseDUneExpedition(escorte: readonly BetesDeLEscorte[]): number {
  return Math.min(MARCHE_DES_EXPLORATEURS_KMH, ...escorte.filter((e) => e.nombre > 0).map((e) => e.vitesse));
}

/**
 * US-0909 : l'allure d'une Expédition, en minutes de jeu par Case : sans escorte, le pas des explorateurs. US-0912 :
 * avec une escorte, une Bête plus lente que la marche des explorateurs allonge d'autant ce pas : 20 × 5 / v minutes à
 * v km/h, arrondies à la minute supérieure.
 */
export function allureMinutesParCase(escorte: readonly BetesDeLEscorte[]): number {
  return Math.ceil((PAS_DES_EXPLORATEURS_MINUTES_PAR_CASE * MARCHE_DES_EXPLORATEURS_KMH) / vitesseDUneExpedition(escorte));
}

/**
 * US-0912 : la durée de l'aller d'une Expédition, en minutes de jeu, jusqu'à une Case à `distance` Cases du Foyer : son
 * chemin passe de Case en Case, en ligne droite, l'eau comprise (src/expeditions/chemin.ts), autant de Cases que la
 * distance de la carte, chacune à son allure. Le retour dure autant. Des minutes de jeu : en vitesse accélérée de
 * développement, l'horloge du jeu les raccourcit d'autant (src/temps/horloge.ts).
 */
export function dureeDuTrajetMinutes(distance: number, escorte: readonly BetesDeLEscorte[]): number {
  return distance * allureMinutesParCase(escorte);
}
