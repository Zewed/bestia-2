// Le retour au Foyer d'une Expédition (US-0916) : à l'heure prévue, ses explorateurs redeviennent libres, les Bêtes de son
// escorte rentrent dans l'effectif, et elle quitte les Expéditions en cours. C'est un événement daté du Territoire,
// programmé au départ : le mécanisme unique du temps (src/temps/avancer.ts) l'applique à son instant exact, page ouverte,
// à l'ouverture d'une page ou par la tâche planifiée, toujours avec le même résultat. Côté serveur uniquement.
import "server-only";
import type { PoolClient } from "pg";
import { type Evenement, programmerEvenement } from "@/temps/avancer";
import { accueillirLesBetesQuiSuivent } from "./arrivee-au-foyer";
import { type HorairesDUneExpedition, retourDUneExpedition } from "./phase";
import { raconterLeRetour } from "./recit-de-retour";

/** US-0916 : l'événement du retour d'une Expédition au Foyer ; ses données portent son identifiant. */
export const RETOUR_EXPEDITION = "retour_expedition";

/**
 * US-0916 : programme le retour au Foyer de l'Expédition `expeditionId` du Territoire, à l'heure que donnent ses horaires :
 * retourDUneExpedition (src/expeditions/phase.ts), le seul calcul de cette heure. Au départ, dans sa transaction. Sans
 * trajet chiffré (US-0912), aucun : elle reste à l'aller.
 */
export async function programmerLeRetour(client: PoolClient, territoireId: number, expeditionId: number, horaires: HorairesDUneExpedition): Promise<void> {
  const retour = retourDUneExpedition(horaires);
  if (retour) await programmerEvenement(client, "territoire", territoireId, retour, RETOUR_EXPEDITION, { expedition: expeditionId });
}

/**
 * US-0916 : le retour d'une Expédition au Foyer, à son instant : elle est rentrée (expedition.rentree_le) et n'est plus en
 * cours ; ses explorateurs encore là redeviennent libres, et les Bêtes de son escorte, restées comptées dans l'effectif, ne
 * sont plus sorties (src/monde/effectif.ts). Le temps qui avance a mis le Territoire à l'heure du retour avant de
 * l'appliquer : la production et la Famine (US-0921) sont calculées jusque-là sans les explorateurs au Foyer, et avec eux
 * ensuite. Elle n'est pas effacée : la présence sur sa Case (src/expeditions/presence.ts) relit toujours son séjour. Une
 * Expédition déjà rentrée, ou d'un autre Territoire, n'est jamais touchée. US-0917 : un Récit raconte son retour, daté de
 * cet instant (src/expeditions/recit-de-retour.ts) ; une seule fois, comme le retour. US-0938 : les Bêtes apprivoisées qui
 * la suivent arrivent au Foyer avec elle et entrent dans l'effectif (src/expeditions/arrivee-au-foyer.ts) ; une seule
 * fois aussi.
 */
export async function rentrerAuFoyer(client: PoolClient, territoireId: number, evenement: Evenement): Promise<void> {
  const expeditionId = evenement.donnees.expedition;
  if (typeof expeditionId !== "number" || !Number.isInteger(expeditionId)) {
    throw new Error(`Retour d'Expédition sans Expédition valable pour le Territoire ${territoireId}.`);
  }
  const { rowCount } = await client.query("update expedition set rentree_le = $3 where id = $2 and territoire_id = $1 and rentree_le is null", [
    territoireId,
    expeditionId,
    evenement.survientLe,
  ]);
  if (rowCount === 0) return;
  await client.query("update habitant set expedition_id = null where territoire_id = $1 and expedition_id = $2", [territoireId, expeditionId]);
  await accueillirLesBetesQuiSuivent(client, territoireId, expeditionId, evenement.survientLe);
  await raconterLeRetour(client, territoireId, expeditionId, evenement.survientLe);
}
