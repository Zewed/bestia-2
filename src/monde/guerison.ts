// La guérison des Blessés avec le temps (US-0954) : les Blessés qu'une Expédition ramène au Foyer (US-0951) guérissent
// seuls, GUERISON_DES_BLESSES_HEURES après son retour, la même durée pour toutes les Espèces. Ils redeviennent des Bêtes
// valides sans que rien ne change en base : blessesAuFoyer (src/monde/blesses.ts) cesse de les compter, tout se relit du
// retour. Seul un Récit dit chaque guérison, à son instant : le temps qui avance (src/temps/avancer.ts) l'écrit en
// chemin, page ouverte, à l'ouverture d'une page ou par la tâche planifiée, le joueur absent comme présent, et toujours le
// même. Côté serveur uniquement.
import "server-only";
import type { PoolClient } from "pg";
import { GUERISON_DES_BLESSES_HEURES } from "@/reglages";
import { type GuerisonDUneEspece, recitDeGuerison } from "./recit-de-guerison";
import { ecrireUnRecit } from "./recits";

/**
 * US-0954 : les Blessés du Territoire qui guérissent entre les instants du jeu `depuis` (exclu) et `jusqua` (inclus), ceux
 * des Expéditions rentrées au Foyer GUERISON_DES_BLESSES_HEURES plus tôt, comme blessesAuFoyer les compte : un Récit par
 * instant de guérison, daté de cet instant, dans l'ordre du temps, pour tous les Blessés qui guérissent alors (un ou
 * plusieurs groupes, US-0952), Espèce par Espèce, de la plus commune à la plus rare puis par nom, comme les pertes du récit
 * du retour. Le temps découpé autrement ne change rien : chaque instant de guérison tombe dans un seul de ces intervalles.
 */
export async function guerirLesBlesses(client: PoolClient, territoireId: number, depuis: Date, jusqua: Date): Promise<void> {
  const { rows } = await client.query<GuerisonDUneEspece & { gueriLe: Date }>(
    `select es.nom, sum(s.blessees)::int as nombre, x.rentree_le + $4 * interval '1 hour' as "gueriLe"
     from expedition_escorte s join expedition x on x.id = s.expedition_id
       join espece es on es.id = s.espece_id join rarete r on r.id = es.rarete_id
     where x.territoire_id = $1 and s.blessees > 0
       and x.rentree_le > $2::timestamptz - $4 * interval '1 hour' and x.rentree_le <= $3::timestamptz - $4 * interval '1 hour'
     group by x.rentree_le, es.id, es.nom, r.rang
     order by x.rentree_le, r.rang, es.nom`,
    [territoireId, depuis, jusqua, GUERISON_DES_BLESSES_HEURES],
  );
  const parInstant = new Map<number, GuerisonDUneEspece[]>();
  for (const { gueriLe, ...espece } of rows) parInstant.set(gueriLe.getTime(), [...(parInstant.get(gueriLe.getTime()) ?? []), espece]);
  for (const [instant, especes] of parInstant) await ecrireUnRecit(client, territoireId, recitDeGuerison(especes, new Date(instant)));
}
