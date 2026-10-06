// Le récit d'arrivée (US-0158) : quelques lignes, sans consigne ni explication du jeu.

/** « de Zénith », mais « d'Aube » : l'élision devant une voyelle ou un h. */
export function deMonde(monde: string): string {
  return /^[aeiouyàâäéèêëîïôöùûüh]/i.test(monde) ? `d'${monde}` : `de ${monde}`;
}

/** Le récit, sous le nom du chef qui sert de titre. Tous les Foyers naissent en prairie (ADR 0008). */
export function recitDArrivee(monde: string): string {
  return `Une prairie au bord du Monde, sur la Couronne ${deMonde(monde)}. C'est ici que naît votre Foyer.`;
}
