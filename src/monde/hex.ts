// La géométrie des Cases : des hexagones repérés par deux coordonnées (q, r), le Cœur sauvage
// au centre (0, 0). Le Monde est un grand hexagone (US-0402) : toutes les Cases à au plus son
// rayon du centre. Les distances se comptent d'une seule façon, par `distance`, partout ;
// l'anneau d'une Case est sa distance au centre.

export type Coordonnees = { q: number; r: number };

/** Le centre du Monde, au cœur du Cœur sauvage. */
export const CENTRE: Coordonnees = { q: 0, r: 0 };

/**
 * US-0402 : la distance entre deux Cases, en nombre de Cases à franchir de l'une à l'autre. C'est la
 * seule façon de la compter dans le jeu (trajets, brouillard, Couronne) ; seule la contrainte
 * case_anneau_exact de la base refait le même calcul, pour vérifier l'anneau de chaque Case.
 */
export function distance(a: Coordonnees, b: Coordonnees): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

/** La distance au centre : 0 au Cœur sauvage, le rayon du Monde sur son bord. */
export function anneau(c: Coordonnees): number {
  return distance(c, CENTRE);
}

/** Les six directions d'une Case vers ses voisines. */
export const DIRECTIONS: readonly Coordonnees[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function voisines({ q, r }: Coordonnees): Coordonnees[] {
  return DIRECTIONS.map((d) => ({ q: q + d.q, r: r + d.r }));
}

/** US-0402 : si une Case fait partie d'un Monde de `rayon` Cases de rayon. */
export function dansLeMonde(c: Coordonnees, rayon: number): boolean {
  return anneau(c) <= rayon;
}

/** US-0403 : si une Case appartient au Cœur sauvage d'un Monde : à moins de `rayonCoeur` Cases du milieu. */
export function dansLeCoeur(c: Coordonnees, rayonCoeur: number): boolean {
  return anneau(c) < rayonCoeur;
}

/** US-0402 : les voisines d'une Case dans un Monde de `rayon` Cases de rayon : six, quatre sur le bord, trois aux six coins. */
export function voisinesDansLeMonde(c: Coordonnees, rayon: number): Coordonnees[] {
  return voisines(c).filter((v) => dansLeMonde(v, rayon));
}

/** Toutes les Cases dont l'anneau est entre `de` et `a`, bornes comprises. */
export function casesDesAnneaux(de: number, a: number): Coordonnees[] {
  const cases: Coordonnees[] = [];
  for (let q = -a; q <= a; q++) {
    for (let r = Math.max(-a, -q - a); r <= Math.min(a, -q + a); r++) {
      const k = anneau({ q, r });
      if (k >= de && k <= a) cases.push({ q: q + 0, r: r + 0 }); // + 0 : jamais de « -0 »
    }
  }
  return cases;
}

/** Le centre d'une Case dans le plan, pour une Case de rayon 1 (pointe en haut). */
export function centre({ q, r }: Coordonnees): { x: number; y: number } {
  return { x: Math.sqrt(3) * (q + r / 2), y: 1.5 * r };
}
