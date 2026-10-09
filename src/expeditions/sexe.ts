// Le sexe d'une Bête apprivoisée (US-0937) : à l'Apprivoisement (src/expeditions/apprivoisement.ts), la Bête qui suit
// l'Expédition est mâle ou femelle au hasard, à chances égales, et ne change plus : il est retenu avec sa Rencontre (table
// rencontre), écrite une seule fois (src/expeditions/rencontres.ts). Comme ses apparitions, il ne dépend que de la graine
// de son Monde, de la Bête et d'un tirage qui lui est propre (sexeTire, sexeDUneBeteDeNaissance), jamais de l'heure qu'il
// est : le même en direct, au rattrapage ou par la tâche planifiée. Seules les Bêtes apprivoisées avant cette story ont
// reçu le leur d'un hachage de leur Rencontre (migration 0058). Tant que le Couple de son Espèce n'est pas réuni,
// l'effectif compte ses mâles et ses femelles (src/monde/effectif.ts) ; l'arrivée au Foyer (US-0938) l'y fera entrer.
// Côté serveur uniquement.
import "server-only";
import type { Pool, PoolClient } from "pg";
import { sexeDUneBeteDeNaissance } from "@/monde/betes-de-naissance";
import { type Sexe, sexeTire } from "@/monde/betes-sauvages";

/**
 * US-0937 : une Bête apprivoisée telle que son sexe se tire : sa Case, et son numéro sur la Case (une Bête sauvage
 * ordinaire) ou sa ligne (une Bête de naissance), l'autre restant null.
 */
export type BeteApprivoisee = { caseId: number; numero: number | null; beteDeNaissanceId: number | null };

/**
 * US-0937 : le sexe de chacune des Bêtes apprivoisées `betes`, dans leur ordre : tiré de la graine du Monde de sa Case,
 * de la place de celle-ci et de son numéro pour une Bête sauvage ordinaire, de la graine et de sa ligne pour une Bête de
 * naissance. Un aller-retour ; aucun sans Bête.
 */
export async function sexesALApprivoisement(base: Pool | PoolClient, betes: readonly BeteApprivoisee[]): Promise<Sexe[]> {
  if (betes.length === 0) return [];
  const { rows } = await base.query<{ id: number; q: number; r: number; graine: string }>(
    "select c.id, c.q, c.r, m.graine from case_du_monde c join monde m on m.id = c.monde_id where c.id = any($1::int[])",
    [[...new Set(betes.map((b) => b.caseId))]],
  );
  const cases = new Map(rows.map((c) => [c.id, { q: c.q, r: c.r, graine: Number(c.graine) }]));
  return betes.map((b) => {
    const laCase = cases.get(b.caseId);
    if (!laCase) throw new Error(`US-0937 : la Case ${b.caseId} de la Bête apprivoisée est introuvable.`);
    return b.numero !== null ? sexeTire(laCase, b.numero) : sexeDUneBeteDeNaissance(laCase.graine, b.beteDeNaissanceId!);
  });
}

/** US-0937 : une Bête qui suit une Expédition : son Espèce, son sexe, et l'instant du jeu de son Apprivoisement. */
export type BeteQuiSuit = { especeId: string; sexe: Sexe; depuis: Date };

/**
 * US-0937 : les Bêtes apprivoisées qui suivent l'Expédition `expeditionId`, chacune avec son sexe, dans l'ordre de leur
 * Apprivoisement. US-0938 les fera entrer dans l'effectif, chacune avec le sien, au retour de l'Expédition.
 */
export async function betesQuiSuivent(base: Pool | PoolClient, expeditionId: number): Promise<BeteQuiSuit[]> {
  const { rows } = await base.query<BeteQuiSuit>(
    `select espece_id as "especeId", sexe, vue_le as depuis from rencontre where expedition_id = $1 and apprivoisee order by vue_le, id`,
    [expeditionId],
  );
  return rows;
}
