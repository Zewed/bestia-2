// US-0407 : le climat d'un Monde généré, pour que les Biomes voisins aillent bien ensemble. Un côté du
// Monde est froid, le côté opposé chaud : la température suit un axe de l'hexagone, tiré de la graine,
// sous un bruit doux ; l'humidité est un autre bruit. Les montagnes suivent des crêtes et forment des
// chaînes. Enfin, aucun voisinage que les données du jeu interdisent (jamais_a_cote_de, biomes.yaml) ne
// reste. Côté serveur et scripts uniquement.
import { CHAINE_ALLONGEMENT_MIN, PARTS_DES_BIOMES, REGION_BIOME_MIN_CASES } from "@/reglages";
import { hacher } from "./couronne";
import { centre } from "./hex";
import { BIOMES_DE_TERRE, champ, climatMoyen, regionsDe, type Biome, type BiomeDeTerre, type Climat, type Grille, type Interdit } from "./regions";

/** US-0406 : l'échelle du climat, en Cases à peu près : la largeur d'une grande région. */
const TAILLE_DU_CLIMAT = 28;
/** US-0407 : la force du bruit sur la température, qui va de −1 au milieu du côté froid à 1 au milieu du côté chaud. */
const BRUIT_DE_TEMPERATURE = 0.35;

/**
 * US-0407 : le climat de chaque Case. Sa température va de −1 au milieu du côté froid du Monde à 1 au
 * milieu du côté opposé, le chaud, plus un bruit doux qui ondule les frontières ; le côté froid est l'un
 * des six côtés de l'hexagone, tiré de la graine. Son humidité est un autre bruit doux, de 0 à 1.
 */
export function climatDuMonde(grille: Grille, rayon: number, graine: number): Climat {
  const angle = Math.PI / 6 + (Math.PI / 3) * Math.floor(hacher(graine, 0x7f4a7c15) * 6);
  const bruits = champ(grille, graine ^ 0x7e3a5c21, TAILLE_DU_CLIMAT);
  const temperature = grille.cases.map((c, i) => {
    const { x, y } = centre(c);
    // Le milieu d'un côté de l'hexagone est à 1,5 fois son rayon du centre, dans le plan des Cases.
    return (x * Math.cos(angle) + y * Math.sin(angle)) / (1.5 * rayon) + BRUIT_DE_TEMPERATURE * (2 * bruits[i] - 1);
  });
  return { temperature, humidite: champ(grille, graine ^ 0x41d3b6a5, TAILLE_DU_CLIMAT) };
}

/**
 * US-0407 : l'allongement d'une région, sa longueur divisée par sa largeur. Sa longueur est le plus long
 * chemin de proche en proche qu'on y trouve (cherché depuis le bout le plus éloigné de sa première Case),
 * sa largeur ses Cases divisées par sa longueur : une chaîne de 30 Cases sur 3 vaut 10, une tache ronde à
 * peine plus de 1.
 */
export function allongement(grille: Grille, region: number[]): number {
  const dans = new Set(region);
  const plusLoin = (depart: number) => {
    const pas = new Map([[depart, 0]]);
    const file = [depart];
    for (let k = 0; k < file.length; k++) {
      for (const v of grille.autour[file[k]]) {
        if (!dans.has(v) || pas.has(v)) continue;
        pas.set(v, pas.get(file[k])! + 1);
        file.push(v);
      }
    }
    return { bout: file[file.length - 1], longueur: pas.get(file[file.length - 1])! + 1 };
  };
  const { longueur } = plusLoin(plusLoin(region[0]).bout);
  return longueur / (region.length / longueur);
}

/** US-0407 : l'échelle des crêtes, en Cases à peu près : plus elle est grande, plus les chaînes sont longues et espacées. */
const TAILLE_DES_CRETES = 20;
/** US-0407 : l'échelle des massifs, le bruit qui ne garde les crêtes que sur la moitié du Monde. */
const TAILLE_DES_MASSIFS = 40;

/**
 * US-0407 : les Cases de montagne parmi les Cases `libres`, en chaînes. Une crête suit les lignes où un
 * bruit doux passe par son milieu : de longues lignes sinueuses ; un second bruit, les massifs, n'en garde
 * que sur la moitié du Monde où il est le plus haut, pour des chaînes qui commencent et finissent. Les
 * Cases les plus hautes de ces crêtes deviennent montagne, la part de PARTS_DES_BIOMES ; une poche de
 * plaine trop petite pour une région, enfermée dans une chaîne, devient montagne elle aussi. Enfin, une
 * région trop petite, ou trop ronde pour une chaîne (moins de CHAINE_ALLONGEMENT_MIN fois plus longue que
 * large), est rendue à la plaine.
 */
