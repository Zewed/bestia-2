// Le Territoire d'un chef tel que le jeu le montre. Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";

/** Le Foyer d'un Territoire (US-0157) : le Biome de sa Case, ou null si le Territoire n'existe pas. */
export async function foyerDuTerritoire(pool: Pool, territoireId: number): Promise<{ biome: { id: string; nom: string } } | null> {
  const { rows } = await pool.query<{ biome: { id: string; nom: string } }>(
    `select json_build_object('id', b.id, 'nom', b.nom) as biome
     from territoire t join case_du_monde c on c.id = t.foyer_case_id join biome b on b.id = c.biome_id
     where t.id = $1`,
    [territoireId],
  );
  return rows[0] ?? null;
}

/**
 * Note le récit d'arrivée comme lu (US-0158) et rend le nom du Monde du Territoire, la première
 * fois seulement ; ensuite, null : le récit ne s'affiche qu'une fois.
 */
export async function marquerRecitLu(pool: Pool, territoireId: number, instant: Date): Promise<{ monde: string } | null> {
  const { rows } = await pool.query<{ monde: string }>(
    `update territoire t set recit_lu_le = $2
     from case_du_monde c join monde m on m.id = c.monde_id
     where t.id = $1 and t.recit_lu_le is null and c.id = t.foyer_case_id
     returning m.nom as monde`,
    [territoireId, instant],
  );
  return rows[0] ?? null;
}

