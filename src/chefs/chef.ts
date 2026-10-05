// Le Chef d'un compte (US-0131) : le nom sous lequel les autres joueurs du Monde le voient.
// Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";
import { cleDuNom } from "./nom";

/** Le Monde du jeu : le seul pour l'instant, le premier ouvert. */
const MONDE_DU_JEU = "(select id from monde order by id limit 1)";

/** Le Chef du compte dans le Monde du jeu, ou null tant qu'il n'a pas choisi son nom. */
export async function chefDuCompte(pool: Pool, compteId: number): Promise<{ nom: string } | null> {
  const { rows } = await pool.query<{ nom: string }>(`select nom from chef where compte_id = $1 and monde_id = ${MONDE_DU_JEU}`, [compteId]);
  return rows[0] ?? null;
}

/** Si un Chef du Monde du jeu porte déjà ce nom, majuscules, accents et signes mis à part (US-0135). */
export async function nomDejaPris(pool: Pool, nom: string): Promise<boolean> {
  const cle = cleDuNom(nom);
  if (!cle) return false;
  const { rows } = await pool.query<{ pris: boolean }>(
    `select exists (select 1 from chef where monde_id = ${MONDE_DU_JEU} and cle_nom = $1) as pris`,
    [cle],
  );
  return rows[0].pris;
}

