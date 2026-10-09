// Les explorateurs d'un Territoire tels que l'écran d'Expédition les propose. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";

/** US-0902 : les explorateurs du Territoire : ceux qui ne sont pas déjà partis, et tous. */
export type Explorateurs = { libres: number; total: number };

/**
 * US-0902 : un explorateur libre, qui n'est pas déjà parti (condition sur `h`, l'Habitant). US-0911 : un explorateur
 * parti porte son Expédition jusqu'à son retour.
 */
const EXPLORATEUR_LIBRE = "h.expedition_id is null";

/**
 * US-0902 : les Habitants au Métier d'explorateur du Territoire, lus à chaque affichage de l'écran d'Expédition :
 * combien sont libres, sur combien. Zéro sur zéro sans aucun explorateur.
 */
export async function explorateursDuTerritoire(base: Pool | PoolClient, territoireId: number): Promise<Explorateurs> {
  const { rows } = await base.query<Explorateurs>(
    `select (count(*) filter (where ${EXPLORATEUR_LIBRE}))::int as libres, count(*)::int as total
     from habitant h
     where h.territoire_id = $1 and h.metier = 'explorateur'`,
    [territoireId],
  );
  return rows[0];
}

/**
 * US-0903 : l'heure à laquelle rentre un explorateur parti (expression sur `h`, l'Habitant). US-0911 : celle du retour
 * de son Expédition : son départ, l'aller, le séjour, qui ne commence qu'à l'arrivée (US-0906), puis le retour, qui dure
 * autant que l'aller (US-0912) ; aucune tant que le trajet d'une escorte n'est pas chiffré.
 */
const RETOUR_DE_L_EXPLORATEUR = `(select x.part_le + make_interval(mins => 2 * x.trajet_minutes + x.sejour_minutes) from expedition x where x.id = h.expedition_id)`;

/**
 * US-0903 : le prochain retour d'un explorateur parti du Territoire, quand aucun n'est libre ; null si aucun n'est
 * parti.
 */
export async function prochainRetourDUnExplorateur(base: Pool | PoolClient, territoireId: number): Promise<Date | null> {
  const { rows } = await base.query<{ retour: Date | null }>(
    `select min(${RETOUR_DE_L_EXPLORATEUR}) as retour
     from habitant h
     where h.territoire_id = $1 and h.metier = 'explorateur' and (${EXPLORATEUR_LIBRE}) is not true`,
    [territoireId],
  );
  return rows[0].retour;
}
