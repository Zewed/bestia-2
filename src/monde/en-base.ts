// Le Monde tel qu'il est en base, pour la page de contrôle. Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";
import { MONDE_DU_JEU } from "./bascule";

export type CouronneEnBase = { monde: string; cases: { q: number; r: number; biome: string; chef: string | null; foyer: boolean }[] };

/** La Couronne du Monde du jeu (US-0151 ; US-0414 : le Monde ouvert), ou null s'il n'y a pas encore de Monde. */
export async function couronneEnBase(pool: Pool): Promise<CouronneEnBase | null> {
  const { rows: mondes } = await pool.query<{ id: number; nom: string }>(`select id, nom from monde where id = ${MONDE_DU_JEU}`);
  if (!mondes[0]) return null;
  const { rows } = await pool.query<{ q: number; r: number; biome: string; chef: string | null; foyer: boolean }>(
    `select c.q, c.r, c.biome_id as biome, ch.nom as chef, t.id is not null as foyer
     from case_du_monde c left join chef ch on ch.id = c.chef_id left join territoire t on t.foyer_case_id = c.id
     where c.monde_id = $1 and c.couronne order by c.anneau, c.q, c.r`,
    [mondes[0].id],
  );
  return { monde: mondes[0].nom, cases: rows };
}

/** US-0156 : combien de Territoires le temps fait vivre, et le marque-page le plus en retard. */
export async function territoiresSuivis(pool: Pool): Promise<{ nombre: number; plusAncien: Date | null }> {
  const { rows } = await pool.query<{ nombre: number; plusAncien: Date | null }>(
    `select count(*)::int as nombre, min(calcule_jusqu_a) as "plusAncien" from territoire`,
  );
  return rows[0];
}

