// Générer un Monde entier à partir d'une graine (US-0401), pour pouvoir le recréer à l'identique.
// Côté serveur et scripts uniquement.
import type { PoolClient } from "pg";
import { COURONNE_ANNEAUX, MONDE_RAYON } from "@/reglages";
import { BANDE_DE_CALCUL, biomesDuMonde, type CaseDeCouronne } from "./couronne";

export type CaseGeneree = CaseDeCouronne & { couronne: boolean };

/** La plus grande graine : un entier de 0 à 2³² − 1, comme la base l'accepte. */
export const GRAINE_MAX = 2 ** 32 - 1;

/**
 * Toutes les Cases d'un Monde de `rayon` anneaux, du Cœur sauvage au bord, avec leur Biome ; les
 * `anneaux` anneaux extérieurs forment la Couronne, la même que casesDeLaCouronne pour la même
 * graine. Rien d'autre que la graine n'y met de hasard : la même graine rend toujours le même Monde.
 */
export function genererLeMonde({ rayon, anneaux, graine }: { rayon: number; anneaux: number; graine: number }): CaseGeneree[] {
  if (anneaux > BANDE_DE_CALCUL) throw new Error(`Une Couronne ne dépasse pas ${BANDE_DE_CALCUL} anneaux.`);
  return biomesDuMonde({ rayon, graine }).map((c) => ({ ...c, couronne: c.anneau > rayon - anneaux }));
}

/** La graine écrite dans `texte`, ou une erreur qui dit ce qu'est une graine. */
export function lireUneGraine(texte: string): number {
  const graine = Number(texte);
  if (!/^\d+$/.test(texte) || graine > GRAINE_MAX) throw new Error(`Une graine est un nombre entier de 0 à ${GRAINE_MAX}, pas « ${texte} ».`);
  return graine;
}

/**
 * Crée un nouveau Monde (US-0401) dans la transaction de l'appelant : sa fiche, avec sa graine et sa
 * taille, puis toutes ses Cases, par lots. Un nom déjà pris est refusé avant tout : un Monde existant,
 * à commencer par celui du jeu, n'est jamais touché. Rend le nouveau Monde et son nombre de Cases.
 */
export async function creerUnMonde(
  client: PoolClient,
  { nom, graine, rayon = MONDE_RAYON, anneaux = COURONNE_ANNEAUX }: { nom: string; graine: number; rayon?: number; anneaux?: number },
): Promise<{ mondeId: number; cases: number }> {
  const { rows } = await client.query<{ id: number }>(
    "insert into monde (nom, graine, rayon, anneaux_couronne) values ($1, $2, $3, $4) on conflict (nom) do nothing returning id",
    [nom, graine, rayon, anneaux],
  );
  if (!rows[0]) throw new Error(`Le nom « ${nom} » est déjà pris par un autre Monde.`);
  const cases = genererLeMonde({ rayon, anneaux, graine });
  const { rowCount } = await client.query(
    `insert into case_du_monde (monde_id, q, r, anneau, couronne, biome_id, variante_id)
     select $1, c.q, c.r, c.anneau, c.couronne, c.biome, c.variante
     from unnest($2::int[], $3::int[], $4::int[], $5::boolean[], $6::text[], $7::text[]) as c(q, r, anneau, couronne, biome, variante)`,
    [
      rows[0].id,
      cases.map((c) => c.q),
      cases.map((c) => c.r),
      cases.map((c) => c.anneau),
      cases.map((c) => c.couronne),
      cases.map((c) => c.biome),
      cases.map((c) => c.variante),
    ],
  );
  return { mondeId: rows[0].id, cases: rowCount ?? 0 };
}
