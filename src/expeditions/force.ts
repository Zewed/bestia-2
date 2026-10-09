// La force d'une escorte (US-0905) : ce qu'elle pèse face aux Bêtes sauvages qu'elle rencontre. Elle ne vient que des
// caractéristiques des Espèces de ses Bêtes, les mêmes chez tous les joueurs (ADR 0002), qu'aucune Recherche ne change
// (ADR 0005), et s'additionne sans règle de taille (ADR 0003). Côté serveur comme dans le navigateur.

/**
 * US-0905 : la force d'une Bête, tirée de l'attaque et de la vie de son Espèce : la racine carrée de leur produit,
 * arrondie (décidé le 2026-10-08). Une souris vaut 473 ; une Espèce sans arme, zéro.
 */
export function forceDUneBete({ attaque, vie }: { attaque: number; vie: number }): number {
  return Math.round(Math.sqrt(attaque * vie));
}

/**
 * US-0905 : la force d'une escorte : la simple somme des forces de ses Bêtes, Espèce par Espèce, sans bonus de groupe
 * ni règle de taille ; zéro sans escorte.
 */
export function forceDeLEscorte(betes: { force: number; nombre: number }[]): number {
  return betes.reduce((total, { force, nombre }) => total + force * nombre, 0);
}
