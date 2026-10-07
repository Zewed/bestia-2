// US-0406 : les régions de Biomes d'un Monde généré, de vraies régions et non des taches. Le Monde est
// d'abord découpé en provinces : de petits morceaux d'un seul tenant, aux frontières sinueuses, d'au
// moins REGION_BIOME_MIN_CASES Cases chacun. Chaque province prend un seul Biome, d'après le climat
// moyen de ses Cases. Une région de Biome est donc faite de provinces entières : d'un seul tenant,
// jamais plus petite qu'une province, sans Case isolée. Côté serveur et scripts uniquement.
import { PARTS_DES_BIOMES, REGION_BIOME_MIN_CASES } from "@/reglages";
import { bruit, hacher } from "./couronne";
import { casesDesAnneaux, centre, distance, voisinesDansLeMonde, type Coordonnees } from "./hex";

/** Les huit Biomes de terre, dans l'ordre de biomes.yaml. */
export const BIOMES_DE_TERRE = ["prairie", "foret", "jungle", "savane", "desert", "montagne", "toundra", "banquise"] as const;
export type BiomeDeTerre = (typeof BIOMES_DE_TERRE)[number];
export type Biome = BiomeDeTerre | "eau";
/** Les variantes de l'eau, comme biomes.yaml les nomme : la mer et sa côte (US-0408, US-0409), les lacs, les rivières. */
export type Variante = "cote" | "lac" | "riviere" | "mer";

/** US-0407 : si deux Biomes ne peuvent jamais être voisins, d'après les données du jeu. */
export type Interdit = (a: Biome, b: Biome) => boolean;

/** Le Monde en tableaux : ses Cases rangées par q puis r et, pour chacune, les indices de ses voisines dans le Monde. */
export type Grille = { cases: Coordonnees[]; autour: number[][]; indice: Map<string, number> };

export function grilleDuMonde(rayon: number): Grille {
  const cases = casesDesAnneaux(0, rayon);
  const indice = new Map(cases.map((c, i) => [`${c.q},${c.r}`, i]));
  const autour = cases.map((c) => voisinesDansLeMonde(c, rayon).map((v) => indice.get(`${v.q},${v.r}`)!));
  return { cases, autour, indice };
}

/** Les régions d'un seul tenant : des Cases voisines de même étiquette, de proche en proche, parmi les Cases retenues. */
export function regionsDe<T>(grille: Grille, etiquettes: ArrayLike<T>, retenue: (i: number) => boolean = () => true): number[][] {
  const vu = new Uint8Array(grille.cases.length);
  const regions: number[][] = [];
  for (let depart = 0; depart < grille.cases.length; depart++) {
    if (vu[depart] || !retenue(depart)) continue;
    const region = [depart];
    vu[depart] = 1;
    for (let k = 0; k < region.length; k++) {
      for (const v of grille.autour[region[k]]) {
        if (!vu[v] && retenue(v) && etiquettes[v] === etiquettes[depart]) {
          vu[v] = 1;
          region.push(v);
        }
      }
    }
    regions.push(region);
  }
  return regions;
}

/**
 * US-0410, US-0411 : si les régions de terre où sont les Cases `bord` gardent chacune au moins
 * REGION_BIOME_MIN_CASES Cases d'un seul tenant : de l'eau vient d'être posée à côté d'elles, qui a pu
 * couper la terre. Chaque région n'est parcourue que jusqu'à cette taille.
 */
export function regionsEntieres(grille: Grille, biomes: Biome[], bord: Iterable<number>): boolean {
  const assezGrandes = new Set<number>();
  for (const depart of bord) {
    if (biomes[depart] === "eau" || assezGrandes.has(depart)) continue;
    const region = [depart];
    const dans = new Set(region);
    for (let k = 0; k < region.length && region.length < REGION_BIOME_MIN_CASES; k++) {
      for (const v of grille.autour[region[k]]) {
        if (dans.has(v) || biomes[v] !== biomes[depart]) continue;
        dans.add(v);
        region.push(v);
      }
    }
    if (region.length < REGION_BIOME_MIN_CASES) return false;
    for (const i of region) assezGrandes.add(i);
  }
  return true;
}

