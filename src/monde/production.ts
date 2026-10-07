// La production continue du Territoire (US-0210), appliquée par le mécanisme unique du temps.
import "server-only";
import type { PoolClient } from "pg";

/**
 * Ajoute aux Stocks du Territoire ce que toutes ses Cases produisent, chacune selon son Biome
 * (donnees/biomes.yaml), au prorata du temps écoulé : trente minutes donnent la moitié d'une heure.
 * Le Foyer produit comme une Case ordinaire ; une Ressource que rien ne produit ne bouge pas.
 */
export async function produire(client: PoolClient, territoireId: number, depuis: Date, jusqua: Date): Promise<void> {
  await client.query(
    `update stock s set quantite = s.quantite + p.par_heure * extract(epoch from ($3::timestamptz - $2::timestamptz)) / 3600
     from (
       select pb.ressource_id, sum(pb.par_heure) as par_heure
       from territoire t join case_du_monde c on c.chef_id = t.chef_id
         join production_biome pb on pb.biome_id = c.biome_id
       where t.id = $1
       group by pb.ressource_id
     ) p
     where s.territoire_id = $1 and s.ressource_id = p.ressource_id and p.par_heure > 0`,
    [territoireId, depuis, jusqua],
  );
}
