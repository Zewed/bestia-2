// Les Stocks d'un Territoire (US-0201), tels qu'ils sont en base.
import "server-only";
import type { Pool, PoolClient } from "pg";

/** Le Stock d'une Ressource, avec sa famille (US-0205) et sa quantité exacte, fractions comprises, en texte (numeric de Postgres). */
export type Stock = { id: string; nom: string; famille: "nourriture" | "materiaux"; quantite: string };

/** Les quatre Stocks du Territoire, dans l'ordre des Ressources : Viande, Végétaux, Bois, Pierre. */
export async function stocksDuTerritoire(base: Pool | PoolClient, territoireId: number): Promise<Stock[]> {
  const { rows } = await base.query<Stock>(
    `select r.id, r.nom, r.famille, s.quantite from stock s join ressource r on r.id = s.ressource_id
     where s.territoire_id = $1 order by r.ordre`,
    [territoireId],
  );
  return rows;
}
