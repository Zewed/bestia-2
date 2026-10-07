// US-0410 : les lacs d'un Monde généré : LACS_PAR_MONDE petites étendues d'eau, de LAC_MIN_CASES à
// LAC_MAX_CASES Cases d'un seul tenant, à l'intérieur des terres : ni dans le Cœur sauvage, ni dans la
// Couronne, dont ils mangeraient la place des naissances, ni sur les montagnes, dont ils casseraient les
// chaînes. Une Case de terre au moins sépare chaque lac de la mer, de sa côte et des autres lacs ; les
// régions de terre qui les bordent gardent leurs règles. Côté serveur et scripts uniquement.
import { LAC_MAX_CASES, LAC_MIN_CASES, LACS_PAR_MONDE } from "@/reglages";
import { hacher } from "./couronne";
import { anneau, dansLeCoeur, distance } from "./hex";
import { champ, FileDePriorite, regionsEntieres, type Biome, type Grille } from "./regions";

/** US-0410 : deux lacs naissent à au moins 12 Cases l'un de l'autre : ils se répartissent sur le Monde. */
const ECART_ENTRE_LACS = 12;
/** US-0410 : l'échelle des cuvettes que les lacs remplissent, en Cases à peu près. */
const TAILLE_DES_CUVETTES = 4;
/** US-0410 : combien l'éloignement au germe freine un lac, pour des lacs ronds plutôt qu'effilés. */
const RONDEUR = 0.3;

/**
 * US-0410 : les lacs d'un Monde, chacun la liste de ses Cases, pour les poser sur ses `biomes`. Un lac
 * s'étend sur la terre de l'intérieur, hors des montagnes, sans toucher d'autre eau. Ses germes sont tirés
 * de la graine parmi ces Cases, chacun à au moins ECART_ENTRE_LACS Cases des autres ; chaque lac remplit
 * sa cuvette, les Cases les plus basses d'un relief fin d'abord, de proche en proche et sans trop s'écarter
 * de son germe, jusqu'à sa taille, tirée de la graine entre LAC_MIN_CASES et LAC_MAX_CASES. Un lac qui
 * n'atteint pas LAC_MIN_CASES Cases, ou qui laisserait d'une région qu'il borde un morceau trop petit, est
 * abandonné : le germe suivant essaie, jusqu'à LACS_PAR_MONDE lacs.
 */
export function lacsDuMonde(
  grille: Grille,
  biomes: Biome[],
  { rayon, anneaux, rayonCoeur, graine }: { rayon: number; anneaux: number; rayonCoeur: number; graine: number },
): number[][] {
  const terrain = [...biomes];
  const libre = (i: number) => {
    const c = grille.cases[i];
    return terrain[i] !== "eau" && terrain[i] !== "montagne" && !dansLeCoeur(c, rayonCoeur) && anneau(c) <= rayon - anneaux && grille.autour[i].every((v) => terrain[v] !== "eau");
  };
  const cuvette = champ(grille, graine ^ 0x2545f491, TAILLE_DES_CUVETTES);
  const tirage = grille.cases.map((c) => hacher(c.q, c.r, graine, 0x1a));
  const germes = grille.cases
    .map((_, i) => i)
    .filter(libre)
    .sort((a, b) => tirage[a] - tirage[b] || a - b);
  const lacs: number[][] = [];
  for (const germe of germes) {
    if (lacs.length >= LACS_PAR_MONDE) break;
    if (!libre(germe) || lacs.some((lac) => distance(grille.cases[lac[0]], grille.cases[germe]) < ECART_ENTRE_LACS)) continue;
    const taille = LAC_MIN_CASES + Math.floor(hacher(germe, graine, 0x1b) * (LAC_MAX_CASES - LAC_MIN_CASES + 1));
    const lac: number[] = [];
    const vue = new Set([germe]);
    const file = new FileDePriorite();
    file.ajouter(cuvette[germe], germe, 0);
    while (file.taille > 0 && lac.length < taille) {
      const { case_: i } = file.retirer();
      lac.push(i);
      for (const v of grille.autour[i]) {
        if (vue.has(v) || !libre(v)) continue;
        vue.add(v);
        file.ajouter(cuvette[v] + RONDEUR * distance(grille.cases[germe], grille.cases[v]), v, 0);
      }
    }
    if (lac.length < LAC_MIN_CASES) continue;
    for (const i of lac) terrain[i] = "eau";
    if (regionsEntieres(grille, terrain, lac.flatMap((i) => grille.autour[i]))) lacs.push(lac);
    else for (const i of lac) terrain[i] = biomes[i];
  }
  return lacs;
}
