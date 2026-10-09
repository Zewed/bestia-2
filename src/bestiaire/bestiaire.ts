// Le Bestiaire d'un Territoire (US-0933) : chaque Espèce que le joueur a croisée, apprivoisée ou dont il a réuni le
// Couple, avec son état, qui ne fait qu'avancer : il ne recule jamais, même quand toutes les Bêtes de l'Espèce meurent,
// puisqu'il ne se déduit ni de l'effectif ni des Rencontres. Toute Espèce vue lors d'une Rencontre s'y inscrit
// « croisée », une seule fois, qu'elle suive l'Expédition ou non : à la première Rencontre, retenue par le mécanisme du
// temps (src/expeditions/rencontres.ts), qui la signale « Nouvelle Espèce au Bestiaire » aux récits (US-0917, US-0940).
// L'Apprivoisement (US-0938) et le Couple réuni (US-0956) la feront avancer par inscrireAuBestiaire. La page Bestiaire
// arrive au jalon 10. Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";

/** US-0933 : l'état d'une Espèce au Bestiaire, du premier au plus haut (etat_au_bestiaire, src/db/schema.ts). */
export type EtatAuBestiaire = "croisee" | "apprivoisee" | "couple_reuni";

/** US-0933 : une Espèce du Bestiaire : son état, et l'instant du jeu où le joueur l'a vue pour la première fois. */
export type EspeceAuBestiaire = { especeId: string; etat: EtatAuBestiaire; croiseeLe: Date };

/** Une Rencontre tout juste retenue, telle que le Bestiaire la lit. */
export type RencontreRetenue = { id: number; especeId: string; vueLe: Date; apparueLe: Date };

/**
 * US-0933 : fait atteindre l'état `etat` à l'Espèce `especeId` au Bestiaire du Territoire, à l'instant du jeu `le`, si
 * elle n'avait pas mieux : un état plus bas ne change rien, l'état ne recule jamais. Une Espèce encore inconnue y entre,
 * croisée à cet instant, inscrite par la Rencontre `rencontreId` s'il y en a une.
 */
export async function inscrireAuBestiaire(
  base: Pool | PoolClient,
  territoireId: number,
  especeId: string,
  etat: EtatAuBestiaire,
  le: Date,
  rencontreId: number | null = null,
): Promise<void> {
  await base.query(
    `insert into bestiaire (territoire_id, espece_id, etat, croisee_le, rencontre_id) values ($1, $2, $3, $4, $5)
     on conflict (territoire_id, espece_id) do update set etat = excluded.etat where excluded.etat > bestiaire.etat`,
    [territoireId, especeId, etat, le, rencontreId],
  );
}

/**
 * US-0933 : inscrit « croisée » au Bestiaire du Territoire l'Espèce de chacune des Rencontres qu'il vient de retenir, si
 * elle n'y était pas encore : à la première Rencontre de l'Espèce, dans l'ordre où elles ont été vues, puis apparues.
 * Revoir une Espèce déjà inscrite ne change rien. Le mécanisme du temps retient les Rencontres dans l'ordre du temps : la
 * même Rencontre inscrit l'Espèce, en direct, au rattrapage ou par la tâche planifiée. Dans la transaction du rattrapage.
 */
export async function inscrireLesEspecesCroisees(base: Pool | PoolClient, territoireId: number, rencontres: RencontreRetenue[]): Promise<void> {
  const premieres = new Map<string, RencontreRetenue>();
  const dansLOrdre = [...rencontres].sort((x, y) => x.vueLe.getTime() - y.vueLe.getTime() || x.apparueLe.getTime() - y.apparueLe.getTime() || x.id - y.id);
  for (const r of dansLOrdre) if (!premieres.has(r.especeId)) premieres.set(r.especeId, r);
  // L'une après l'autre : sur le client d'une transaction, deux requêtes ne partent pas à la fois.
  for (const r of premieres.values()) await inscrireAuBestiaire(base, territoireId, r.especeId, "croisee", r.vueLe, r.id);
}

/** US-0933 : le Bestiaire du Territoire, de la première Espèce croisée à la dernière ; vide tant qu'il n'a rien rencontré. */
export async function bestiaireDuTerritoire(base: Pool | PoolClient, territoireId: number): Promise<EspeceAuBestiaire[]> {
  const { rows } = await base.query<EspeceAuBestiaire>(
    `select espece_id as "especeId", etat, croisee_le as "croiseeLe" from bestiaire where territoire_id = $1 order by croisee_le, espece_id`,
    [territoireId],
  );
  return rows;
}
