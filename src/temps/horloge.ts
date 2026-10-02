// L'heure du jeu, à une seule source : le serveur. L'horloge du téléphone ou de
// l'ordinateur d'un joueur ne compte jamais : tous les calculs passent par maintenant(),
// et ce module ne peut pas être chargé dans le navigateur (server-only).
// (L'accélération du temps en développement viendra se brancher ici, US-0030.)
import "server-only";

/** L'instant présent du jeu. Seule fonction du jeu qui lit l'horloge. */
export function maintenant(): Date {
  return new Date();
}
