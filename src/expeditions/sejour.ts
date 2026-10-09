// Le séjour d'une Expédition (US-0906) : le temps qu'elle reste sur sa Case, choisi avant le départ entre deux bornes, par
// pas réguliers (src/reglages.ts), en minutes de jeu. Il ne commence qu'à l'arrivée : le trajet ne le raccourcit pas.
// Côté serveur comme dans le navigateur.
import { SEJOUR_MINUTES, SEJOURS_TOUT_PRETS_MINUTES } from "@/reglages";

const MINUTE_MS = 60_000;

/** US-0906 : la durée choisie à l'ouverture de l'écran d'Expédition : la première toute prête. */
export const SEJOUR_PAR_DEFAUT_MINUTES = SEJOURS_TOUT_PRETS_MINUTES[0];

/**
 * US-0906 : la durée de séjour que dit un texte (« 240 », de l'adresse ou d'un formulaire), en minutes, si on aurait pu la
 * choisir : un entier entre les bornes, sur un pas compté depuis la plus courte ; null sinon.
 */
export function sejourChoisi(texte: string | null | undefined): number | null {
  if (typeof texte !== "string" || !/^[1-9]\d{0,4}$/.test(texte)) return null;
  const minutes = Number(texte);
  const { min, max, pas } = SEJOUR_MINUTES;
  return minutes >= min && minutes <= max && (minutes - min) % pas === 0 ? minutes : null;
}

/**
 * US-0906 : le séjour d'une Expédition partie à `depart`, après `trajetMs` d'aller : il commence à l'arrivée, pas au
 * départ, et dure toute la durée choisie, quel que soit le trajet.
 */
export function horaireDuSejour(depart: Date, trajetMs: number, sejourMinutes: number): { debut: Date; fin: Date } {
  const debut = new Date(depart.getTime() + trajetMs);
  return { debut, fin: new Date(debut.getTime() + sejourMinutes * MINUTE_MS) };
}
