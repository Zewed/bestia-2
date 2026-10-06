const entiers = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/**
 * Une quantité telle que le joueur la lit (US-0203) : un nombre entier, arrondi vers le bas pour ne
 * jamais promettre ce qu'il n'a pas, les milliers séparés par une espace insécable (12 500). L'espace
 * fine que donne le français est presque invisible dans la police du jeu : on la remplace.
 */
export function quantiteAffichee(quantite: string | number): string {
  return entiers.format(Math.floor(Number(quantite))).replace(/\u202f/g, "\u00a0");
}
