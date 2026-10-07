// Les Habitants d'un Territoire tels que le jeu les montre. Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";

/** Un Habitant (US-0301) : son Métier, null tant qu'il n'en a pas, et son heure d'arrivée. */
export type Habitant = { id: number; metier: string | null; arriveLe: Date };

/** Les Habitants d'un Territoire, du premier arrivé au dernier (US-0302). */
export async function habitantsDuTerritoire(pool: Pool, territoireId: number): Promise<Habitant[]> {
  const { rows } = await pool.query<Habitant>(
    `select id, metier, arrive_le as "arriveLe" from habitant where territoire_id = $1 order by id`,
    [territoireId],
  );
  return rows;
}
