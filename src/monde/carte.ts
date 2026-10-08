// La carte du Monde, telle que le joueur la voit (US-0417). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { BROUILLARD } from "./couleurs-de-la-carte";
import type { Coordonnees } from "./hex";
import { ZONE_COEUR, ZONE_COURONNE } from "./zones";

/**
 * La carte d'un joueur : le nom de son Monde, la Case de son Foyer, celles des Foyers des autres chefs (US-0419),
 * les teintes de la carte (US-0418 : chaque Biome de terre, et chaque eau par sa variante), et les Cases du Monde.
 * En colonnes, pour un envoi léger au navigateur (10 981 Cases pour un Monde généré) : la Case i est en
 * (q[i], r[i]), de teinte teintes[teinte[i]], et de la zone zone[i] (US-0433 : ZONE_COURONNE, ZONE_COEUR ou 0,
 * src/monde/zones.ts).
 */
export type CarteDuJoueur = {
  monde: string;
  foyer: Coordonnees;
  foyers: Coordonnees[];
  teintes: string[];
  cases: { q: number[]; r: number[]; teinte: number[]; zone: number[] };
};

/**
 * US-0417 : la carte du Monde où se trouve le Foyer du Territoire, en une seule lecture, ou null si le Territoire
 * n'existe pas. Toutes ses Cases, rangées par q puis r. Sur Aube, qui n'a en base que sa Couronne, c'est la
 * Couronne. US-0418 : chaque Case avec sa teinte, son Biome ou, pour l'eau, sa variante (côte, lac, rivière, mer),
 * comme sur la page de contrôle du Monde. US-0419 : avec les Foyers des autres chefs du Monde, rangés par q puis r,
 * pour ne pas les confondre avec le sien. US-0433 : la zone de chaque Case, pour dessiner les limites de la Couronne
 * et du Cœur sauvage. US-0437 : une Case que le Territoire n'a pas découverte (src/monde/brouillard.ts) a pour teinte
 * le brouillard (BROUILLARD), sans rien de son Biome : la liste des teintes n'a que celles des Cases découvertes.
 * US-0439 : rien d'autre d'elle ne part au navigateur que sa place : ni sa zone (0), ni le Foyer d'un autre chef.
 */
export async function carteDuJoueur(base: Pool | PoolClient, territoireId: number): Promise<CarteDuJoueur | null> {
  const { rows } = await base.query<{ monde: string; foyer: Coordonnees; foyers: Coordonnees[]; q: number[]; r: number[]; teinte: string[]; zone: number[] }>(
    `select m.nom as monde, json_build_object('q', f.q, 'r', f.r) as foyer,
       coalesce(json_agg(json_build_object('q', c.q, 'r', c.r) order by c.q, c.r) filter (where autre.id is not null and d.case_id is not null), '[]')
         as foyers,
       array_agg(c.q order by c.q, c.r) as q, array_agg(c.r order by c.q, c.r) as r,
       array_agg(case when d.case_id is null then $2::text when c.biome_id = 'eau' and c.variante_id is not null then c.variante_id else c.biome_id end
         order by c.q, c.r) as teinte,
       array_agg(case when d.case_id is null then 0 when c.couronne then ${ZONE_COURONNE} when c.coeur then ${ZONE_COEUR} else 0 end order by c.q, c.r)
         as zone
     from territoire t join case_du_monde f on f.id = t.foyer_case_id join monde m on m.id = f.monde_id
       join case_du_monde c on c.monde_id = f.monde_id
       left join case_decouverte d on d.territoire_id = t.id and d.case_id = c.id
       left join territoire autre on autre.foyer_case_id = c.id and autre.id <> t.id
     where t.id = $1
     group by m.nom, f.q, f.r`,
    [territoireId, BROUILLARD],
  );
  if (!rows[0]) return null;
  const { monde, foyer, foyers, q, r, teinte, zone } = rows[0];
  const teintes = [...new Set(teinte)];
  const indices = new Map(teintes.map((t, i) => [t, i]));
  return { monde, foyer, foyers, teintes, cases: { q, r, teinte: teinte.map((t) => indices.get(t)!), zone } };
}
