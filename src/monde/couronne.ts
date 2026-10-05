// La Couronne d'un Monde (US-0151) : ses Cases et le Biome de chacune. Le calcul ne dépend que
// de la graine du Monde : il donne toujours la même Couronne, et l'intérieur généré plus tard
// (étape 18) pourra prolonger les mêmes régions.
import { BIOMES_DE_LA_COURONNE, TAILLE_DES_REGIONS } from "@/reglages";
import { anneau, casesDesAnneaux, centre, voisines, type Coordonnees } from "./hex";

export type BiomeCouronne = keyof typeof BIOMES_DE_LA_COURONNE;
export type CaseDeCouronne = Coordonnees & { anneau: number; biome: BiomeCouronne; variante: string | null };

/** Un nombre tiré d'une suite d'entiers, toujours le même pour la même suite, entre 0 et 1. */
function hacher(...nombres: number[]): number {
  let h = 0x811c9dc5;
  for (const n of nombres) {
    h ^= n | 0;
    h = Math.imul(h, 0x01000193);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
  }
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32;
}

/** La graine d'un Monde, tirée de son nom : elle ne change jamais. */
export function graineDuMonde(nom: string): number {
  let h = 0x811c9dc5;
  for (const caractere of nom) h = Math.imul(h ^ caractere.codePointAt(0)!, 0x01000193);
  return h >>> 0;
}

/** Un relief doux et sans à-coups : des valeurs proches pour des points proches, un grain fin léger par-dessus. */
function bruit(x: number, y: number, graine: number): number {
  const lisser = (t: number) => t * t * (3 - 2 * t);
  let total = 0;
  let poids = 0;
  for (let octave = 0; octave < 2; octave++) {
    const echelle = 2 ** octave;
    const px = x * echelle;
    const py = y * echelle;
    const x0 = Math.floor(px);
    const y0 = Math.floor(py);
    const fx = lisser(px - x0);
    const fy = lisser(py - y0);
    const coin = (dx: number, dy: number) => hacher(x0 + dx, y0 + dy, graine, octave);
    const haut = coin(0, 0) + (coin(1, 0) - coin(0, 0)) * fx;
    const bas = coin(0, 1) + (coin(1, 1) - coin(0, 1)) * fx;
    const amplitude = 0.3 ** octave;
    total += (haut + (bas - haut) * fy) * amplitude;
    poids += amplitude;
  }
  return total / poids;
}

/** Combien de Cases pour chaque part, sur un total : les arrondis tombent juste. */
function repartir<T extends string>(total: number, parts: Record<T, number>): Record<T, number> {
  const cles = Object.keys(parts) as T[];
  const exactes = cles.map((cle) => total * parts[cle]);
  const nombres = exactes.map(Math.floor);
  const ordre = cles.map((_, i) => i).sort((a, b) => exactes[b] - nombres[b] - (exactes[a] - nombres[a]));
  for (let i = 0; nombres.reduce((s, n) => s + n, 0) < total; i++) nombres[ordre[i % ordre.length]]++;
  return Object.fromEntries(cles.map((cle, i) => [cle, nombres[i]])) as Record<T, number>;
}

/**
 * Les Cases de la Couronne : les `anneaux` anneaux extérieurs d'un Monde de `rayon` anneaux. La
 * prairie prend les régions où un premier relief est le plus haut ; les autres Biomes se
 * partagent le reste en bandes d'un second relief (lacs, forêts, montagnes, savanes, déserts).
 */
export function casesDeLaCouronne({ rayon, anneaux, graine }: { rayon: number; anneaux: number; graine: number }): CaseDeCouronne[] {
  const cases = casesDesAnneaux(rayon - anneaux + 1, rayon);
  const releve = (graineDuRelief: number) =>
    cases.map((c) => {
      const { x, y } = centre(c);
      return bruit(x / TAILLE_DES_REGIONS, y / TAILLE_DES_REGIONS, graineDuRelief);
    });
  const premier = releve(graine);
  const second = releve(graine ^ 0x5bd1e995);
  const nombres = repartir(cases.length, BIOMES_DE_LA_COURONNE);

  const biomes = new Array<BiomeCouronne>(cases.length);
  const parPremier = cases.map((_, i) => i).sort((a, b) => premier[b] - premier[a] || a - b);
  parPremier.slice(0, nombres.prairie).forEach((i) => (biomes[i] = "prairie"));
  const reste = parPremier.slice(nombres.prairie).sort((a, b) => second[a] - second[b] || a - b);
  let curseur = 0;
  for (const biome of ["eau", "foret", "montagne", "savane", "desert"] as const) {
    for (const i of reste.slice(curseur, curseur + nombres[biome])) biomes[i] = biome;
    curseur += nombres[biome];
  }
  fondreLesTaches(cases, biomes);
  return cases.map((c, i) => ({ ...c, anneau: anneau(c), biome: biomes[i], variante: biomes[i] === "eau" ? "lac" : null }));
}

/** La plus petite région gardée : en dessous, une tache prend le Biome le plus présent autour d'elle. */
const REGION_MINIMALE = 3;

/**
 * Fond dans leur voisinage les taches d'une ou deux Cases qu'un découpage en bandes laisse aux
 * frontières. Les parts de chaque Biome bougent à peine (un ou deux points).
 */
function fondreLesTaches(cases: Coordonnees[], biomes: BiomeCouronne[]): void {
  const indice = new Map(cases.map((c, i) => [`${c.q},${c.r}`, i]));
  const autour = cases.map((c) => voisines(c).flatMap((v) => indice.get(`${v.q},${v.r}`) ?? []));
  for (let passage = 0; passage < 3; passage++) {
    const vu = new Array<boolean>(cases.length).fill(false);
    let fondues = 0;
    for (let depart = 0; depart < cases.length; depart++) {
      if (vu[depart]) continue;
      const region = [depart];
      vu[depart] = true;
      for (let k = 0; k < region.length; k++) {
        for (const v of autour[region[k]]) {
          if (!vu[v] && biomes[v] === biomes[depart]) {
            vu[v] = true;
            region.push(v);
          }
        }
      }
      if (region.length >= REGION_MINIMALE) continue;
      const comptes = new Map<BiomeCouronne, number>();
      for (const i of region) for (const v of autour[i]) if (biomes[v] !== biomes[depart]) comptes.set(biomes[v], (comptes.get(biomes[v]) ?? 0) + 1);
      const majoritaire = [...comptes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
      if (!majoritaire) continue;
      for (const i of region) biomes[i] = majoritaire;
      fondues++;
    }
    if (fondues === 0) return;
  }
}
