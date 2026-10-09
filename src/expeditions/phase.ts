// La phase d'une Expédition en cours (US-0911) : à l'aller, en séjour sur sa Case, ou au retour, d'après l'heure du jeu
// et les horaires fixés à son départ. Côté serveur comme dans le navigateur.
import { horaireDuSejour } from "./sejour";

const MINUTE_MS = 60_000;

/** US-0911 : où en est une Expédition : en route vers sa Case, sur sa Case, ou en route vers le Foyer. */
export type Phase = "aller" | "sejour" | "retour";

/**
 * US-0911 : les horaires d'une Expédition, fixés à son départ : l'instant du jeu où elle est partie, la durée de son aller
 * (null tant que le trajet d'une escorte n'est pas chiffré, US-0912) et celle de son séjour, en minutes de jeu.
 */
export type HorairesDUneExpedition = { partLe: Date; trajetMinutes: number | null; sejourMinutes: number };

/**
 * US-0911 : la phase d'une Expédition à l'instant du jeu `instant` : à l'aller dès son départ ; en séjour de son arrivée
 * à la fin de la durée choisie, qui ne commence qu'à l'arrivée (US-0906) ; au retour ensuite. Sans trajet chiffré, elle
 * reste à l'aller.
 */
export function phaseDUneExpedition({ partLe, trajetMinutes, sejourMinutes }: HorairesDUneExpedition, instant: Date): Phase {
  if (trajetMinutes === null) return "aller";
  const sejour = horaireDuSejour(partLe, trajetMinutes * MINUTE_MS, sejourMinutes);
  if (instant < sejour.debut) return "aller";
  return instant < sejour.fin ? "sejour" : "retour";
}