/** Un champ de bruit doux sur tout le Monde, de 0 à 1, à l'échelle de `taille` Cases à peu près. */
export function champ(grille: Grille, graine: number, taille: number): number[] {
  return grille.cases.map((c) => {
    const { x, y } = centre(c);
    return bruit(x / taille, y / taille, graine);
  });
}

/** Une file où sort d'abord la plus petite clé ; à égalité, la plus petite Case : un ordre fixé, sans hasard. */
export class FileDePriorite {
  private tas: { cle: number; case_: number; province: number }[] = [];

  get taille(): number {
    return this.tas.length;
  }

  private avant(a: number, b: number): boolean {
    const x = this.tas[a];
    const y = this.tas[b];
    return x.cle < y.cle || (x.cle === y.cle && x.case_ < y.case_);
  }

  private echanger(a: number, b: number): void {
    [this.tas[a], this.tas[b]] = [this.tas[b], this.tas[a]];
  }

  ajouter(cle: number, case_: number, province: number): void {
    this.tas.push({ cle, case_, province });
    for (let i = this.tas.length - 1; i > 0 && this.avant(i, (i - 1) >> 1); i = (i - 1) >> 1) this.echanger(i, (i - 1) >> 1);
  }

  retirer(): { cle: number; case_: number; province: number } {
    const premier = this.tas[0];
    const dernier = this.tas.pop()!;
    if (this.tas.length > 0) {
      this.tas[0] = dernier;
      for (let i = 0; ; ) {
        const gauche = 2 * i + 1;
        let plusPetit = i;
        if (gauche < this.tas.length && this.avant(gauche, plusPetit)) plusPetit = gauche;
        if (gauche + 1 < this.tas.length && this.avant(gauche + 1, plusPetit)) plusPetit = gauche + 1;
        if (plusPetit === i) break;
        this.echanger(i, plusPetit);
        i = plusPetit;
      }
    }
    return premier;
  }
}

/** US-0406 : l'écart entre deux germes de province, en Cases : une province en compte une trentaine. */
const ECART_ENTRE_PROVINCES = 5;
/** US-0406 : combien le terrain freine la croissance d'une province, pour des frontières sinueuses plutôt que droites. */
const RUGOSITE = 4;

/**
 * US-0406 : les provinces des Cases `libres`, chacune une liste de Cases d'un seul tenant. Des germes sont
 * semés dans un ordre tiré de la graine, chacun à au moins ECART_ENTRE_PROVINCES Cases des autres ; les
 * provinces poussent ensemble depuis leurs germes, chaque Case allant à celle qui l'atteint d'abord, sur
 * un terrain plus ou moins rude (un bruit fin) qui rend leurs frontières sinueuses. Une poche que nul
 * germe n'atteint fait sa propre province ; une province de moins de REGION_BIOME_MIN_CASES Cases se fond
 * dans la voisine qu'elle touche le plus.
 */
export function provinces(grille: Grille, libre: (i: number) => boolean, graine: number): number[][] {
  const n = grille.cases.length;
  const province = new Int32Array(n).fill(-1);
  const bloquee = new Uint8Array(n);
  const proches = casesDesAnneaux(0, ECART_ENTRE_PROVINCES - 1);
  const tirage = grille.cases.map((c) => hacher(c.q, c.r, graine, 0x50));
  const ordre = grille.cases.map((_, i) => i).filter(libre).sort((a, b) => tirage[a] - tirage[b] || a - b);
  const file = new FileDePriorite();
  let nombre = 0;
  for (const i of ordre) {
    if (bloquee[i]) continue;
    const { q, r } = grille.cases[i];
    for (const d of proches) {
      const j = grille.indice.get(`${q + d.q},${r + d.r}`);
      if (j !== undefined) bloquee[j] = 1;
    }
    file.ajouter(0, i, nombre++);
  }
  const rudesse = champ(grille, graine ^ 0x9e3779b9, 3);
  const atteinte = new Float64Array(n).fill(Infinity);
  while (file.taille > 0) {
    const { cle, case_, province: p } = file.retirer();
    if (province[case_] !== -1) continue;
    province[case_] = p;
    for (const v of grille.autour[case_]) {
      const cout = cle + 1 + RUGOSITE * rudesse[v];
      if (province[v] === -1 && libre(v) && cout < atteinte[v]) {
        atteinte[v] = cout;
        file.ajouter(cout, v, p);
      }
    }
  }
  // Les poches que nul germe n'atteint, enfermées par des Cases qui ne sont pas libres.
  for (const poche of regionsDe(grille, province, (i) => libre(i) && province[i] === -1)) {
    for (const i of poche) province[i] = nombre;
    nombre++;
  }
  const membres: number[][] = Array.from({ length: nombre }, () => []);
  grille.cases.forEach((_, i) => province[i] >= 0 && membres[province[i]].push(i));
  for (let fondues = 1; fondues > 0; ) {
    fondues = 0;
    for (let p = 0; p < nombre; p++) {
      if (membres[p].length === 0 || membres[p].length >= REGION_BIOME_MIN_CASES) continue;
      const contacts = new Map<number, number>();
      for (const i of membres[p]) for (const v of grille.autour[i]) if (province[v] >= 0 && province[v] !== p) contacts.set(province[v], (contacts.get(province[v]) ?? 0) + 1);
      const voisine = [...contacts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0];
      if (voisine === undefined) continue;
      for (const i of membres[p]) province[i] = voisine;
      membres[voisine].push(...membres[p]);
      membres[p] = [];
      fondues++;
    }
  }
  return membres.filter((m) => m.length > 0);
}

