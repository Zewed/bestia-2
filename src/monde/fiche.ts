// La fiche d'une Case du Monde, telle que le joueur la voit (US-0428). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import type { Coordonnees } from "./hex";

/**
 * La fiche d'une Case : où elle est, son Biome (une eau par sa variante, « Lac », comme la légende), et le chef à
 * qui elle appartient (null si elle est libre), avec `aVous` quand c'est le joueur lui-même.
 */
export type Fiche = Coordonnees & { biome: string; chef: string | null; aVous: boolean };

/**
 * US-0428 : la fiche de la Case `c` du Monde où se trouve le Foyer du Territoire, en une seule lecture, ou null si ce
 * Monde n'a pas cette Case (ou si le Territoire n'existe pas). Le Monde se lit depuis le Territoire, jamais depuis
 * ce que le navigateur envoie : le brouillard (US-0439) devra y répondre « Case inconnue ».
 */
export async function ficheDUneCase(base: Pool | PoolClient, territoireId: number, c: Coordonnees): Promise<Fiche | null> {
  const { rows } = await base.query<Fiche>(
    `select c.q, c.r, coalesce(v.nom, b.nom) as biome, ch.nom as chef, coalesce(ch.id = t.chef_id, false) as "aVous"
     from territoire t join case_du_monde f on f.id = t.foyer_case_id
       join case_du_monde c on c.monde_id = f.monde_id and c.q = $2 and c.r = $3
       join biome b on b.id = c.biome_id left join variante_biome v on v.id = c.variante_id
       left join chef ch on ch.id = c.chef_id
     where t.id = $1`,
    [territoireId, c.q, c.r],
  );
  return rows[0] ?? null;
}
