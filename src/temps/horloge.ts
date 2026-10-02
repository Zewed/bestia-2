// L'heure du jeu, à une seule source : le serveur. L'horloge du téléphone ou de
// l'ordinateur d'un joueur ne compte jamais : tous les calculs passent par maintenant(),
// et ce module ne peut pas être chargé dans le navigateur (server-only).
//
// En développement et sur les prévisualisations, le temps peut être accéléré (US-0030) :
// heure du jeu = ancre du jeu + (heure réelle - ancre réelle) × vitesse. L'ancre est
// chargée au démarrage du serveur (synchroniserHorloge) ; sans elle, vitesse normale.
import "server-only";

export type Ancre = { facteur: number; reel: number; jeu: number };

// Next compile le démarrage du serveur (instrumentation) à part des pages : une simple
// variable de module ne serait pas partagée. L'ancre vit donc sur l'objet global du processus.
const CLE = Symbol.for("bestia.horloge.ancre");
const partage = globalThis as typeof globalThis & { [CLE]?: Ancre | null };

/** L'heure réelle du serveur, sans accélération. */
export function heureReelle(): number {
  return Date.now();
}

/** L'instant présent du jeu. Seule fonction du jeu qui donne l'heure du jeu. */
export function maintenant(): Date {
  const reel = heureReelle();
  const ancre = partage[CLE];
  if (!ancre) return new Date(reel);
  return new Date(ancre.jeu + (reel - ancre.reel) * ancre.facteur);
}

/** La vitesse du temps du jeu : 1 à vitesse normale, 100 pour « ×100 ». */
export function vitesse(): number {
  return partage[CLE]?.facteur ?? 1;
}

/** Fixe l'ancre de l'horloge (au démarrage du serveur, ou dans les tests). */
export function definirAncre(nouvelle: Ancre | null): void {
  partage[CLE] = nouvelle;
}

/** La vitesse demandée par la variable d'environnement BESTIA_VITESSE_TEMPS (1 si absente). */
export function vitesseDemandee(valeur = process.env.BESTIA_VITESSE_TEMPS): number {
  if (!valeur?.trim()) return 1;
  const facteur = Number(valeur);
  if (!Number.isFinite(facteur) || facteur <= 0) {
    throw new Error(`BESTIA_VITESSE_TEMPS doit être un nombre positif (reçu : « ${valeur} »).`);
  }
  return facteur;
}
