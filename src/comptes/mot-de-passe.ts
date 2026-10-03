// La règle du mot de passe, une seule fois : le navigateur l'applique quand on quitte le champ,
// le serveur la refait à l'envoi (US-0105). Seule la longueur compte ; les espaces aussi.
import { MOT_DE_PASSE_MAX, MOT_DE_PASSE_MIN } from "@/reglages";

export const REGLE_MOT_DE_PASSE = `Au moins ${MOT_DE_PASSE_MIN} caractères.`;
export const MOT_DE_PASSE_TROP_COURT = `Le mot de passe doit contenir au moins ${MOT_DE_PASSE_MIN} caractères`;
export const MOT_DE_PASSE_TROP_LONG = `Le mot de passe doit contenir au plus ${MOT_DE_PASSE_MAX} caractères`;

/** Le message à afficher sous le champ, ou null si le mot de passe est accepté. Un emoji compte pour un caractère. */
export function verifierMotDePasse(valeur: string): string | null {
  const longueur = [...valeur].length;
  if (longueur < MOT_DE_PASSE_MIN) return MOT_DE_PASSE_TROP_COURT;
  if (longueur > MOT_DE_PASSE_MAX) return MOT_DE_PASSE_TROP_LONG;
  return null;
}