export function chainesDeMontagnes(grille: Grille, libre: (i: number) => boolean, graine: number): boolean[] {
  const crete = champ(grille, graine ^ 0x1b873593, TAILLE_DES_CRETES).map((b) => 1 - Math.abs(2 * b - 1));
  const massif = champ(grille, graine ^ 0x85ebca6b, TAILLE_DES_MASSIFS);
  const libres = grille.cases.map((_, i) => i).filter(libre);
  const montagne = grille.cases.map(() => false);
  [...libres]
    .sort((a, b) => massif[b] - massif[a] || a - b)
    .slice(0, libres.length >> 1)
    .sort((a, b) => crete[b] - crete[a] || a - b)
    .slice(0, Math.round(PARTS_DES_BIOMES.montagne * libres.length))
    .forEach((i) => (montagne[i] = true));
  for (const poche of regionsDe(grille, montagne, (i) => libre(i) && !montagne[i])) {
    if (poche.length < REGION_BIOME_MIN_CASES) for (const i of poche) montagne[i] = true;
  }
  for (const region of regionsDe(grille, montagne, (i) => montagne[i])) {
    if (region.length < REGION_BIOME_MIN_CASES || allongement(grille, region) < CHAINE_ALLONGEMENT_MIN) for (const i of region) montagne[i] = false;
  }
  return montagne;
}

/** US-0407 : les Biomes qu'une province peut prendre pour éviter un voisinage interdit : pas la montagne, faite de chaînes. */
const BIOMES_DE_RECHANGE = BIOMES_DE_TERRE.filter((b) => b !== "montagne");

/**
 * US-0407 : ôte du Monde tout voisinage interdit, en changeant le Biome d'unités entières (des provinces ou
 * des régions du Cœur sauvage, `unites`), jamais d'une Case seule : aucune petite région n'en naît. Tant
 * qu'une unité touche un Biome interdit à côté du sien, l'une d'elles prend un Biome qui s'accorde avec tout
 * ce qui l'entoure : celle, et celui, dont le climat est le plus proche (rangs de température et
 * d'humidité, comparés au climat moyen des provinces de chaque Biome). Le Cœur sauvage ne change qu'en
 * dernier recours. Chaque changement ôte au moins un voisinage interdit sans en créer : la boucle finit.
 * Prairie et forêt vont avec tout : il y a toujours un Biome possible.
 */
export function eviterLesVoisinagesInterdits(
  grille: Grille,
  biomes: Biome[],
  { unites, duCoeur, climat, interdit }: { unites: number[][]; duCoeur: (u: number) => boolean; climat: Climat; interdit: Interdit },
): void {
  const moyen = climatMoyen(unites, climat);
  const rangs = (valeurs: number[]) => {
    const rang = new Array<number>(valeurs.length);
    valeurs
      .map((_, u) => u)
      .sort((a, b) => valeurs[a] - valeurs[b] || a - b)
      .forEach((u, k) => (rang[u] = k / Math.max(1, valeurs.length - 1)));
    return rang;
  };
  const temperature = rangs(moyen.temperature);
  const humidite = rangs(moyen.humidite);
  const climatDe = new Map<BiomeDeTerre, { temperature: number; humidite: number }>();
  for (const biome of BIOMES_DE_RECHANGE) {
    const siennes = unites.map((_, u) => u).filter((u) => !duCoeur(u) && biomes[unites[u][0]] === biome);
    if (siennes.length === 0) continue;
    climatDe.set(biome, {
      temperature: siennes.reduce((s, u) => s + temperature[u], 0) / siennes.length,
      humidite: siennes.reduce((s, u) => s + humidite[u], 0) / siennes.length,
    });
  }
  const unite = new Int32Array(grille.cases.length).fill(-1);
  unites.forEach((membres, u) => membres.forEach((i) => (unite[i] = u)));
  // Les Cases qui touchent chaque unité sans en être.
  const bordure = unites.map((membres, u) => [...new Set(membres.flatMap((i) => grille.autour[i].filter((v) => unite[v] !== u)))]);
  for (let changements = 0; changements < unites.length; changements++) {
    let meilleur: { u: number; biome: BiomeDeTerre; ecart: number } | null = null;
    for (const [u, membres] of unites.entries()) {
      const sien = biomes[membres[0]];
      const autour = new Set(bordure[u].map((v) => biomes[v]));
      if (![...autour].some((autre) => interdit(sien, autre))) continue;
      for (const biome of BIOMES_DE_RECHANGE) {
        const ideal = climatDe.get(biome);
        if (biome === sien || !ideal || [...autour].some((autre) => interdit(biome, autre))) continue;
        const ecart = (temperature[u] - ideal.temperature) ** 2 + (humidite[u] - ideal.humidite) ** 2 + (duCoeur(u) ? 10 : 0);
        if (!meilleur || ecart < meilleur.ecart) meilleur = { u, biome, ecart };
      }
    }
    if (!meilleur) return;
    for (const i of unites[meilleur.u]) biomes[i] = meilleur.biome;
  }
}
