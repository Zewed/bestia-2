// Le Territoire d'un chef tel que le jeu le montre. Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";

/**
 * Le Foyer d'un Territoire (US-0157) : le Biome de sa Case et le nom de son Monde (pour le récit
 * d'arrivée, US-0158), ou null si le Territoire n'existe pas.
 */
export async function foyerDuTerritoire(pool: Pool, territoireId: number): Promise<{ biome: { id: string; nom: string }; monde: string } | null> {
  const { rows } = await pool.query<{ biome: { id: string; nom: string }; monde: string }>(
    `select json_build_object('id', b.id, 'nom', b.nom) as biome, m.nom as monde
     from territoire t join case_du_monde c on c.id = t.foyer_case_id join biome b on b.id = c.biome_id
     join monde m on m.id = c.monde_id
     where t.id = $1`,
    [territoireId],
  );
  return rows[0] ?? null;
}

/**
 * Note le récit d'arrivée comme lu (US-0158), quand le joueur entre dans son Foyer. Ne le note
 * qu'une fois : rend true la première fois, false ensuite.
 */
export async function marquerRecitLu(pool: Pool, territoireId: number, instant: Date): Promise<boolean> {
  const { rowCount } = await pool.query("update territoire set recit_lu_le = $2 where id = $1 and recit_lu_le is null", [territoireId, instant]);
  return rowCount === 1;
}

