// Les Stocks d'un Territoire (US-0201), tels qu'ils sont en base.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { ENTRETIEN_DU_TERRITOIRE, PRODUCTION_DU_TERRITOIRE } from "./production";

/** US-0214 : d'où vient une production : le Foyer et son Biome, ou des Cases d'un Biome. */
export type SourceDeProduction = { libelle: string; parHeure: string };

/**
 * Le Stock d'une Ressource, avec sa famille (US-0205), sa quantité exacte, fractions comprises, ce que
 * le Territoire en produit par heure (US-0212) et d'où cela vient (US-0214), en texte (numeric de Postgres).
 */
export type Stock = {
  id: string;
  nom: string;
  famille: "nourriture" | "materiaux";
  quantite: string;
  /** US-0220 : la limite du Stock, celle qu'utilise le calcul de production. */
  limite: string;
  parHeure: string;
  /** US-0316 : l'Entretien que les Habitants prennent sur ce Stock par heure, au rythme du moment. */
  entretienParHeure: string;
  sources: SourceDeProduction[];
};

/** Les quatre Stocks du Territoire, dans l'ordre des Ressources : Viande, Végétaux, Bois, Pierre. */
export async function stocksDuTerritoire(base: Pool | PoolClient, territoireId: number): Promise<Stock[]> {
  const { rows } = await base.query<Stock>(
    `with entretien as (${ENTRETIEN_DU_TERRITOIRE}),
     -- US-0316 : un Stock de Nourriture est vide quand il ne peut plus payer sa moitié de l'Entretien (voir PRODUIRE).
     nourriture as (
       select s.ressource_id, coalesce(p.par_heure, 0) as p,
         s.quantite * 3600000000 + s.reste + coalesce(p.par_heure, 0) < e.par_heure / 2 as vide
       from stock s join ressource r on r.id = s.ressource_id
         left join (${PRODUCTION_DU_TERRITOIRE}) p on p.ressource_id = s.ressource_id cross join entretien e
       where s.territoire_id = $1 and r.famille = 'nourriture'
     ),
     -- Chacun paie la moitié ; un Stock vide ne donne que sa production, et l'autre paie tout le reste.
     part as (
       select n.ressource_id, case
           when n.vide then n.p
           when autre.vide then e.par_heure - autre.p
           else e.par_heure / 2
         end as par_heure
       from nourriture n join nourriture autre on autre.ressource_id <> n.ressource_id cross join entretien e
     )
     select r.id, r.nom, r.famille, s.quantite, s.limite, coalesce(p.par_heure, 0)::numeric(24, 6)::text as "parHeure",
       coalesce(part.par_heure, 0)::numeric(24, 6)::text as "entretienParHeure",
       coalesce((
         select json_agg(json_build_object(
                  'libelle', case when source.foyer then 'Foyer · ' || lower(source.biome)
                                  else source.cases || case when source.cases > 1 then ' Cases de ' else ' Case de ' end || lower(source.biome) end,
                  'parHeure', source.par_heure::numeric(24, 6)::text)
                order by source.foyer desc, source.biome)
         from (
           select c.id = t.foyer_case_id as foyer, b.nom as biome, count(*) as cases, sum(pb.par_heure) as par_heure
           from territoire t join case_du_monde c on c.chef_id = t.chef_id
             join biome b on b.id = c.biome_id
             join production_biome pb on pb.biome_id = c.biome_id and pb.ressource_id = s.ressource_id
           where t.id = $1
           group by 1, 2
         ) source
       ), '[]') as sources
     from stock s join ressource r on r.id = s.ressource_id
       left join (${PRODUCTION_DU_TERRITOIRE}) p on p.ressource_id = s.ressource_id
       left join part on part.ressource_id = s.ressource_id
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
     update stock set quantite = $3, plein_depuis = case when $3::numeric < stock.limite then null else stock.plein_depuis end from avant
     where stock.territoire_id = $1 and stock.ressource_id = $2
     returning avant.chef, avant.ressource, avant.quantite as avant, stock.quantite as apres`,
    [territoireId, ressourceId, quantite],
  );
  return rows[0] ?? null;
}
