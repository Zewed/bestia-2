// US-0411 : les rivières d'un Monde généré : RIVIERES_PAR_MONDE suites de Cases d'eau voisines, chacune
// partant du pied d'une chaîne de montagnes et descendant, de proche en proche, vers la côte ou le lac le
// plus proche ; un affluent rejoint une autre rivière et s'arrête là. Elles ne forment jamais de boucle,
// n'entrent jamais dans le Cœur sauvage et peuvent traverser la Couronne. Côté serveur et scripts uniquement.
import { RIVIERE_MIN_CASES, RIVIERES_PAR_MONDE } from "@/reglages";
import { hacher } from "./couronne";
import { dansLeCoeur, distance } from "./hex";
import { champ, FileDePriorite, regionsDe, regionsEntieres, type Biome, type Grille, type Variante } from "./regions";

/** US-0411 : deux sources sont à au moins 10 Cases l'une de l'autre : les rivières se répartissent sur le Monde. */
const ECART_ENTRE_SOURCES = 10;
/** US-0411 : l'échelle des méandres, en Cases à peu près. */
const TAILLE_DES_MEANDRES = 4;
/** US-0411 : combien les méandres détournent une rivière du plus court chemin vers l'eau. */
const SINUOSITE = 8;

/**
 * US-0411 : les rivières d'un Monde, chacune la liste de ses Cases, de sa source à son bout, pour les poser
 * sur ses `biomes`. Une rivière coule sur la terre, hors des montagnes et du Cœur sauvage, en suivant la
 * pente : l'éloignement à la côte ou au lac le plus proche, compté de proche en proche, chaque Case y
 * ajoutant un relief doux qui la fait serpenter ; de chaque Case, elle descend vers sa voisine la plus
 * basse. La pente baissant à chaque pas, elle ne repasse jamais par une Case, ni n'en frôle une qu'elle a
 * déjà quittée : elle ne forme pas de boucle.
 *
 * Les sources sont des Cases au pied d'une chaîne, prises les plus loin de l'eau d'abord, dans un ordre
 * que la graine brouille, chacune à au moins ECART_ENTRE_SOURCES Cases des autres. Une rivière finit sur
 * la première Case qui touche une côte ou un lac, ou une autre rivière : elle s'y jette, en un seul point,
 * là où l'autre coule seule depuis au moins RIVIERE_MIN_CASES Cases. Elle est abandonnée, et la source
 * suivante essaie, si elle compte moins de RIVIERE_MIN_CASES Cases, finit entre deux eaux, ôte à une Case
 * de côte sa dernière terre, ou laisse d'une région qu'elle traverse un morceau trop petit. US-0413 : elle
 * contourne les Cases `reservee`, les poches de prairie de la Couronne.
 */
export function rivieresDuMonde(
  grille: Grille,
  biomes: Biome[],
  variantes: (Variante | null)[],
  { rayonCoeur, graine, reservee = () => false }: { rayonCoeur: number; graine: number; reservee?: (i: number) => boolean },
): number[][] {
  const n = grille.cases.length;
  const coeur = (i: number) => dansLeCoeur(grille.cases[i], rayonCoeur);
  const libre = (i: number) => biomes[i] !== "eau" && biomes[i] !== "montagne" && !coeur(i) && !reservee(i);
  const arrivee = (i: number) => variantes[i] === "cote" || variantes[i] === "lac";
  // Chaque étendue d'eau où une rivière peut finir : une mer, par sa côte, ou un lac.
  const etendue = new Int32Array(n).fill(-1);
  const douce = variantes.map((v) => v === "lac");
  regionsDe(grille, douce, (i) => biomes[i] === "eau").forEach((cases, k) => cases.forEach((i) => (etendue[i] = k)));

  // La pente et, pour chaque Case, sa voisine la plus basse, vers laquelle elle coule.
  const meandres = champ(grille, graine ^ 0x68e31da4, TAILLE_DES_MEANDRES);
  const pente = new Float64Array(n).fill(Infinity);
  const aval = new Int32Array(n).fill(-1);
  const file = new FileDePriorite();
  grille.cases.forEach((_, i) => arrivee(i) && file.ajouter((pente[i] = 0), i, 0));
  while (file.taille > 0) {
    const { cle, case_: i } = file.retirer();
    if (cle > pente[i]) continue;
    for (const v of grille.autour[i]) {
      const hauteur = cle + 1 + SINUOSITE * meandres[v];
      if (!libre(v) || hauteur >= pente[v]) continue;
      pente[v] = hauteur;
      aval[v] = i;
      file.ajouter(hauteur, v, 0);
    }
  }

  // Le rang de chaque Case de rivière depuis sa source, −1 hors des rivières.
  const rang = new Int32Array(n).fill(-1);
  const tracer = (source: number): number[] | null => {
    const riviere: number[] = [];
    for (let i = source; ; i = aval[i]) {
      riviere.push(i);
      const rejointes = grille.autour[i].filter((v) => rang[v] >= 0);
      const arrivees = new Set(grille.autour[i].filter(arrivee).map((v) => etendue[v]));
      if (rejointes.length === 0 && arrivees.size === 0) continue;
      // Un confluent : la rivière touche l'autre en une ou deux Cases voisines, loin de leurs sources.
      const confluent =
        arrivees.size === 0 &&
        rejointes.length <= 2 &&
        rejointes.every((v) => rang[v] >= RIVIERE_MIN_CASES && rejointes.every((w) => w === v || grille.autour[v].includes(w)));
      const finit = rejointes.length === 0 ? arrivees.size === 1 : confluent;
      return finit && riviere.length >= RIVIERE_MIN_CASES ? riviere : null;
    }
  };

  const terrain = [...biomes];
  const tirage = grille.cases.map((c) => hacher(c.q, c.r, graine, 0x52));
  const sources = grille.cases
    .map((_, i) => i)
    .filter((i) => libre(i) && pente[i] < Infinity && grille.autour[i].some((v) => biomes[v] === "montagne" && !coeur(v)))
    .sort((a, b) => pente[b] * (0.5 + tirage[b]) - pente[a] * (0.5 + tirage[a]) || a - b);
  const rivieres: number[][] = [];
  for (const source of sources) {
    if (rivieres.length >= RIVIERES_PAR_MONDE) break;
    if (rang[source] >= 0 || rivieres.some((r) => distance(grille.cases[r[0]], grille.cases[source]) < ECART_ENTRE_SOURCES)) continue;
    const riviere = tracer(source);
    if (!riviere) continue;
    for (const i of riviere) terrain[i] = "eau";
    const bord = riviere.flatMap((i) => grille.autour[i]);
    const coteTenue = bord.every((v) => variantes[v] !== "cote" || grille.autour[v].some((w) => terrain[w] !== "eau"));
    if (coteTenue && regionsEntieres(grille, terrain, bord)) {
      riviere.forEach((i, k) => (rang[i] = k));
      rivieres.push(riviere);
    } else for (const i of riviere) terrain[i] = biomes[i];
  }
  return rivieres;
}
