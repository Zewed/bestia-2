// Les Anneaux du Monde (US-0923) : des bandes de Cases à même distance du Cœur sauvage, de la Couronne, l'Anneau 1, au
// Cœur sauvage, le dernier. Plus un Anneau est intérieur, plus les Raretés élevées y apparaissent souvent (US-0927).
// À ne pas confondre avec l'anneau de hex.ts, la distance d'une Case au centre : un Anneau en réunit plusieurs. Rien n'en
// est gardé en base : l'Anneau d'une Case se tire de sa place et de la forme de son Monde, fixée sur sa fiche à sa
// naissance ; la même graine redonne donc toujours les mêmes Anneaux.
import { ANNEAUX_DU_MONDE } from "@/reglages";
import { anneau, type Coordonnees } from "./hex";

/** La forme d'un Monde, telle que sa fiche la garde : son rayon, la largeur de sa Couronne et le rayon de son Cœur sauvage. */
export type FormeDuMonde = { rayon: number; anneauxCouronne: number; rayonCoeur: number };

/**
 * US-0923 : l'Anneau de la Case `c`, de 1, exactement la Couronne, à `anneaux`, exactement le Cœur sauvage. Les anneaux de
 * Cases entre les deux se partagent les autres Anneaux d'un seul tenant, à un anneau près les uns des autres ; les plus
 * larges vers l'extérieur.
 */
export function anneauDUneCase(c: Coordonnees, { rayon, anneauxCouronne, rayonCoeur }: FormeDuMonde, anneaux = ANNEAUX_DU_MONDE): number {
  // Les anneaux de Cases entre la Couronne et le Cœur sauvage, du plus extérieur au plus intérieur, et les Anneaux qui se les partagent.
  const [exterieur, entreDeux, milieu] = [rayon - anneauxCouronne, rayon - anneauxCouronne - rayonCoeur + 1, anneaux - 2];
  if (milieu < 1) throw new Error(`Un Monde compte au moins 3 Anneaux : la Couronne, le Cœur sauvage et ce qui les sépare (pas ${anneaux}).`);
  if (entreDeux < milieu) throw new Error(`${entreDeux} anneaux de Cases entre la Couronne et le Cœur sauvage ne se partagent pas en ${milieu} Anneaux.`);
  const d = anneau(c);
  if (d > exterieur) return 1;
  if (d < rayonCoeur) return anneaux;
  return 2 + Math.floor(((exterieur - d) * milieu) / entreDeux);
}
