// US-0408 : la mer d'un Monde généré : une à trois grandes étendues d'eau d'un seul tenant, qui couvrent
// MER_PART des Cases du Monde, jamais dans le Cœur sauvage. Elle peut toucher la Couronne. Les côtes, les
// lacs et les rivières viendront ensuite (US-0409 à US-0411). Côté serveur et scripts uniquement.
import { MER_MIN_CASES, MER_PART, MERS_MAX, REGION_BIOME_MIN_CASES } from "@/reglages";
import { hacher } from "./couronne";
import { anneau, distance, eloignementDuCoeur } from "./hex";
import { champ, FileDePriorite, regionsDe, type Grille } from "./regions";

/** US-0408 : la mer reste à au moins 4 Cases du Cœur sauvage : elle n'y entre jamais, ni ne le borde. */
const MER_LOIN_DU_COEUR = 4;
/** US-0408 : une mer naît à au moins 15 Cases du Cœur sauvage et du bord du Monde, dans les terres… */
const GERME_LOIN_DU_BORD = 15;
/** … et à au moins 40 Cases d'une autre mer. */
const ECART_ENTRE_MERS = 40;
/** US-0408 : l'échelle des fonds marins, en Cases à peu près : le relief que la mer remplit d'abord par ses creux. */
const TAILLE_DES_FONDS = 24;
/** US-0408 : combien l'éloignement au germe freine la mer, pour des étendues ramassées plutôt qu'effilées. */
const RAMASSEMENT = 0.02;

/**
 * US-0408 : les Cases de mer d'un Monde. Une, deux ou trois mers, selon la graine, se partagent MER_PART des
 * Cases du Monde, chacune au moins MER_MIN_CASES. Chaque mer naît d'un germe tiré de la graine, dans les
 * terres, loin du Cœur sauvage et des autres mers, puis se remplit comme un bassin : les Cases les plus
 * basses d'un relief doux d'abord, de proche en proche, jusqu'à sa taille ; elle reste d'un seul tenant
 * et ne touche jamais une autre mer. Une mer qui n'atteint pas sa taille laisse le reste à la suivante.
 * Enfin, une poche de terre trop petite pour une région, enfermée par la mer, devient mer.
 */
export function merDuMonde(grille: Grille, { rayon, rayonCoeur, graine }: { rayon: number; rayonCoeur: number; graine: number }): boolean[] {
  const n = grille.cases.length;
  const permise = grille.cases.map((c) => eloignementDuCoeur(c, rayonCoeur) >= MER_LOIN_DU_COEUR);
  const dansLesTerres = (i: number) => eloignementDuCoeur(grille.cases[i], rayonCoeur) >= GERME_LOIN_DU_BORD && anneau(grille.cases[i]) <= rayon - GERME_LOIN_DU_BORD;
  const tirage = grille.cases.map((c) => hacher(c.q, c.r, graine, 0x6f));
  const germes: number[] = [];
  const voulues = 1 + Math.floor(hacher(graine, 0x6d) * MERS_MAX);
  // Les germes dans les terres d'abord ; ailleurs seulement si un petit Monde n'y a pas la place.
  const candidates = grille.cases
    .map((_, i) => i)
    .filter((i) => permise[i])
    .sort((a, b) => Number(dansLesTerres(b)) - Number(dansLesTerres(a)) || tirage[a] - tirage[b] || a - b);
  for (const i of candidates) {
    if (germes.length < voulues && germes.every((g) => distance(grille.cases[g], grille.cases[i]) >= ECART_ENTRE_MERS)) germes.push(i);
  }
  const total = Math.round(MER_PART * n);
  const poids = germes.map((_, k) => 0.5 + hacher(graine, k, 0x6e));
  const somme = poids.reduce((s, p) => s + p, 0);
  const tailles = poids.map((p) => Math.floor(MER_MIN_CASES + ((total - MER_MIN_CASES * germes.length) * p) / somme));
  const fond = champ(grille, graine ^ 0x3c6ef372, TAILLE_DES_FONDS);
  const mer = new Int32Array(n).fill(-1);
  let reste = 0;
  germes.forEach((germe, k) => {
    const taille = tailles[k] + reste;
    const vue = new Uint8Array(n);
    const file = new FileDePriorite();
    file.ajouter(fond[germe], germe, k);
    vue[germe] = 1;
    let prises = 0;
    while (file.taille > 0 && prises < taille) {
      const { case_: i } = file.retirer();
      // Jamais contre une autre mer : elles restent séparées.
      if (grille.autour[i].some((v) => mer[v] >= 0 && mer[v] !== k)) continue;
      mer[i] = k;
      prises++;
      for (const v of grille.autour[i]) {
        if (vue[v] || !permise[v] || mer[v] >= 0) continue;
        vue[v] = 1;
        file.ajouter(fond[v] + RAMASSEMENT * distance(grille.cases[germe], grille.cases[v]), v, k);
      }
    }
    reste = taille - prises;
  });
  for (const poche of regionsDe(grille, mer, (i) => mer[i] < 0)) {
    if (poche.length >= REGION_BIOME_MIN_CASES) continue;
    const voisine = poche.flatMap((i) => grille.autour[i]).find((v) => mer[v] >= 0);
    if (voisine !== undefined) for (const i of poche) mer[i] = mer[voisine];
  }
  return [...mer].map((k) => k >= 0);
}
