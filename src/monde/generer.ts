// Générer un Monde entier à partir d'une graine (US-0401), pour pouvoir le recréer à l'identique.
// Côté serveur et scripts uniquement.
import type { PoolClient } from "pg";
import { lireVoisinagesInterdits } from "@/donnees/jeux";
import { COEUR_SAUVAGE_RAYON, COURONNE_ANNEAUX, MONDE_RAYON } from "@/reglages";
import { chainesDeMontagnes, climatDuMonde, eviterLesVoisinagesInterdits } from "./climat";
import { BANDE_DE_CALCUL } from "./couronne";
import { anneau, dansLeCoeur, eloignementDuCoeur, type Coordonnees } from "./hex";
import { cotesDeLaMer, merDuMonde } from "./mer";
import { biomesDesProvinces, fondreLesPetitesRegions, grilleDuMonde, provinces, regionsDuCoeur, type Biome, type Grille, type Variante } from "./regions";

export type CaseGeneree = Coordonnees & { anneau: number; biome: Biome; variante: string | null; couronne: boolean; coeur: boolean; eloignement: number };

/** La plus grande graine : un entier de 0 à 2³² − 1, comme la base l'accepte. */
export const GRAINE_MAX = 2 ** 32 - 1;

/**
 * Le Biome de chaque Case d'un Monde, dans l'ordre de la grille, et la variante de son eau. Le Cœur sauvage
 * mêle ses petites régions (US-0403) ; la mer s'étend loin de lui (US-0408) ; sur la terre, les montagnes
 * dressent leurs chaînes (US-0407) ; tout le reste, Couronne comprise, est fait de provinces qui reçoivent
 * chacune un Biome de terre selon leur climat (US-0406), un côté du Monde froid et l'autre chaud
 * (US-0407). Les voisinages interdits sont ensuite ôtés, puis les petites régions fondues. Enfin, la mer
 * qui touche la terre devient sa côte (US-0409).
 */
