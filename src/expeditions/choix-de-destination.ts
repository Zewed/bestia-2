// Le choix de la destination d'une Expédition sur la carte (US-0907), tel que l'écran d'Expédition, la carte et sa
// fiche le partagent : les adresses de l'aller et du retour, les refus que lit le joueur, et la distance qu'il lit.
import type { Coordonnees } from "@/monde/hex";

/** US-0901 : la distance d'une destination au Foyer : « 7 Cases de votre Foyer », « 1 Case de votre Foyer » ; US-0910 : de même au récapitulatif. */
export const casesDuFoyer = (n: number) => `${n} Case${n > 1 ? "s" : ""} de votre Foyer`;

/** US-0907 : le refus d'une Case qui appartient à un Territoire, le sien ou celui d'un autre joueur (décidé le 2026-10-08). */
export const CASE_D_UN_TERRITOIRE = "Cette Case appartient à un Territoire.";

/** US-0908 : le refus d'une Case au-delà de la portée d'exploration (PORTEE_D_EXPLORATION_CASES). */
export const CASE_HORS_DE_PORTEE = "Cette Case est hors de portée.";

/** US-0901 : l'écran d'Expédition, où mènent la fiche d'une Case et la navigation. */
const ECRAN = "/jeu/expeditions/nouvelle";

/** US-0907 : la carte, et ce que dit son adresse quand elle est ouverte pour choisir la destination (« ?choix=destination »). */
const CARTE = "/jeu/carte";
const CHOIX = "destination";

/**
 * Les autres choix de l'écran d'Expédition dans `recherche` (une adresse, « ?sejour=60&q=3&r=-5 ») : tout ce qu'elle
 * dit, sauf la Case de destination (q, r) et le choix de la carte, que chaque trajet remet à sa façon.
 */
function autresChoix(recherche: string): [string, string][] {
  return [...new URLSearchParams(recherche)].filter(([nom]) => nom !== "q" && nom !== "r" && nom !== "choix");
}

/**
 * US-0907 : la carte ouverte pour choisir la destination, depuis l'écran d'Expédition à l'adresse `recherche`. Elle
 * garde les autres choix de l'écran (« sejour=60 »), pour les lui rendre au retour sans les connaître.
 */
export function versLaCarte(recherche: string): string {
  return `${CARTE}?${new URLSearchParams([["choix", CHOIX], ...autresChoix(recherche)])}`;
}

/**
 * US-0901 : l'écran d'Expédition avec la Case `c` pour destination. US-0907 : et les autres choix que la carte a
 * gardés de l'écran dans son adresse (`recherche`) ; une Case qu'elle aurait gardée ne revient pas, `c` la remplace.
 */
export function versLEcran(c: Coordonnees, recherche = ""): string {
  return `${ECRAN}?${new URLSearchParams([["q", String(c.q)], ["r", String(c.r)], ...autresChoix(recherche)])}`;
}

/**
 * US-0907 : si la carte est ouverte pour choisir la destination, d'après les paramètres de son adresse tels que Next
 * les donne (`parametres`), son adresse (« choix=destination&sejour=60 »), où l'écran retrouvera ses autres choix ;
 * null sinon.
 */
export function choixDeDestination(parametres: Record<string, string | string[] | undefined>): string | null {
  const recherche = new URLSearchParams(Object.entries(parametres).flatMap(([nom, valeur]) => [valeur ?? []].flat().map((v): [string, string] => [nom, v])));
  return recherche.get("choix") === CHOIX ? recherche.toString() : null;
}
