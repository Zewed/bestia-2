// L'heure du jeu qui avance dans le navigateur, pour les comptes à rebours en direct. Dans le navigateur seulement.
import { useEffect, useState } from "react";

/**
 * US-0918 : l'heure du jeu, partie de `maintenant`, donnée par le serveur à l'affichage, et qui avance chaque seconde au
 * rythme du jeu (`vitesse`, donnée par le serveur aussi) sur l'horloge du navigateur, comme le compte à rebours des
 * Voyageurs (US-0333) : jamais l'heure du téléphone ou de l'ordinateur, seulement le temps écoulé depuis l'affichage.
 * Quand la page est relue, tout repart de la nouvelle heure.
 */
export function useHeureDuJeu(maintenant: Date, vitesse = 1): Date {
  const base = maintenant.getTime();
  // Le temps écoulé depuis l'affichage, mesuré pour cette heure du jeu-là : celui d'une heure déjà dépassée ne compte plus.
  const [ecoule, setEcoule] = useState<{ base: number; ms: number } | null>(null);
  useEffect(() => {
    const depart = performance.now();
    const battement = setInterval(() => setEcoule({ base, ms: performance.now() - depart }), 1000);
    return () => clearInterval(battement);
  }, [base]);
  return new Date(base + (ecoule?.base === base ? vitesse * ecoule.ms : 0));
}
