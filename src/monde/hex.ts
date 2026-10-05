// La géométrie des Cases : des hexagones repérés par deux coordonnées (q, r), le Cœur sauvage
// au centre (0, 0). L'anneau d'une Case est sa distance au centre, en Cases.

export type Coordonnees = { q: number; r: number };

/** La distance au centre : 0 au Cœur sauvage, le rayon du Monde sur son bord. */
export function anneau({ q, r }: Coordonnees): number {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
}

/** La distance entre deux Cases, en Cases. */
export function distance(a: Coordonnees, b: Coordonnees): number {
  return anneau({ q: a.q - b.q, r: a.r - b.r });
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
