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