/**
 * Partage des provinces entre des étiquettes, dans l'ordre d'une mesure : les premières prennent la
 * première étiquette jusqu'à sa part des Cases du groupe, puis la suivante, et ainsi de suite. Une
 * province va à l'étiquette où tombe son milieu.
 */
function partager<T>(groupe: number[], tailles: number[], mesure: number[], parts: readonly (readonly [T, number])[]): Map<number, T> {
  const total = groupe.reduce((s, p) => s + tailles[p], 0);
  const somme = parts.reduce((s, [, part]) => s + part, 0);
  const choix = new Map<number, T>();
  let avant = 0;
  for (const p of [...groupe].sort((a, b) => mesure[a] - mesure[b] || a - b)) {
    const milieu = (avant + tailles[p] / 2) / total;
    let cumul = 0;
    const [etiquette] = parts.find(([, part]) => (cumul += part / somme) > milieu) ?? parts[parts.length - 1];
    choix.set(p, etiquette);
    avant += tailles[p];
  }
  return choix;
}

/** Le climat de chaque Case (US-0407, climat.ts) : sa température, du plus froid au plus chaud, et son humidité, du plus sec au plus humide. */
export type Climat = { temperature: number[]; humidite: number[] };

/** La température et l'humidité moyennes de chaque groupe de Cases. */
export function climatMoyen(groupes: number[][], climat: Climat): { temperature: number[]; humidite: number[] } {
  const moyenne = (valeurs: number[]) => groupes.map((m) => m.reduce((s, i) => s + valeurs[i], 0) / m.length);
  return { temperature: moyenne(climat.temperature), humidite: moyenne(climat.humidite) };
}

/**
 * US-0406 : le Biome de chaque province, d'après le climat moyen de ses Cases. Les provinces se rangent du
 * plus froid au plus chaud : banquise et toundra, puis prairie et forêt, puis désert, savane et jungle ;
 * du plus froid au moins froid parmi les froides, du plus sec au plus humide parmi les autres. Chaque
 * Biome reçoit à peu près sa part de PARTS_DES_BIOMES. Les montagnes, elles, forment des chaînes à part
 * (US-0407).
 */
export function biomesDesProvinces(membres: number[][], climat: Climat): BiomeDeTerre[] {
  const { temperature, humidite } = climatMoyen(membres, climat);
  const tailles = membres.map((m) => m.length);
  const part = PARTS_DES_BIOMES;
  const choix = new Array<BiomeDeTerre>(membres.length);
  const toutes = membres.map((_, p) => p);
  const groupes = partager(toutes, tailles, temperature, [
    ["froid", part.banquise + part.toundra],
    ["tempere", part.prairie + part.foret],
    ["chaud", part.desert + part.savane + part.jungle],
  ] as const);
  const dans = (groupe: string) => toutes.filter((p) => groupes.get(p) === groupe);
  const ranger = (groupe: number[], mesure: number[], biomes: BiomeDeTerre[]) =>
    partager(groupe, tailles, mesure, biomes.map((b) => [b, part[b]] as [BiomeDeTerre, number])).forEach((b, p) => (choix[p] = b));
  ranger(dans("froid"), temperature, ["banquise", "toundra"]);
  ranger(dans("tempere"), humidite, ["prairie", "foret"]);
  ranger(dans("chaud"), humidite, ["desert", "savane", "jungle"]);
  return choix;
}

