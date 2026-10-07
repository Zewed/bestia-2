// Les Métiers des Habitants tels que le jeu les montre. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";

/** US-0307 : un Métier, sa phrase, et ce qu'il attend pour servir (null quand il sert). */
export type Metier = { id: string; nom: string; phrase: string; servira: string | null };

/** US-0307 : l'icône d'un Métier, rangée sous le nom de son identifiant. */
export const iconeDeMetier = (id: string) => `/illustrations/metiers/${id}.webp`;

/** US-0307 : les Métiers, lus en base dans l'ordre de donnees/metiers.yaml. */
export async function lesMetiers(base: Pool | PoolClient): Promise<Metier[]> {
  const { rows } = await base.query<Metier>(`select id, nom, phrase, servira from metier order by ordre`);
  return rows;
}
