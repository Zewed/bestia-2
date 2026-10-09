// Les Bêtes d'un Territoire telles que l'écran d'Expédition les propose pour l'escorte. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { forceDUneBete } from "@/expeditions/force";

/**
 * US-0904 : une Espèce de l'effectif, avec son illustration (null : aucune) et ses Bêtes disponibles pour l'escorte.
 * US-0905 : avec la force d'une de ses Bêtes, la même pour toutes. US-0912 : et leur vitesse réelle, en km/h, qui règle
 * l'allure d'une escorte.
 */
export type EspeceDisponible = { id: string; nom: string; illustration: string | null; disponibles: number; force: number; vitesse: number };

/**
 * US-0904 : les Bêtes d'un Couple en Réserve, qui ne sortent jamais : combien l'Espèce en a (expression sur `e`, les
 * lignes de l'effectif regroupées par Territoire et Espèce). Aucun Couple n'est encore réuni : aucune. La Réserve des
 * Couples (jalon 8) écrira ici combien de Bêtes de l'Espèce y vivent, et les disponibles suivront.
 */
const BETES_EN_RESERVE = "0";

/**
 * US-0904 : les Bêtes déjà sorties : combien l'Espèce en a hors du Foyer (expression sur `e`, comme BETES_EN_RESERVE).
 * US-0911 : celles des escortes de ses Expéditions en cours, jusqu'à leur retour. US-0916 : rentrées, elles n'en sont
 * plus.
 */
const BETES_SORTIES = `select coalesce(sum(s.nombre), 0)::int from expedition_escorte s join expedition x on x.id = s.expedition_id
  where x.territoire_id = e.territoire_id and s.espece_id = e.espece_id and x.rentree_le is null`;

/**
 * US-0904 : les Bêtes que le joueur peut emmener en escorte, Espèce par Espèce, lues à chaque affichage de l'écran
 * d'Expédition : l'effectif du Territoire, mâles et femelles ensemble (l'escorte ne choisit pas le sexe), moins les Bêtes
 * d'un Couple en Réserve et les Bêtes déjà sorties. Seules les Espèces qui en ont au moins une, de la plus commune à la
 * plus rare, puis par nom ; aucune pour un Territoire sans Bête. Lire ne retient rien : rien ne change avant le départ.
 * US-0905 : la force d'une Bête vient de l'attaque et de la vie de son Espèce, rien du Territoire : aucune Recherche.
 */
export async function betesDisponibles(base: Pool | PoolClient, territoireId: number): Promise<EspeceDisponible[]> {
  const { rows } = await base.query<Omit<EspeceDisponible, "force"> & { attaque: number; vie: number }>(
    `select es.id, es.nom, es.illustration, x.disponibles, es.attaque, es.vie, es.vitesse
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
  return rows.map(({ attaque, vie, ...espece }) => ({ ...espece, force: forceDUneBete({ attaque, vie }) }));
}
