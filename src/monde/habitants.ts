// Les Habitants d'un Territoire tels que le jeu les montre. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { DatabaseError } from "pg";
import { ENTRETIEN_HABITANT_PAR_HEURE, PLACES_DU_FOYER } from "@/reglages";
import { ENTRETIEN_DU_TERRITOIRE } from "./production";

/**
 * Ce que fait un Habitant (US-0303). À ce stade, il est toujours libre : au Foyer et disponible.
 * Les Expéditions, les Élevages, les Récoltes et les chantiers en ajouteront d'autres.
 */
export type EtatHabitant = "libre";

/**
 * Un Habitant (US-0301) : son prénom (US-0303), le nom de son Métier (« Bûcheron », US-0308), null tant
 * qu'il n'en a pas, son heure d'arrivée et son état.
 */
export type Habitant = { id: number; prenom: string; metier: string | null; arriveLe: Date; etat: EtatHabitant };

/**
 * Les Habitants d'un Territoire, rangés par Métier, ceux sans Métier en premier, puis par prénom (US-0303).
 * US-0308 : les Métiers dans leur ordre de donnees/metiers.yaml, chacun sous son nom.
 */
export async function habitantsDuTerritoire(pool: Pool, territoireId: number): Promise<Habitant[]> {
  const { rows } = await pool.query<Omit<Habitant, "etat">>(
    `select h.id, h.prenom, m.nom as metier, h.arrive_le as "arriveLe"
     from habitant h left join metier m on m.id = h.metier
     where h.territoire_id = $1
     order by m.ordre nulls first, h.prenom, h.id`,
    [territoireId],
  );
  return rows.map((h) => ({ ...h, etat: "libre" }));
}

/**
 * US-0308 : donne le Métier `metierId` à l'Habitant `habitantId` du Territoire, s'il n'en a pas encore.
 * Gratuit et immédiat : aucune Ressource n'est touchée. Rend false sans rien changer pour un Habitant
 * d'un autre Territoire, un Habitant qui a déjà un Métier (le changer, c'est US-0310), ou un Métier
 * inconnu, que la clé étrangère vers `metier` refuse.
 */
export async function enregistrerLeMetier(base: Pool | PoolClient, territoireId: number, habitantId: number, metierId: string): Promise<boolean> {
  try {
    const { rowCount } = await base.query("update habitant set metier = $3 where id = $2 and territoire_id = $1 and metier is null", [
      territoireId,
      habitantId,
      metierId,
    ]);
    return rowCount === 1;
  } catch (refus) {
    if (refus instanceof DatabaseError && refus.code === "23503") return false;
    throw refus;
  }
}

/**
 * US-0334 : un nouvel Habitant au Territoire, sans Métier, du prénom donné, arrivé à `arriveLe`, l'heure du
 * jeu ; rend son identifiant. Il compte aussitôt dans le nombre d'Habitants et dans l'Entretien. Appelée avec
 * le client d'une transaction, elle tient dedans.
 */
export async function ajouterUnHabitant(base: Pool | PoolClient, territoireId: number, prenom: string, arriveLe: Date): Promise<number> {
  const { rows } = await base.query<{ id: number }>("insert into habitant (territoire_id, prenom, arrive_le) values ($1, $2, $3) returning id", [
    territoireId,
    prenom,
    arriveLe,
  ]);
  return rows[0].id;
}

/** Le nombre d'Habitants d'un Territoire, pour le compteur de la barre du haut (US-0304). */
export async function nombreDHabitants(pool: Pool, territoireId: number): Promise<number> {
  const { rows } = await pool.query<{ nombre: number }>(`select count(*)::int as nombre from habitant where territoire_id = $1`, [territoireId]);
  return rows[0].nombre;
}

/** US-0313 : le nombre d'Habitants sans Métier d'un Territoire, pour le repère de l'entrée « Habitants » de la navigation. */
export async function nombreSansMetier(pool: Pool, territoireId: number): Promise<number> {
  const { rows } = await pool.query<{ nombre: number }>(`select count(*)::int as nombre from habitant where territoire_id = $1 and metier is null`, [territoireId]);
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

/**
 * US-0318 : l'Entretien des Habitants tel que la page le détaille : leur nombre, l'Entretien de chacun
 * et le total, en Nourriture par heure (numeric de Postgres, en texte).
 */
export type EntretienDesHabitants = { habitants: number; parHabitant: number; parHeure: string };

/**
 * US-0318 : l'Entretien des Habitants du Territoire, lu à chaque affichage. Le total vient de
 * ENTRETIEN_DU_TERRITOIRE, la requête même d'où le calcul du jeu le prélève (US-0316) : la page montre
 * exactement ce que le calcul prend.
 */
export async function entretienDesHabitants(pool: Pool, territoireId: number): Promise<EntretienDesHabitants> {
  const { rows } = await pool.query<{ habitants: number; parHeure: string }>(
    `select (select count(*)::int from habitant where territoire_id = $1) as habitants, entretien.par_heure::text as "parHeure"
     from (${ENTRETIEN_DU_TERRITOIRE}) entretien`,
    [territoireId],
  );
  return { habitants: rows[0].habitants, parHabitant: ENTRETIEN_HABITANT_PAR_HEURE, parHeure: rows[0].parHeure };
}
