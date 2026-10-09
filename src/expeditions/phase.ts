// La phase d'une Expédition en cours (US-0911) : à l'aller, en séjour sur sa Case, ou au retour, d'après l'heure du jeu
// et les horaires fixés à son départ, puis à son rappel (US-0920). Côté serveur comme dans le navigateur.
import { horaireDuSejour } from "./sejour";

const MINUTE_MS = 60_000;

/** US-0911 : où en est une Expédition : en route vers sa Case, sur sa Case, ou en route vers le Foyer. */
export type Phase = "aller" | "sejour" | "retour";

/**
 * US-0911 : les horaires d'une Expédition, fixés à son départ : l'instant du jeu où elle est partie, la durée de son aller
 * (null tant que le trajet d'une escorte n'est pas chiffré, US-0912) et celle de son séjour, en minutes de jeu. US-0920 :
 * et l'instant du jeu où le joueur l'a rappelée (expedition.rappelee_le), absent ou null tant qu'il ne l'a pas fait :
 * toute lecture de ses horaires en base le lit aussi.
 */
export type HorairesDUneExpedition = { partLe: Date; trajetMinutes: number | null; sejourMinutes: number; rappeleeLe?: Date | null };

/**
 * US-0920 : le demi-tour d'une Expédition vers le Foyer : son instant (`le`), et le temps d'aller qu'elle a fait jusque-là
 * (`allerMs`), que dure son retour. Sans rappel, à la fin de son séjour, après tout l'aller ; rappelée avant, à son
 * rappel : à l'aller, après le temps déjà parcouru ; en séjour, après tout l'aller. Aucun tant que son trajet n'est pas
 * chiffré (US-0912). Le séjour, la phase, le retour et la position sur le chemin (src/expeditions/position.ts) en
 * découlent tous.
 */
export function demiTourDUneExpedition({ partLe, trajetMinutes, sejourMinutes, rappeleeLe }: HorairesDUneExpedition): { le: Date; allerMs: number } | null {
  if (trajetMinutes === null) return null;
  const prevu = horaireDuSejour(partLe, trajetMinutes * MINUTE_MS, sejourMinutes);
  const le = rappeleeLe && rappeleeLe < prevu.fin ? rappeleeLe : prevu.fin;
  return { le, allerMs: Math.min(le.getTime(), prevu.debut.getTime()) - partLe.getTime() };
}

/**
 * US-0915 : le séjour d'une Expédition sur sa Case, de son arrivée (comprise) à la fin de la durée choisie (exclue), qui
 * ne commence qu'à l'arrivée (US-0906) : le seul temps où elle est sur la Case, et sa phase « séjour ». Aucun tant que son
 * trajet n'est pas chiffré (US-0912). La phase, le compte à rebours et la présence sur la Case (src/expeditions/presence.ts)
 * se lisent tous ici. US-0920 : rappelée à l'aller, elle ne séjourne pas (aucun) ; en séjour, son rappel y met fin.
 */
export function sejourDUneExpedition(horaires: HorairesDUneExpedition): { debut: Date; fin: Date } | null {
  const demiTour = demiTourDUneExpedition(horaires);
  if (!demiTour) return null;
  const debut = new Date(horaires.partLe.getTime() + horaires.trajetMinutes! * MINUTE_MS);
  return demiTour.le < debut ? null : { debut, fin: demiTour.le };
}

/**
 * US-0911 : la phase d'une Expédition à l'instant du jeu `instant` : à l'aller dès son départ ; en séjour de son arrivée
 * à la fin de la durée choisie, qui ne commence qu'à l'arrivée (US-0906) ; au retour ensuite, sans action du joueur
 * (US-0915). Sans trajet chiffré, elle reste à l'aller. US-0920 : au retour dès son rappel, sans séjour si elle n'était
 * pas arrivée.
 */
export function phaseDUneExpedition(horaires: HorairesDUneExpedition, instant: Date): Phase {
  const demiTour = demiTourDUneExpedition(horaires);
  if (!demiTour) return "aller";
  if (instant >= demiTour.le) return "retour";
  const sejour = sejourDUneExpedition(horaires);
  return sejour && instant >= sejour.debut ? "sejour" : "aller";
}

/**
 * US-0918 : l'instant du jeu où rentre au Foyer une Expédition : après l'aller, le séjour, qui ne commence qu'à l'arrivée
 * (US-0906), puis le retour, qui dure autant que l'aller (US-0912). Aucun tant que son trajet n'est pas chiffré. US-0920 :
 * rappelée, le retour part du rappel et dure le temps d'aller déjà fait.
 */
export function retourDUneExpedition(horaires: HorairesDUneExpedition): Date | null {
  const demiTour = demiTourDUneExpedition(horaires);
  return demiTour && new Date(demiTour.le.getTime() + demiTour.allerMs);
}

/**
 * US-0918 : l'instant du jeu où finit la phase d'une Expédition à l'instant `instant` : son arrivée sur la Case à l'aller,
 * la fin de la durée choisie en séjour (le compte à rebours d'US-0915), son retour au Foyer au retour. Aucun tant que son
 * trajet n'est pas chiffré. US-0920 : rappelée, son aller et son séjour finissent au rappel.
 */
export function finDeLaPhase(horaires: HorairesDUneExpedition, instant: Date): Date | null {
  const demiTour = demiTourDUneExpedition(horaires);
  if (!demiTour) return null;
  const phase = phaseDUneExpedition(horaires, instant);
  if (phase === "retour") return retourDUneExpedition(horaires);
  return phase === "aller" ? (sejourDUneExpedition(horaires)?.debut ?? demiTour.le) : demiTour.le;
}
