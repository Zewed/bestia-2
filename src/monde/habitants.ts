// Les Habitants d'un Territoire tels que le jeu les montre. Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";

/**
 * Ce que fait un Habitant (US-0303). À ce stade, il est toujours libre : au Foyer et disponible.
 * Les Expéditions, les Élevages, les Récoltes et les chantiers en ajouteront d'autres.
 */
export type EtatHabitant = "libre";

/** Un Habitant (US-0301) : son prénom (US-0303), son Métier, null tant qu'il n'en a pas, son heure d'arrivée et son état. */
export type Habitant = { id: number; prenom: string; metier: string | null; arriveLe: Date; etat: EtatHabitant };

/** Les Habitants d'un Territoire, rangés par Métier, ceux sans Métier en premier, puis par prénom (US-0303). */
export async function habitantsDuTerritoire(pool: Pool, territoireId: number): Promise<Habitant[]> {
  const { rows } = await pool.query<Omit<Habitant, "etat">>(
    `select id, prenom, metier, arrive_le as "arriveLe" from habitant where territoire_id = $1
     order by metier nulls first, prenom, id`,
    [territoireId],
  );
  return rows.map((h) => ({ ...h, etat: "libre" }));
}
