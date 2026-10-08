// US-0413 : les poches de prairie de la Couronne d'un Monde généré, où naissent les joueurs. Le climat
// met un côté du Monde dans le froid et l'autre dans le chaud (US-0407) : sans elles, la Couronne qui en
// fait le tour n'aurait de prairie que sur ses côtés tempérés. Des poches de prairie y sont donc
// réservées avant tout le reste, régulièrement réparties sur tout son tour : tous les départs se valent
// (ADR 0008), où que l'on naisse. La mer, les montagnes et les rivières les contournent ; la prairie va
// avec tous les Biomes. Côté serveur et scripts uniquement.
import { POCHE_DE_PRAIRIE_CASES, POCHES_DE_PRAIRIE } from "@/reglages";
import { hacher } from "./couronne";
import { anneau, distance, tourDeLAnneau } from "./hex";
import { champ, FileDePriorite, type Grille } from "./regions";

/** US-0413 : l'échelle du relief qui ondule le bord des poches, en Cases à peu près. */
const TAILLE_DES_BORDS = 3;
/** US-0413 : combien ce relief détourne une poche de la forme ronde. */
const SINUOSITE_DES_BORDS = 3;

/**
 * US-0413 : les Cases des poches de prairie d'un Monde. POCHES_DE_PRAIRIE germes sont posés à intervalles
 * réguliers sur l'anneau du milieu de la Couronne, le premier décalé selon la graine ; chaque poche
 * s'étend autour de son germe, les Cases les plus proches d'abord sous un relief fin qui ondule son bord,
 * de proche en proche et sans sortir de la Couronne, jusqu'à POCHE_DE_PRAIRIE_CASES Cases. Serrée dans la
 * largeur de la Couronne, elle s'allonge le long de son tour.
 */
export function pochesDePrairie(grille: Grille, { rayon, anneaux, graine }: { rayon: number; anneaux: number; graine: number }): boolean[] {
  const poche = grille.cases.map(() => false);
  const dansLaCouronne = (i: number) => anneau(grille.cases[i]) > rayon - anneaux;
  const milieu = tourDeLAnneau(rayon - (anneaux >> 1));
  const intervalle = milieu.length / POCHES_DE_PRAIRIE;
  const decalage = hacher(graine, 0x13) * milieu.length;
  const bords = champ(grille, graine ^ 0x6a09e667, TAILLE_DES_BORDS);
  for (let k = 0; k < POCHES_DE_PRAIRIE; k++) {
    // Chaque germe s'écarte un peu de sa place régulière, d'au plus un quart d'intervalle : un collier sans raideur.
    const ecart = (hacher(graine, k, 0x14) - 0.5) * (intervalle / 2);
    const c = milieu[Math.floor(decalage + k * intervalle + ecart + milieu.length) % milieu.length];
    const germe = grille.indice.get(`${c.q},${c.r}`)!;
    const file = new FileDePriorite();
    const vue = new Set([germe]);
    file.ajouter(0, germe, k);
    for (let prises = 0; file.taille > 0 && prises < POCHE_DE_PRAIRIE_CASES; ) {
      const { case_: i } = file.retirer();
      if (poche[i]) continue;
      poche[i] = true;
      prises++;
      for (const v of grille.autour[i]) {
        if (vue.has(v) || poche[v] || !dansLaCouronne(v)) continue;
        vue.add(v);
        file.ajouter(distance(grille.cases[germe], grille.cases[v]) + SINUOSITE_DES_BORDS * bords[v], v, k);
      }
    }
  }
  return poche;
}
