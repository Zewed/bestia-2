// Les Habitants d'un Territoire tels que le jeu les montre. Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";
import { PLACES_DU_FOYER } from "@/reglages";

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

/** Le nombre d'Habitants d'un Territoire, pour le compteur de la barre du haut (US-0304). */
export async function nombreDHabitants(pool: Pool, territoireId: number): Promise<number> {
  const { rows } = await pool.query<{ nombre: number }>(`select count(*)::int as nombre from habitant where territoire_id = $1`, [territoireId]);
  return rows[0].nombre;
}

/**
 * US-0305 : chaque source de place du Territoire $1, une ligne par source, avec les places qu'elle offre.
 * Pour l'instant, le seul Foyer ; les huttes s'y ajouteront à l'étape 25, d'un « union all » de plus.
 */
const SOURCES_DE_PLACE = `
  select ${PLACES_DU_FOYER} as places from territoire where id = $1`;

/** US-0305 : la place totale du Territoire, en Habitants : la somme de toutes ses sources ; 0 s'il n'existe pas. */
export async function placesDuTerritoire(pool: Pool, territoireId: number): Promise<number> {
  const { rows } = await pool.query<{ places: number }>(`select coalesce(sum(places), 0)::int as places from (${SOURCES_DE_PLACE}) source`, [territoireId]);
  return rows[0].places;
}
