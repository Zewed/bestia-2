// La Famine d'un Territoire (US-0325) : le manque de Nourriture pour payer l'Entretien. Le mécanisme du temps la
// tient à jour (PRODUIRE, src/monde/production.ts). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";

/**
 * US-0325 : depuis combien d'heures de jeu le Territoire est en Famine, à l'instant jusqu'où il est calculé, celui de
 * ses Stocks ; null hors Famine.
 */
export async function famineDepuis(base: Pool | PoolClient, territoireId: number): Promise<number | null> {
  const { rows } = await base.query<{ heures: string | null }>(
    "select extract(epoch from calcule_jusqu_a - famine_depuis) / 3600 as heures from territoire where id = $1",
    [territoireId],
  );
  return rows[0]?.heures == null ? null : Number(rows[0].heures);
}
