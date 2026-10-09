// Les explorateurs d'un Territoire tels que l'écran d'Expédition les propose. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";

/** US-0902 : les explorateurs du Territoire : ceux qui ne sont pas déjà partis, et tous. */
export type Explorateurs = { libres: number; total: number };

/**
 * US-0902 : un explorateur libre, qui n'est pas déjà parti (condition sur `h`, l'Habitant). Aucune Expédition ne
 * part encore : tous le sont. US-0911 écrira ici ce qui fait un explorateur parti, et le compteur suivra.
 */
const EXPLORATEUR_LIBRE = "true";

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
