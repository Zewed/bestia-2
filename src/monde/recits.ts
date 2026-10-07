// Les Récits d'un Territoire (US-0324) : ce qui lui est arrivé, que le joueur lit après coup. Côté
// serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";

/** Un Récit tel que la page Récits le montre : luLe est null tant que le joueur ne l'a pas ouvert. */
export type Recit = { id: number; titre: string; texte: string; survenuLe: Date; luLe: Date | null };

/** Ce qu'un événement raconte : un titre, le texte, et l'heure du jeu où il est survenu. */
export type NouveauRecit = { titre: string; texte: string; survenuLe: Date };

/**
 * Écrit un Récit pour un Territoire, non lu, et rend son identifiant. Pour les événements qui en
 * produisent (Famine, retours de Récolte ou d'Expédition, Attaques, Incursions) : appelée avec leur
 * client, elle tient dans leur transaction.
 */
export async function ecrireUnRecit(client: Pool | PoolClient, territoireId: number, recit: NouveauRecit): Promise<number> {
  const { rows } = await client.query<{ id: number }>(
    "insert into recit (territoire_id, titre, texte, survenu_le) values ($1, $2, $3, $4) returning id",
    [territoireId, recit.titre, recit.texte, recit.survenuLe],
  );
  return rows[0].id;
}

/** Les Récits d'un Territoire, du plus récent au plus ancien ; deux Récits de la même heure, le dernier écrit d'abord. */
export async function recitsDuTerritoire(base: Pool | PoolClient, territoireId: number): Promise<Recit[]> {
  const { rows } = await base.query<Recit>(
    `select id, titre, texte, survenu_le as "survenuLe", lu_le as "luLe" from recit where territoire_id = $1
     order by survenu_le desc, id desc`,
    [territoireId],
  );
  return rows;
}

/** Le nombre de Récits que le joueur n'a pas encore ouverts, pour l'entrée « Récits » de la navigation. */
export async function nombreDeRecitsNonLus(base: Pool | PoolClient, territoireId: number): Promise<number> {
  const { rows } = await base.query<{ nombre: number }>("select count(*)::int as nombre from recit where territoire_id = $1 and lu_le is null", [
    territoireId,
  ]);
  return rows[0].nombre;
}

/**
 * Note qu'un Récit a été ouvert, une seule fois, et seulement s'il appartient bien au Territoire : rend
 * true s'il vient d'être marqué lu, false s'il l'était déjà ou n'est pas à ce Territoire.
 */
export async function marquerUnRecitLu(base: Pool | PoolClient, territoireId: number, recitId: number, instant: Date): Promise<boolean> {
  const { rowCount } = await base.query("update recit set lu_le = $3 where id = $2 and territoire_id = $1 and lu_le is null", [
    territoireId,
    recitId,
    instant,
  ]);
  return rowCount === 1;
}