function biomesDuMonde(
  grille: Grille,
  { rayon, rayonCoeur, graine, voisinagesInterdits }: { rayon: number; rayonCoeur: number; graine: number; voisinagesInterdits: [string, string][] },
): { biomes: Biome[]; variantes: (Variante | null)[] } {
  const interdites = new Set(voisinagesInterdits.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
  const interdit = (a: Biome, b: Biome) => interdites.has(`${a}|${b}`);
  const coeur = grille.cases.map((c) => dansLeCoeur(c, rayonCoeur));
  const biomes = new Array<Biome>(grille.cases.length);
  const duCoeur = regionsDuCoeur(grille, coeur, graine);
  duCoeur.membres.forEach((membres, k) => membres.forEach((i) => (biomes[i] = duCoeur.biomes[k])));
  const mer = merDuMonde(grille, { rayon, rayonCoeur, graine });
  grille.cases.forEach((_, i) => mer[i] && (biomes[i] = "eau"));
  const montagne = chainesDeMontagnes(grille, (i) => !coeur[i] && !mer[i], graine);
  grille.cases.forEach((_, i) => montagne[i] && (biomes[i] = "montagne"));
  const climat = climatDuMonde(grille, rayon, graine);
  const membres = provinces(grille, (i) => !coeur[i] && !mer[i] && !montagne[i], graine);
  biomesDesProvinces(membres, climat).forEach((biome, p) => membres[p].forEach((i) => (biomes[i] = biome)));
  const unites = [...membres, ...duCoeur.membres];
  eviterLesVoisinagesInterdits(grille, biomes, { unites, duCoeur: (u) => u >= membres.length, climat, interdit });
  fondreLesPetitesRegions(grille, biomes, interdit);
  const cote = cotesDeLaMer(grille, mer);
  const variantes = grille.cases.map((_, i): Variante | null => (cote[i] ? "cote" : mer[i] ? "mer" : null));
  return { biomes, variantes };
}

/**
 * Toutes les Cases d'un Monde de `rayon` anneaux, du Cœur sauvage au bord, rangées par q puis r, avec
 * leur Biome (US-0406 : en régions, Couronne comprise ; US-0407 : sans aucun des voisinages que les
 * données du jeu interdisent, ou que `voisinagesInterdits` interdit) ; les `anneaux` anneaux extérieurs
 * forment la Couronne, et les Cases à moins de `rayonCoeur` Cases du milieu le Cœur sauvage (US-0403),
 * dont chaque Case porte sa distance (US-0405). Rien d'autre que la graine n'y met de hasard : la même
 * graine rend toujours le même Monde.
 */
export function genererLeMonde({
  rayon,
  anneaux,
  rayonCoeur,
  graine,
  voisinagesInterdits = lireVoisinagesInterdits(),
}: {
  rayon: number;
  anneaux: number;
  rayonCoeur: number;
  graine: number;
  voisinagesInterdits?: [string, string][];
}): CaseGeneree[] {
  if (anneaux > BANDE_DE_CALCUL) throw new Error(`Une Couronne ne dépasse pas ${BANDE_DE_CALCUL} anneaux.`);
  const grille = grilleDuMonde(rayon);
  const { biomes, variantes } = biomesDuMonde(grille, { rayon, rayonCoeur, graine, voisinagesInterdits });
  return grille.cases.map((c, i) => ({
    q: c.q,
    r: c.r,
    anneau: anneau(c),
    biome: biomes[i],
    variante: variantes[i],
    couronne: anneau(c) > rayon - anneaux,
    coeur: dansLeCoeur(c, rayonCoeur),
    eloignement: eloignementDuCoeur(c, rayonCoeur),
  }));
}

/** La graine écrite dans `texte`, ou une erreur qui dit ce qu'est une graine. */
export function lireUneGraine(texte: string): number {
  const graine = Number(texte);
  if (!/^\d+$/.test(texte) || graine > GRAINE_MAX) throw new Error(`Une graine est un nombre entier de 0 à ${GRAINE_MAX}, pas « ${texte} ».`);
  return graine;
}

/**
 * Crée un nouveau Monde (US-0401) dans la transaction de l'appelant : sa fiche, avec sa graine et sa
 * taille (US-0403 : celle de son Cœur sauvage comprise), puis toutes ses Cases, par lots. Un nom déjà
 * pris est refusé avant tout : un Monde existant, à commencer par celui du jeu, n'est jamais touché.
 * Rend le nouveau Monde et son nombre de Cases.
 */
export async function creerUnMonde(
  client: PoolClient,
  {
    nom,
    graine,
    rayon = MONDE_RAYON,
    anneaux = COURONNE_ANNEAUX,
    rayonCoeur = COEUR_SAUVAGE_RAYON,
  }: { nom: string; graine: number; rayon?: number; anneaux?: number; rayonCoeur?: number },
): Promise<{ mondeId: number; cases: number }> {
  const { rows } = await client.query<{ id: number }>(
    "insert into monde (nom, graine, rayon, anneaux_couronne, rayon_coeur) values ($1, $2, $3, $4, $5) on conflict (nom) do nothing returning id",
    [nom, graine, rayon, anneaux, rayonCoeur],
  );
  if (!rows[0]) throw new Error(`Le nom « ${nom} » est déjà pris par un autre Monde.`);
  const cases = genererLeMonde({ rayon, anneaux, rayonCoeur, graine });
  const { rowCount } = await client.query(
    `insert into case_du_monde (monde_id, q, r, anneau, couronne, coeur, eloignement, biome_id, variante_id)
     select $1, c.q, c.r, c.anneau, c.couronne, c.coeur, c.eloignement, c.biome, c.variante
     from unnest($2::int[], $3::int[], $4::int[], $5::boolean[], $6::boolean[], $7::int[], $8::text[], $9::text[])
       as c(q, r, anneau, couronne, coeur, eloignement, biome, variante)`,
    [
      rows[0].id,
      cases.map((c) => c.q),
      cases.map((c) => c.r),
      cases.map((c) => c.anneau),
      cases.map((c) => c.couronne),
      cases.map((c) => c.coeur),
      cases.map((c) => c.eloignement),
      cases.map((c) => c.biome),
      cases.map((c) => c.variante),
    ],
  );
  return { mondeId: rows[0].id, cases: rowCount ?? 0 };
}
