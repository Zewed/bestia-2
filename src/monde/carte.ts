// La carte du Monde, telle que le joueur la voit (US-0417). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import type { Coordonnees } from "./hex";

/**
 * La carte d'un joueur : le nom de son Monde, la Case de son Foyer, les teintes de la carte (US-0418 : chaque
 * Biome de terre, et chaque eau par sa variante), et les Cases du Monde. En colonnes, pour un envoi léger au
 * navigateur (10 981 Cases pour un Monde généré) : la Case i est en (q[i], r[i]), de teinte teintes[teinte[i]].
 */
export type CarteDuJoueur = {
  monde: string;
  foyer: Coordonnees;
  teintes: string[];
  cases: { q: number[]; r: number[]; teinte: number[] };
};

/**
 * US-0417 : la carte du Monde où se trouve le Foyer du Territoire, en une seule lecture, ou null si le Territoire
 * n'existe pas. Toutes ses Cases pour l'instant, rangées par q puis r : le brouillard viendra avec l'étape 20. Sur
 * Aube, qui n'a en base que sa Couronne, c'est la Couronne. US-0418 : chaque Case avec sa teinte, son Biome ou,
 * pour l'eau, sa variante (côte, lac, rivière, mer), comme sur la page de contrôle du Monde.
 */
export async function carteDuJoueur(base: Pool | PoolClient, territoireId: number): Promise<CarteDuJoueur | null> {
  const { rows } = await base.query<{ monde: string; foyer: Coordonnees; q: number[]; r: number[]; teinte: string[] }>(
    `select m.nom as monde, json_build_object('q', f.q, 'r', f.r) as foyer,
       array_agg(c.q order by c.q, c.r) as q, array_agg(c.r order by c.q, c.r) as r,
       array_agg(case when c.biome_id = 'eau' and c.variante_id is not null then c.variante_id else c.biome_id end order by c.q, c.r) as teinte
     from territoire t join case_du_monde f on f.id = t.foyer_case_id join monde m on m.id = f.monde_id
       join case_du_monde c on c.monde_id = f.monde_id
     where t.id = $1
     group by m.nom, f.q, f.r`,
    [territoireId],
  );
  if (!rows[0]) return null;
  const { monde, foyer, q, r, teinte } = rows[0];
  const teintes = [...new Set(teinte)];
  const indices = new Map(teintes.map((t, i) => [t, i]));
  return { monde, foyer, teintes, cases: { q, r, teinte: teinte.map((t) => indices.get(t)!) } };
}
