// US-0412 : les Mondes en base, pour la page de contrôle du Monde. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import type { CaseDeCarte } from "./bilan";

export type MondeEnBase = { id: number; nom: string; graine: number | null; cases: number };

/** Les Mondes en base, du plus ancien au plus récent, chacun avec sa graine et son nombre de Cases. */
export async function mondesEnBase(base: Pool | PoolClient): Promise<MondeEnBase[]> {
  const { rows } = await base.query<MondeEnBase>(
    `select m.id, m.nom, m.graine::float8 as graine, (select count(*)::int from case_du_monde c where c.monde_id = m.id) as cases
     from monde m order by m.id`,
  );
  return rows;
}

/**
 * Un Monde en base et ses Cases enregistrées, rangées par q puis r, ou null s'il n'existe pas. Chaque Case
 * dit si un chef la possède et si elle porte un Foyer.
 */
export async function mondeEnBase(base: Pool | PoolClient, id: number): Promise<{ nom: string; graine: number | null; cases: CaseDeCarte[] } | null> {
  const { rows: mondes } = await base.query<{ nom: string; graine: number | null }>("select nom, graine::float8 as graine from monde where id = $1", [id]);
  if (!mondes[0]) return null;
  const { rows } = await base.query<CaseDeCarte>(
    `select c.q, c.r, c.anneau, c.couronne, c.coeur, c.biome_id as biome, c.variante_id as variante,
       c.chef_id is not null as possedee, t.id is not null as foyer
     from case_du_monde c left join territoire t on t.foyer_case_id = c.id
     where c.monde_id = $1 order by c.q, c.r`,
    [id],
  );
  return { ...mondes[0], cases: rows };
}
