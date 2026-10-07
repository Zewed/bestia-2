// Les Stocks d'un Territoire (US-0201), tels qu'ils sont en base.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { PRODUCTION_DU_TERRITOIRE } from "./production";

/**
 * Le Stock d'une Ressource, avec sa famille (US-0205), sa quantité exacte, fractions comprises, et ce
 * que le Territoire en produit par heure (US-0212), en texte (numeric de Postgres).
 */
export type Stock = { id: string; nom: string; famille: "nourriture" | "materiaux"; quantite: string; parHeure: string };

/** Les quatre Stocks du Territoire, dans l'ordre des Ressources : Viande, Végétaux, Bois, Pierre. */
export async function stocksDuTerritoire(base: Pool | PoolClient, territoireId: number): Promise<Stock[]> {
  const { rows } = await base.query<Stock>(
    `select r.id, r.nom, r.famille, s.quantite, coalesce(p.par_heure, 0)::numeric(24, 6)::text as "parHeure"
     from stock s join ressource r on r.id = s.ressource_id
       left join (${PRODUCTION_DU_TERRITOIRE}) p on p.ressource_id = s.ressource_id
     where s.territoire_id = $1 order by r.ordre`,
    [territoireId],
  );
  return rows;
}

/** US-0208 : un Stock fixé à la main depuis la page de contrôle, avec de quoi le noter dans le journal. */
export type StockFixe = { chef: string; ressource: string; avant: string; apres: string };

/**
 * Fixe la quantité d'un Stock (US-0208) ; la base l'arrondit au millionième et refuse une valeur
 * négative. Rend l'ancienne et la nouvelle quantité, ou null si ce Stock n'existe pas.
 */
export async function fixerStock(base: Pool | PoolClient, territoireId: number, ressourceId: string, quantite: string): Promise<StockFixe | null> {
  const { rows } = await base.query<StockFixe>(
    `with avant as (
       select s.quantite, ch.nom as chef, r.nom as ressource
       from stock s join ressource r on r.id = s.ressource_id
         join territoire t on t.id = s.territoire_id join chef ch on ch.id = t.chef_id
       where s.territoire_id = $1 and s.ressource_id = $2
       for update of s
     )
     update stock set quantite = $3 from avant
     where stock.territoire_id = $1 and stock.ressource_id = $2
     returning avant.chef, avant.ressource, avant.quantite as avant, stock.quantite as apres`,
    [territoireId, ressourceId, quantite],
  );
  return rows[0] ?? null;
}