/** US-0403 : les Biomes de terre que mêle le Cœur sauvage. */
const BIOMES_DU_COEUR = ["prairie", "foret", "montagne", "savane", "desert"] as const;

/** US-0403 : l'écart entre deux germes de région du Cœur sauvage, en Cases. */
const ECART_ENTRE_GERMES = 4;

/**
 * US-0403 : les régions du Cœur sauvage, chacune avec son Biome de terre : de petites régions de plusieurs
 * Biomes. Des germes sont semés dans le Cœur, dans un ordre tiré de la graine, chacun à au moins
 * ECART_ENTRE_GERMES Cases des autres ; chaque Case va au germe le plus proche. Chaque région est ainsi
 * d'un seul tenant et compte au moins son germe et ses voisines dans le Cœur (quatre Cases ou plus).
 * Semés jusqu'à ne plus trouver de place, les germes couvrent tout le Cœur à moins de quatre Cases : il
 * en faut au moins cinq dans un Cœur de 8 anneaux (169 Cases, quand chacun en couvre au plus 37). Les cinq
 * premiers reçoivent chacun un Biome différent, dans un ordre lui aussi tiré de la graine : tous ces
 * Biomes y sont.
 */
export function regionsDuCoeur(grille: Grille, coeur: boolean[], graine: number): { membres: number[][]; biomes: BiomeDeTerre[] } {
  const cases = grille.cases.flatMap((c, i) => (coeur[i] ? [i] : []));
  const tirage = (i: number) => hacher(grille.cases[i].q, grille.cases[i].r, graine, 0x43);
  const germes: Coordonnees[] = [];
  for (const i of [...cases].sort((a, b) => tirage(a) - tirage(b) || a - b)) {
    if (germes.every((g) => distance(g, grille.cases[i]) >= ECART_ENTRE_GERMES)) germes.push(grille.cases[i]);
  }
  const ordre = BIOMES_DU_COEUR.map((biome, i) => ({ biome, tirage: hacher(i, graine, 0x44) })).sort((a, b) => a.tirage - b.tirage);
  const membres: number[][] = germes.map(() => []);
  for (const i of cases) {
    // À égalité, le premier germe semé l'emporte : chaque région reste d'un seul tenant.
    const c = grille.cases[i];
    membres[germes.reduce((meilleur, g, k) => (distance(g, c) < distance(germes[meilleur], c) ? k : meilleur), 0)].push(i);
  }
  return { membres, biomes: germes.map((_, k) => ordre[k % ordre.length].biome) };
}

/**
 * US-0406 : fond chaque région de terre de moins de REGION_BIOME_MIN_CASES Cases (une région du Cœur
 * sauvage au bord du Cœur, par exemple) dans le Biome de terre qu'elle touche le plus, parmi ceux qui
 * peuvent voisiner avec tout ce qui l'entoure (US-0407). Les provinces et les chaînes de montagnes en ont
 * déjà assez : seules les petites régions du Cœur sont concernées.
 */
export function fondreLesPetitesRegions(grille: Grille, biomes: Biome[], interdit: Interdit): void {
  for (let passage = 0; passage < 5; passage++) {
    let fondues = 0;
    for (const region of regionsDe(grille, biomes, (i) => biomes[i] !== "eau")) {
      if (region.length >= REGION_BIOME_MIN_CASES) continue;
      const contacts = new Map<Biome, number>();
      for (const i of region) for (const v of grille.autour[i]) if (biomes[v] !== biomes[i]) contacts.set(biomes[v], (contacts.get(biomes[v]) ?? 0) + 1);
      const autour = [...contacts.keys()];
      const majoritaire = [...contacts.entries()]
        .filter(([biome]) => biome !== "eau" && autour.every((autre) => autre === biome || !interdit(biome, autre)))
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
      if (!majoritaire) continue;
      for (const i of region) biomes[i] = majoritaire;
      fondues++;
    }
    if (fondues === 0) return;
  }
}
