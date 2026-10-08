// La vue de la carte retenue le temps d'une visite (US-0427) : dans la mémoire de l'onglet (sessionStorage), tant
// qu'il vit. Un nouvel onglet, ou une nouvelle session du navigateur, rouvre la carte sur le Foyer. Côté navigateur.
import type { Coordonnees } from "@/monde/hex";
import type { Vue } from "./dessin";

const CLE = "bestia.vue-de-la-carte";

/** La carte dont la vue est retenue : son Monde et son Foyer. Une vue n'est reprise que sur la même carte. */
type Carte = { monde: string; foyer: Coordonnees };

/**
 * Retient où regarde la carte : le milieu de l'écran en Cases et la taille des Cases, pas en pixels, pour retrouver
 * le même endroit sur un écran tourné. Sans mémoire d'onglet (navigation privée stricte), rien ne casse.
 */
export function retenirLaVue(carte: Carte, vue: Vue): void {
  try {
    sessionStorage.setItem(CLE, JSON.stringify({ monde: carte.monde, foyer: carte.foyer, milieu: vue.milieu, rayon: vue.rayon }));
  } catch {
    // La carte se rouvrira sur le Foyer, voilà tout.
  }
}

/**
 * La vue retenue pour cette carte, sur un écran de `largeur` × `hauteur` pixels ; null si rien n'est retenu pour elle
 * (un autre Monde, un autre Foyer), ou si ce qui l'est ne se lit pas.
 */
export function vueRetenue(carte: Carte, largeur: number, hauteur: number): Vue | null {
  try {
    const lue = JSON.parse(sessionStorage.getItem(CLE) ?? "null");
    const memeCarte = lue?.monde === carte.monde && lue.foyer?.q === carte.foyer.q && lue.foyer?.r === carte.foyer.r;
    if (!memeCarte || ![lue.milieu?.q, lue.milieu?.r, lue.rayon].every(Number.isFinite) || lue.rayon <= 0) return null;
    return { largeur, hauteur, milieu: { q: lue.milieu.q, r: lue.milieu.r }, rayon: lue.rayon };
  } catch {
    return null;
  }
}
