// Les explorateurs d'un Territoire tels que l'écran d'Expédition les propose. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { type HorairesDUneExpedition, retourDUneExpedition } from "@/expeditions/phase";

/** US-0902 : les explorateurs du Territoire : ceux qui ne sont pas déjà partis, et tous. */
export type Explorateurs = { libres: number; total: number };

/**
 * US-0902 : un explorateur libre, qui n'est pas déjà parti (condition sur `h`, l'Habitant). US-0911 : un explorateur
 * parti porte son Expédition jusqu'à son retour.
 */
const EXPLORATEUR_LIBRE = "h.expedition_id is null";

/**
 * US-0902 : les Habitants au Métier d'explorateur du Territoire, lus à chaque affichage de l'écran d'Expédition :
 * combien sont libres, sur combien. Zéro sur zéro sans aucun explorateur.
 */
export async function explorateursDuTerritoire(base: Pool | PoolClient, territoireId: number): Promise<Explorateurs> {
  const { rows } = await base.query<Explorateurs>(
    `select (count(*) filter (where ${EXPLORATEUR_LIBRE}))::int as libres, count(*)::int as total
     from habitant h
     where h.territoire_id = $1 and h.metier = 'explorateur'`,
    [territoireId],
  );
  return rows[0];
}

/**
 * US-0903 : le prochain retour d'un explorateur parti du Territoire, quand aucun n'est libre ; null si aucun n'est
 * parti. US-0911 : celui de son Expédition, à l'heure que donnent ses horaires : son départ, l'aller, le séjour, qui ne
 * commence qu'à l'arrivée (US-0906), puis le retour, qui dure autant que l'aller (US-0912), escorte comprise. US-0916 :
 * cette heure ne se calcule qu'à un endroit, retourDUneExpedition (src/expeditions/phase.ts), comme le retour lui-même.
 */
export async function prochainRetourDUnExplorateur(base: Pool | PoolClient, territoireId: number): Promise<Date | null> {
  const { rows } = await base.query<HorairesDUneExpedition>(
    `select x.part_le as "partLe", x.trajet_minutes as "trajetMinutes", x.sejour_minutes as "sejourMinutes"
     from expedition x
     where x.territoire_id = $1 and x.rentree_le is null and exists (select 1 from habitant h where h.expedition_id = x.id and h.metier = 'explorateur')`,
    [territoireId],
  );
  const retours = rows.flatMap((horaires) => retourDUneExpedition(horaires) ?? []);
  return retours.length === 0 ? null : new Date(Math.min(...retours.map((retour) => retour.getTime())));
}
