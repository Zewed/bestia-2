// Les Expéditions en cours d'un Territoire (US-0911). Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { type Fiche, type FicheInconnue, ficheDUneCase } from "@/monde/fiche";
import { type HorairesDUneExpedition, type Phase, phaseDUneExpedition } from "./phase";

/** US-0911 : une Expédition en cours : sa destination, telle que le joueur la voit (US-0907), et sa phase. */
export type ExpeditionEnCours = { id: number; destination: Fiche | FicheInconnue; phase: Phase };

/**
 * US-0911 : les Expéditions en cours du Territoire, de la première partie à la dernière, à l'instant du jeu `instant` :
 * chacune avec sa destination, son Biome « inconnu » tant que la Case est sous le brouillard, et sa phase. Une
 * Expédition qui vient de partir est à l'aller.
 */
export async function expeditionsEnCours(base: Pool | PoolClient, territoireId: number, instant: Date): Promise<ExpeditionEnCours[]> {
  const { rows } = await base.query<HorairesDUneExpedition & { id: number; q: number; r: number }>(
    `select x.id, c.q, c.r, x.part_le as "partLe", x.trajet_minutes as "trajetMinutes", x.sejour_minutes as "sejourMinutes"
     from expedition x join case_du_monde c on c.id = x.case_id
     where x.territoire_id = $1
     order by x.part_le, x.id`,
    [territoireId],
  );
  const expeditions: ExpeditionEnCours[] = [];
  for (const { id, q, r, ...horaires } of rows) {
    const destination = await ficheDUneCase(base, territoireId, { q, r });
    if (destination) expeditions.push({ id, destination, phase: phaseDUneExpedition(horaires, instant) });
  }
  return expeditions;
}
