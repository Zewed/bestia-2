// Le Monde tel qu'il est en base, pour la page de contrôle. Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";

export type CouronneEnBase = { monde: string; cases: { q: number; r: number; biome: string }[] };

/** La Couronne du Monde du jeu (US-0151), ou null s'il n'y a pas encore de Monde. */
export async function couronneEnBase(pool: Pool): Promise<CouronneEnBase | null> {
  const { rows: mondes } = await pool.query<{ id: number; nom: string }>("select id, nom from monde order by id limit 1");
  if (!mondes[0]) return null;
  const { rows } = await pool.query<{ q: number; r: number; biome: string }>(
    "select q, r, biome_id as biome from case_du_monde where monde_id = $1 and couronne order by anneau, q, r",
    [mondes[0].id],
  );
  return { monde: mondes[0].nom, cases: rows };
}
