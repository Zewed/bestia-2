// La Famine d'un Territoire (US-0325) : le manque de Nourriture pour payer l'Entretien. Le mécanisme du temps la
// tient à jour (PRODUIRE, src/monde/production.ts), et fait partir des Habitants tant qu'elle dure (US-0326). Côté
// serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";

/**
 * US-0326 : un départ de Famine, noté dans la table evenement comme un événement du Territoire déjà traité à son
 * instant, avec le prénom et le Métier (son nom, null sans Métier) de l'Habitant parti. Il n'est pas programmé : le
 * calcul du temps le trouve en chemin (PRODUIRE) et l'applique aussitôt ; la table en garde la trace, comme des
 * départs de Voyageurs (US-0337).
 */
export const DEPART_DE_FAMINE = "depart_de_famine";

/**
 * US-0326 : l'Habitant du Territoire $1 qui s'en va à l'instant $2 : un sans Métier d'abord, puis le dernier arrivé
 * (le plus grand identifiant : les Habitants sont numérotés à leur arrivée) ; jamais le dernier Habitant. Il est
 * effacé, et son départ noté ($3, le type de l'événement).
 */
const FAIRE_PARTIR = `
  with parti as (
    delete from habitant
    where id = (select id from habitant where territoire_id = $1 order by metier is not null, id desc limit 1)
      and (select count(*) from habitant where territoire_id = $1) > 1
    returning prenom, metier
  )
  insert into evenement (element, element_id, survient_le, type, donnees, traite_le)
  select 'territoire', $1, $2::timestamptz, $3, jsonb_build_object('prenom', parti.prenom, 'metier', m.nom), $2::timestamptz
  from parti left join metier m on m.id = parti.metier
  returning id`;

/**
 * US-0326 : faute de Nourriture, un Habitant quitte le Territoire à l'instant `instant` (en texte, à la microseconde :
 * une heure pile après le début de la Famine, ou après le départ précédent). Le nombre d'Habitants, l'Entretien et
 * les effectifs par Métier baissent aussitôt. Appelée par produire, dans la transaction du temps qui avance.
 */
export async function faireRepartirUnHabitant(client: PoolClient, territoireId: number, instant: string): Promise<void> {
  await client.query(FAIRE_PARTIR, [territoireId, instant, DEPART_DE_FAMINE]);
}

/**
 * US-0325 : depuis combien d'heures de jeu le Territoire est en Famine, à l'instant jusqu'où il est calculé, celui de
 * ses Stocks ; null hors Famine.
 */
export async function famineDepuis(base: Pool | PoolClient, territoireId: number): Promise<number | null> {
  const { rows } = await base.query<{ heures: string | null }>(
    "select extract(epoch from calcule_jusqu_a - famine_depuis) / 3600 as heures from territoire where id = $1",
    [territoireId],
  );
  return rows[0]?.heures == null ? null : Number(rows[0].heures);
}
