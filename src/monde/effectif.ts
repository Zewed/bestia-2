// Les Bêtes d'un Territoire telles que l'écran d'Expédition les propose pour l'escorte. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";

/** US-0904 : une Espèce de l'effectif, avec son illustration (null : aucune) et ses Bêtes disponibles pour l'escorte. */
export type EspeceDisponible = { id: string; nom: string; illustration: string | null; disponibles: number };

/**
 * US-0904 : les Bêtes d'un Couple en Réserve, qui ne sortent jamais : combien l'Espèce en a (expression sur `e`, les
 * lignes de l'effectif regroupées par Territoire et Espèce). Aucun Couple n'est encore réuni : aucune. La Réserve des
 * Couples (jalon 8) écrira ici combien de Bêtes de l'Espèce y vivent, et les disponibles suivront.
 */
const BETES_EN_RESERVE = "0";

/**
 * US-0904 : les Bêtes déjà sorties : combien l'Espèce en a hors du Foyer (expression sur `e`, comme BETES_EN_RESERVE).
 * Aucune Expédition ne part encore : aucune. US-0911 écrira ici combien de Bêtes de l'Espèce sont parties.
 */
const BETES_SORTIES = "0";

/**
 * US-0904 : les Bêtes que le joueur peut emmener en escorte, Espèce par Espèce, lues à chaque affichage de l'écran
 * d'Expédition : l'effectif du Territoire, mâles et femelles ensemble (l'escorte ne choisit pas le sexe), moins les Bêtes
 * d'un Couple en Réserve et les Bêtes déjà sorties. Seules les Espèces qui en ont au moins une, de la plus commune à la
 * plus rare, puis par nom ; aucune pour un Territoire sans Bête. Lire ne retient rien : rien ne change avant le départ.
 */
export async function betesDisponibles(base: Pool | PoolClient, territoireId: number): Promise<EspeceDisponible[]> {
  const { rows } = await base.query<EspeceDisponible>(
    `select es.id, es.nom, es.illustration, x.disponibles
     from (
       select e.espece_id, sum(e.nombre)::int - (${BETES_EN_RESERVE}) - (${BETES_SORTIES}) as disponibles
       from effectif e
       where e.territoire_id = $1
       group by e.territoire_id, e.espece_id
     ) x
     join espece es on es.id = x.espece_id
     join rarete r on r.id = es.rarete_id
     where x.disponibles > 0
     order by r.rang, es.nom`,
    [territoireId],
  );
  return rows;
}
