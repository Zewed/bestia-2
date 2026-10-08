// La fiche d'une Case du Monde, telle que le joueur la voit (US-0428). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { type Coordonnees, distance } from "./hex";
import { ZONE_COEUR, ZONE_COURONNE } from "./zones";

/**
 * La fiche d'une Case : où elle est, son Biome (une eau par sa variante, « Lac », comme la légende), et le chef à
 * qui elle appartient (null si elle est libre), avec `aVous` quand c'est le joueur lui-même. US-0429 : sa zone
 * (ZONE_COURONNE, ZONE_COEUR ou 0, src/monde/zones.ts) et sa distance au Foyer du joueur, en Cases.
 */
export type Fiche = Coordonnees & { biome: string; chef: string | null; aVous: boolean; zone: number; distance: number };

/** US-0438 : la fiche d'une Case sous le brouillard du joueur : sa place et sa distance à son Foyer, rien de plus. */
export type FicheInconnue = Coordonnees & { inconnue: true; distance: number };

/**
 * US-0428 : la fiche de la Case `c` du Monde où se trouve le Foyer du Territoire, en une seule lecture, ou null si ce
 * Monde n'a pas cette Case (ou si le Territoire n'existe pas). Le Monde se lit depuis le Territoire, jamais depuis
 * ce que le navigateur envoie. US-0429 : sa distance au Foyer se compte par `distance`, la seule formule du jeu.
 * US-0438 : d'une Case que le Territoire n'a pas découverte, seulement sa place et sa distance (FicheInconnue) : ni
 * son Biome, ni son propriétaire, ni sa zone ne quittent le serveur.
 */
export async function ficheDUneCase(base: Pool | PoolClient, territoireId: number, c: Coordonnees): Promise<Fiche | FicheInconnue | null> {
  const { rows } = await base.query<Omit<Fiche, "distance"> & { foyer: Coordonnees; decouverte: boolean }>(
    `select c.q, c.r, coalesce(v.nom, b.nom) as biome, ch.nom as chef, coalesce(ch.id = t.chef_id, false) as "aVous",
       case when c.couronne then ${ZONE_COURONNE} when c.coeur then ${ZONE_COEUR} else 0 end as zone,
       json_build_object('q', f.q, 'r', f.r) as foyer,
       d.case_id is not null as decouverte
     from territoire t join case_du_monde f on f.id = t.foyer_case_id
       join case_du_monde c on c.monde_id = f.monde_id and c.q = $2 and c.r = $3
       join biome b on b.id = c.biome_id left join variante_biome v on v.id = c.variante_id
       left join chef ch on ch.id = c.chef_id
       left join case_decouverte d on d.territoire_id = t.id and d.case_id = c.id
     where t.id = $1`,
    [territoireId, c.q, c.r],
  );
  if (!rows[0]) return null;
  const { foyer, decouverte, ...fiche } = rows[0];
  if (!decouverte) return { q: fiche.q, r: fiche.r, inconnue: true, distance: distance(fiche, foyer) };
  return { ...fiche, distance: distance(fiche, foyer) };
}
