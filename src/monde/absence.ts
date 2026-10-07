// US-0216 : ce que le Foyer a produit pendant l'absence du joueur.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { RECAP_ABSENCE_HEURES } from "@/reglages";

/** Ce qu'une Ressource a gagné pendant l'absence, en texte (numeric de Postgres). */
export type GainDAbsence = { id: string; nom: string; gain: string };

/**
 * Ce que le Territoire a produit depuis la dernière visite du joueur, si elle remonte à au moins
 * RECAP_ABSENCE_HEURES heures à l'instant donné, Ressource par Ressource, dans leur ordre ; une
 * Ressource qui n'a pas gagné d'unité entière n'y figure pas. Rien avant la première visite notée.
 */
export async function recapitulatifDAbsence(base: Pool | PoolClient, territoireId: number, instant: Date): Promise<GainDAbsence[]> {
  const { rows } = await base.query<GainDAbsence>(
    `select r.id, r.nom, s.produit_depuis_visite::text as gain
     from territoire t join stock s on s.territoire_id = t.id join ressource r on r.id = s.ressource_id
     where t.id = $1 and t.vu_le <= $2::timestamptz - make_interval(hours => $3) and s.produit_depuis_visite >= 1
     order by r.ordre`,
    [territoireId, instant, RECAP_ABSENCE_HEURES],
  );
  return rows;
}

/**
 * Note la présence du joueur : sa visite date de cet instant, et le compte de ce que le Territoire
 * produit en son absence repart de zéro. À appeler une fois le Territoire mis à l'heure.
 */
export async function noterLaPresence(pool: Pool, territoireId: number, instant: Date): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("update territoire set vu_le = $2 where id = $1", [territoireId, instant]);
    await client.query("update stock set produit_depuis_visite = 0 where territoire_id = $1", [territoireId]);
    await client.query("commit");
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}
