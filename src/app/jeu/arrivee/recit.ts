// Le récit d'arrivée (US-0158) : quelques lignes, sans consigne ni explication du jeu.

/** « de Zénith », mais « d'Aube » : l'élision devant une voyelle ou un h. */
export function deMonde(monde: string): string {
  return /^[aeiouyàâäéèêëîïôöùûüh]/i.test(monde) ? `d'${monde}` : `de ${monde}`;
}

/** US-0975 : la phrase du récit qui dit que les Bêtes de naissance rôdent autour du Foyer, sans dire où. */
export const BETES_AUX_ABORDS = "Quelques Bêtes rôdent dans les abords.";

/**
 * Le récit, sous le nom du chef qui sert de titre. Tous les Foyers naissent en prairie (ADR 0008). US-0975 : avec une
 * phrase de plus tant que ses Bêtes de naissance (`betes`) sont là.
 */
export function recitDArrivee(monde: string, betes = false): string {
  const recit = `Une prairie au bord du Monde, sur la Couronne ${deMonde(monde)}. C'est ici que naît votre Foyer.`;
  return betes ? `${recit} ${BETES_AUX_ABORDS}` : recit;
}
