import type { Pool, PoolClient } from "pg";

// Les éléments qui vivent dans le temps, et la table qui garde leur marque-page
// « calculé jusqu'à ». Les Territoires s'ajouteront ici.
const TABLES = { monde: "monde" } as const;

export type ElementSuivi = keyof typeof TABLES;

/** Le calcul d'un intervalle de temps, fait dans la transaction du rattrapage. */
export type Calcul = (client: PoolClient, depuis: Date, jusqua: Date) => Promise<void>;

/** Lit l'instant jusqu'auquel un élément a été calculé. */
export async function lireMarquePage(pool: Pool, element: ElementSuivi, id: number): Promise<Date> {
  const { rows } = await pool.query<{ calcule_jusqu_a: Date }>(
    `select calcule_jusqu_a from ${TABLES[element]} where id = $1`,
    [id],
  );
  if (!rows[0]) throw new Error(`${element} ${id} introuvable.`);
  return rows[0].calcule_jusqu_a;
}

/**
 * Avance un élément de son marque-page jusqu'à `jusqua`, en une seule transaction :
 * la ligne est verrouillée (un rattrapage simultané attend son tour, puis repart du
 * marque-page enregistré), le calcul est fait, puis le marque-page est déplacé.
 * Si le calcul échoue, rien n'est enregistré et le marque-page ne bouge pas.
 * Renvoie l'intervalle calculé, ou null s'il n'y avait rien à rattraper.
 */
export async function avancerMarquePage(
  pool: Pool,
  element: ElementSuivi,
  id: number,
  jusqua: Date,
  calcul: Calcul,
): Promise<{ depuis: Date; jusqua: Date } | null> {
  const table = TABLES[element];
  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query<{ calcule_jusqu_a: Date }>(
      `select calcule_jusqu_a from ${table} where id = $1 for update`,
      [id],
    );
    if (!rows[0]) throw new Error(`${element} ${id} introuvable.`);
    const depuis = rows[0].calcule_jusqu_a;
    if (jusqua.getTime() <= depuis.getTime()) {
      await client.query("commit");
      return null;
    }
    await calcul(client, depuis, jusqua);
    await client.query(`update ${table} set calcule_jusqu_a = $2 where id = $1`, [id, jusqua]);
    await client.query("commit");
    return { depuis, jusqua };
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
