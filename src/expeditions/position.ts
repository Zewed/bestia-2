// La position d'une Expédition sur son chemin (US-0913) : où elle se trouve à un instant du jeu, d'après les horaires
// fixés à son départ, sans rien lire ni rien écrire. La carte y pose son repère ; le brouillard levé sur le chemin
// (US-0914) et le rappel (US-0920) la reprendront. Côté serveur comme dans le navigateur.
import type { Coordonnees } from "@/monde/hex";
import { cheminDUneExpedition } from "./chemin";
import type { HorairesDUneExpedition } from "./phase";
import { horaireDuSejour } from "./sejour";

const MINUTE_MS = 60_000;

/**
 * US-0913 : où se trouve une Expédition sur son chemin (cheminDUneExpedition, du Foyer exclu à la destination comprise) :
 * - `avancee` : les Cases qu'elle a faites depuis le Foyer, en fraction de Case : 0 au départ, 2,5 à mi-chemin entre la
 *   deuxième Case et la troisième, la distance de la destination à l'arrivée et pendant tout le séjour ; au retour, elle
 *   redescend jusqu'à 0, au Foyer. C'est elle que suit le repère de la carte, qui avance ainsi en continu.
 * - `rang` : le rang de la Case où elle se trouve, la dernière qu'elle a atteinte : 0 pour le Foyer, k pour la k-ième Case
 *   du chemin, la distance pour la destination.
 * - `case` : cette Case : le Foyer, ou la Case même du chemin (jamais une copie).
 */
export type PositionDUneExpedition = { avancee: number; rang: number; case: Coordonnees };

/**
 * US-0913 : où se trouve à l'instant du jeu `instant` une Expédition partie du `foyer` vers la `destination`, d'après ses
 * horaires (src/expeditions/phase.ts). Elle va Case par Case, chacune à son allure : le trajet de l'aller divisé par le
 * nombre de Cases du chemin, soit `trajet_minutes = distance × allure` (US-0912).
 *
 * - À l'aller, elle part du Foyer et atteint la k-ième Case du chemin k allures après son départ ; elle y reste jusqu'à
 *   atteindre la suivante. Elle atteint la destination à l'arrivée pile, quand commence le séjour (phaseDUneExpedition).
 * - En séjour, elle est sur la destination, toute la durée choisie (US-0906, US-0915).
 * - Au retour, elle reprend le même chemin en sens inverse, à la même allure, le retour durant autant que l'aller : elle
 *   reste sur la destination jusqu'à atteindre la Case d'avant, une allure après la fin du séjour, et ainsi de suite
 *   jusqu'au Foyer, qu'elle atteint à son retour (retourDUneExpedition). Elle y reste ensuite.
 * - Tant que son trajet n'est pas chiffré (une escorte partie avant US-0912), elle reste au Foyer.
 *
 * Une Case du chemin est donc atteinte, à l'aller, à `partLe + rang × allure` : c'est là que le brouillard se lèvera
 * (US-0914), en direct comme au rattrapage d'une absence, et les Cases déjà traversées sont les `rang` premières du
 * chemin. Le rappel (US-0920) fera demi-tour depuis `avancee`. `chemin` : celui de l'Expédition, s'il est déjà connu,
 * pour ne pas le recalculer à chaque instant.
 */
export function positionDUneExpedition(
  foyer: Coordonnees,
  destination: Coordonnees,
  { partLe, trajetMinutes, sejourMinutes }: HorairesDUneExpedition,
  instant: Date,
  chemin: readonly Coordonnees[] = cheminDUneExpedition(foyer, destination),
): PositionDUneExpedition {
  const surLeChemin = (avancee: number, rang: number): PositionDUneExpedition => ({ avancee, rang, case: rang === 0 ? foyer : chemin[rang - 1] });
  const cases = chemin.length;
  if (trajetMinutes === null || cases === 0) return surLeChemin(0, 0);
  const trajetMs = trajetMinutes * MINUTE_MS;
  const sejour = horaireDuSejour(partLe, trajetMs, sejourMinutes);
  const ici = instant.getTime();
  // En millisecondes entières : une Case atteinte l'est à la milliseconde près, jamais une de trop par un arrondi.
  if (ici < sejour.debut.getTime()) {
    const avancee = Math.max(0, ((ici - partLe.getTime()) * cases) / trajetMs);
    return surLeChemin(avancee, Math.floor(avancee));
  }
  if (ici < sejour.fin.getTime()) return surLeChemin(cases, cases);
  const avancee = Math.max(0, cases - ((ici - sejour.fin.getTime()) * cases) / trajetMs);
  return surLeChemin(avancee, Math.ceil(avancee));
}
