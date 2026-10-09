// Le chemin d'une Expédition (US-0912) : les Cases qu'elle passe une à une, de son Foyer à sa destination, à son allure
// (src/expeditions/allure.ts). Côté serveur comme dans le navigateur.
import { type Coordonnees, distance } from "@/monde/hex";

/**
 * Un décalage infime, le même aux deux bouts : une ligne qui passe juste entre deux Cases tombe toujours du même côté,
 * au lieu d'hésiter d'une Case à l'autre.
 */
const DECALAGE = 1e-6;

/** La Case la plus proche d'un point (q, r) aux coordonnées fractionnaires. */
function caseLaPlusProche(q: number, r: number): Coordonnees {
  const s = -q - r;
  let [rq, rr] = [Math.round(q), Math.round(r)];
  const rs = Math.round(s);
  // Les trois coordonnées d'une Case font zéro : celle que l'arrondi a le plus déplacée se déduit des deux autres.
  const [eq, er, es] = [Math.abs(rq - q), Math.abs(rr - r), Math.abs(rs - s)];
  if (eq > er && eq > es) rq = -rr - rs;
  else if (er > es) rr = -rq - rs;
  return { q: rq + 0, r: rr + 0 }; // + 0 : jamais de « -0 »
}

/**
 * US-0912 : le chemin d'une Expédition de son Foyer à sa `destination` : les Cases qu'elle passe une à une, chacune
 * voisine de la précédente, sans le Foyer, jusqu'à la destination comprise. En ligne droite, comme la distance de la
 * carte (src/monde/hex.ts) : autant de Cases que de Cases de distance. L'eau se traverse comme la terre, à la même
 * allure (décidé le 2026-10-08) : le chemin ne regarde pas le Biome des Cases. US-0913 et US-0914 y suivront
 * l'Expédition.
 */
export function cheminDUneExpedition(foyer: Coordonnees, destination: Coordonnees): Coordonnees[] {
  const cases = distance(foyer, destination);
  const chemin: Coordonnees[] = [];
  for (let pas = 1; pas <= cases; pas++) {
    const t = pas / cases;
    chemin.push(caseLaPlusProche(foyer.q + (destination.q - foyer.q) * t + DECALAGE, foyer.r + (destination.r - foyer.r) * t + DECALAGE));
  }
  return chemin;
}
