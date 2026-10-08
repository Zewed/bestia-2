// Le brouillard (US-0436, US-0440) : ce que chaque Territoire a découvert du Monde, enregistré à part, une ligne par
// Case découverte (table case_decouverte) ; toute autre Case est pour lui sous le brouillard. Côté serveur et scripts
// uniquement (la bascule d'un Monde s'en sert).
import type { Pool, PoolClient } from "pg";
import { ABORDS_DU_FOYER_CASES } from "@/reglages";
import { type Coordonnees, distance } from "./hex";

/**
 * US-0436 : les abords d'un Foyer, ce qu'un Territoire découvre en naissant : les Cases à `rayon` Cases de lui ou
 * moins (ABORDS_DU_FOYER_CASES), lui compris, comptées par distance, la seule mesure des distances du jeu (la
 * migration 0045 en est le miroir, pour les Territoires déjà nés). Certaines peuvent manquer au Monde, au bord, ou
 * sur Aube, qui n'a en base que sa Couronne : decouvrir les passe.
 */
export function abordsDuFoyer(foyer: Coordonnees, rayon: number = ABORDS_DU_FOYER_CASES): Coordonnees[] {
  const abords: Coordonnees[] = [];
  for (let q = foyer.q - rayon; q <= foyer.q + rayon; q++) {
    for (let r = foyer.r - rayon; r <= foyer.r + rayon; r++) {
      if (distance({ q, r }, foyer) <= rayon) abords.push({ q: q + 0, r: r + 0 }); // + 0 : jamais de « -0 »
    }
  }
  return abords;
}

/**
 * US-0436 : le Territoire $1 découvre les Cases de coordonnées ($2[i], $3[i]) de son Monde, celui de son Foyer ; une
 * Case hors du Monde est passée. Dans l'ordre des Cases : deux découvertes en même temps attendent l'une l'autre
 * sans jamais se bloquer. Une Case déjà découverte ne change pas.
 */
const DECOUVRIR = `
  insert into case_decouverte (territoire_id, case_id)
  select t.id, c.id
  from territoire t
  join case_du_monde f on f.id = t.foyer_case_id
  join unnest($2::int[], $3::int[]) as v(q, r) on true
  join case_du_monde c on c.monde_id = f.monde_id and c.q = v.q and c.r = v.r
  where t.id = $1
  order by c.id
  on conflict do nothing`;

/**
 * US-0436 : le Territoire découvre les Cases `cases` de son Monde. C'est la seule façon de découvrir des Cases : sa
 * naissance (src/chefs/chef.ts) et la bascule d'un Monde s'en servent pour les abords de son Foyer, les Expéditions
 * et les Avant-postes s'en serviront (US-0442). US-0441 : une Case déjà découverte le reste, sans que rien ne change :
 * découvrir deux fois, même en même temps, ne fait rien de plus ; et rien dans le jeu n'efface une ligne du brouillard,
 * qui ne part qu'avec son Territoire. Rend le nombre de Cases tout juste découvertes. Appelée avec le client d'une
 * transaction, elle tient dedans.
 */
export async function decouvrir(base: Pool | PoolClient, territoireId: number, cases: Coordonnees[]): Promise<number> {
  const { rowCount } = await base.query(DECOUVRIR, [territoireId, cases.map((c) => c.q), cases.map((c) => c.r)]);
  return rowCount ?? 0;
}

/**
 * US-0441 : une Case découverte telle que le joueur la voit : sa place, son Biome et le nom du chef qui la possède
 * (null : libre), lus au moment même dans le Monde ; le brouillard n'en garde rien.
 */
export type CaseDecouverte = Coordonnees & { biome: string; proprietaire: string | null };

/**
 * US-0436 : les Cases que le Territoire a découvertes dans son Monde, celui de son Foyer, rangées par q puis r comme
 * sur la carte ; toutes les autres sont pour lui sous le brouillard. [] pour un Territoire inconnu. US-0441 : chacune
 * avec son Biome et son propriétaire du moment, à jour même si le joueur n'y est jamais retourné.
 */
export async function casesDecouvertes(base: Pool | PoolClient, territoireId: number): Promise<CaseDecouverte[]> {
  const { rows } = await base.query<CaseDecouverte>(
    `select c.q, c.r, c.biome_id as biome, p.nom as proprietaire from territoire t
     join case_du_monde f on f.id = t.foyer_case_id
     join case_decouverte d on d.territoire_id = t.id
     join case_du_monde c on c.id = d.case_id and c.monde_id = f.monde_id
     left join chef p on p.id = c.chef_id
     where t.id = $1
     order by c.q, c.r`,
    [territoireId],
  );
  return rows;
}
