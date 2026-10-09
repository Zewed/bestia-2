// Le rappel d'une Expédition (US-0920) : à l'aller ou en séjour, le joueur la fait rentrer. Elle fait demi-tour
// aussitôt, là où elle en est, et son retour dure le temps d'aller déjà fait (src/expeditions/phase.ts) ; rappelée à
// l'aller, elle ne séjourne pas, ne voit aucune Bête et ne rapporte rien, les Cases déjà révélées le restant ; en séjour,
// elle y met fin (décidé le 2026-10-08). Tout en découle de ses horaires : seul l'instant du rappel s'écrit, et son retour
// au Foyer est déplacé à sa nouvelle heure. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { type HorairesDUneExpedition, phaseDUneExpedition } from "./phase";
import { deplacerLeRetour } from "./retour";

/** US-0920 : un rappel fait, et l'instant du jeu où l'Expédition a fait demi-tour, ou le refus à la place. */
export type Rappel = { rappeleeLe: Date } | { refus: string };

/** US-0920 : les refus d'un rappel : l'Expédition rentre déjà (rappelée ou au bout de son séjour), est rentrée, ou n'est pas du joueur. */
export const RAPPEL_DEJA_AU_RETOUR = "Rappel refusé : l'Expédition est déjà sur le chemin du retour.";
export const RAPPEL_DEJA_RENTREE = "Rappel refusé : l'Expédition est déjà rentrée.";
export const RAPPEL_SANS_EXPEDITION = "Rappel refusé : cette Expédition n'est pas en cours.";

/** Un rappel refusé : rien n'est retenu. */
class Refus extends Error {}

/**
 * US-0920 : rappelle l'Expédition `expeditionId` du Territoire à `instant`, l'heure du jeu : elle fait demi-tour, et son
 * retour au Foyer est déplacé à sa nouvelle heure ; rend l'instant de son rappel, ou le refus. Seule une Expédition du
 * Territoire, en cours, à l'aller ou en séjour, se rappelle ; au retour (rappelée déjà, ou au bout de son séjour), plus.
 *
 * Tout tient dans une transaction qui tient le Territoire, puis l'Expédition : deux rappels envoyés au même instant (un
 * double clic) passent l'un après l'autre, et le second la trouve déjà au retour. Le rappel ne tombe jamais avant
 * l'heure jusqu'où le Territoire est déjà calculé (son marque-page) : ce qui est déjà retenu (Cases levées, Rencontres)
 * l'a été avec les mêmes horaires qu'après le rappel, et le reste se calcule ensuite, en direct comme au rattrapage.
 */
export async function rappelerLExpedition(pool: Pool, territoireId: number, expeditionId: number, instant: Date): Promise<Rappel> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const rappeleeLe = await rappeler(client, territoireId, expeditionId, instant);
    await client.query("commit");
    return { rappeleeLe };
  } catch (erreur) {
    await client.query("rollback").catch(() => {});
    if (erreur instanceof Refus) return { refus: erreur.message };
    throw erreur;
  } finally {
    client.release();
  }
}

/** US-0920 : le rappel, dans la transaction de rappelerLExpedition ; un Refus l'annule. */
async function rappeler(client: PoolClient, territoireId: number, expeditionId: number, instant: Date): Promise<Date> {
  const { rows: territoires } = await client.query<{ calculeJusquA: Date }>(
    `select calcule_jusqu_a as "calculeJusquA" from territoire where id = $1 for no key update`,
    [territoireId],
  );
  const { rows } = await client.query<HorairesDUneExpedition & { rentreeLe: Date | null }>(
    `select x.part_le as "partLe", x.trajet_minutes as "trajetMinutes", x.sejour_minutes as "sejourMinutes", x.rappelee_le as "rappeleeLe",
       x.rentree_le as "rentreeLe"
     from expedition x where x.id = $1 and x.territoire_id = $2
     for no key update`,
    [expeditionId, territoireId],
  );
  if (!territoires[0] || !rows[0]) throw new Refus(RAPPEL_SANS_EXPEDITION);
  const { rentreeLe, ...horaires } = rows[0];
  if (rentreeLe) throw new Refus(RAPPEL_DEJA_RENTREE);
  const calcule = territoires[0].calculeJusquA;
  const rappeleeLe = calcule > instant ? calcule : instant;
  // Sans trajet chiffré (US-0912), elle n'a pas de retour à avancer ; la migration 0050 n'en a laissé aucune.
  if (horaires.trajetMinutes === null) throw new Refus(RAPPEL_SANS_EXPEDITION);
  if (phaseDUneExpedition(horaires, rappeleeLe) === "retour") throw new Refus(RAPPEL_DEJA_AU_RETOUR);
  await client.query("update expedition set rappelee_le = $2 where id = $1", [expeditionId, rappeleeLe]);
  await deplacerLeRetour(client, territoireId, expeditionId, { ...horaires, rappeleeLe });
  return rappeleeLe;
}
