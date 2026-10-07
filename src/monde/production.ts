// La production continue du Territoire (US-0210), appliquée par le mécanisme unique du temps.
import "server-only";
import type { PoolClient } from "pg";

/**
 * Ce que le Territoire $1 produit par heure, Ressource par Ressource : la somme de toutes ses Cases,
 * chacune selon son Biome. La même requête sert au calcul et à l'affichage (US-0212).
 */
export const PRODUCTION_DU_TERRITOIRE = `
  select pb.ressource_id, sum(pb.par_heure) as par_heure
  from territoire t join case_du_monde c on c.chef_id = t.chef_id
    join production_biome pb on pb.biome_id = c.biome_id
  where t.id = $1
  group by pb.ressource_id`;

/**
 * US-0219 : l'ajout de la production du Territoire $1 entre les instants $2 et $3, en décimaux exacts.
 * La production d'une Ressource vaut par_heure × durée en microsecondes ÷ 3 600 000 000 ; le Stock
 * reçoit le nombre entier de millionièmes qu'elle contient (div, sans arrondi), et le reste de la
 * division, exact lui aussi, attend le calcul suivant. Mille rattrapages d'une minute donnent donc
 * exactement un rattrapage de mille minutes ; l'arrondi n'intervient qu'à l'affichage.
 */
export const PRODUIRE = `
  with p as (${PRODUCTION_DU_TERRITOIRE}),
  ajout as (
    select s.ressource_id,
      p.par_heure * (extract(epoch from ($3::timestamptz - $2::timestamptz)) * 1000000) + s.reste as total
    from stock s join p on p.ressource_id = s.ressource_id
    where s.territoire_id = $1 and p.par_heure > 0
  )
  update stock s set
    quantite = s.quantite + div(a.total, 3600) / 1000000,
    produit_depuis_visite = s.produit_depuis_visite + div(a.total, 3600) / 1000000,
    reste = a.total - div(a.total, 3600) * 3600
  from ajout a
  where s.territoire_id = $1 and s.ressource_id = a.ressource_id`;

/**
 * Ajoute aux Stocks du Territoire ce que toutes ses Cases produisent, chacune selon son Biome
 * (donnees/biomes.yaml), au prorata du temps écoulé : trente minutes donnent la moitié d'une heure.
 * Le Foyer produit comme une Case ordinaire ; une Ressource que rien ne produit ne bouge pas. Ce qui
 * est produit est aussi compté à part depuis la dernière visite du joueur (US-0216).
 */
export async function produire(client: PoolClient, territoireId: number, depuis: Date, jusqua: Date): Promise<void> {
  await client.query(PRODUIRE, [territoireId, depuis, jusqua]);
}
