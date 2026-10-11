import { cache } from "react";
import { getPool } from "@/db";
import { biomesEnBase } from "@/donnees/en-base";
import { expeditionsEnCours } from "@/expeditions/en-cours";
import { carteDuJoueur } from "@/monde/carte";
import { maintenant } from "@/temps/horloge";

/**
 * Le Monde du joueur tel que la carte le montre, lu pour son Territoire à l'heure du jeu : sa carte, les Biomes en base
 * pour la légende, et ses Expéditions en cours (US-0913), avec cette heure. Lu une seule fois par affichage, que la carte
 * soit la page (/jeu/carte) ou la scène qui reste sous les autres pages du jeu (src/app/jeu/layout.tsx).
 */
export const mondeDuJoueur = cache(async (territoireId: number) => {
  const instant = maintenant();
  const [carte, biomes, expeditions] = await Promise.all([
    carteDuJoueur(getPool(), territoireId),
    biomesEnBase(getPool()),
    expeditionsEnCours(getPool(), territoireId, instant),
  ]);
  return { instant, carte, biomes, expeditions };
});
