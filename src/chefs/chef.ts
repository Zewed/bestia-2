// Le Chef d'un compte (US-0131) : le nom sous lequel les autres joueurs du Monde le voient.
// Côté serveur uniquement.
import "server-only";
import type { Pool } from "pg";
import { DatabaseError } from "pg";
import { nomInterditPar, type MotInterdit } from "./interdits";
import { cleDuNom, NOM_NON_AUTORISE, nettoyerNom, verifierNomDeChef } from "./nom";

/** Le Monde du jeu : le seul pour l'instant, le premier ouvert. */
const MONDE_DU_JEU = "(select id from monde order by id limit 1)";

/** Le Chef du compte dans le Monde du jeu, ou null tant qu'il n'a pas choisi son nom. */
export async function chefDuCompte(pool: Pool, compteId: number): Promise<{ nom: string } | null> {
  const { rows } = await pool.query<{ nom: string }>(`select nom from chef where compte_id = $1 and monde_id = ${MONDE_DU_JEU}`, [compteId]);
  return rows[0] ?? null;
}

/** Si le nom contient un mot de la liste des mots interdits, lue en base à chaque fois (US-0138). */
export async function nomInterdit(pool: Pool, nom: string): Promise<boolean> {
  const { rows } = await pool.query<MotInterdit>("select mot, entier from mot_interdit");
  return nomInterditPar(nom, rows);
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

export type Enregistrement = { statut: "enregistre"; nom: string } | { statut: "refuse"; erreur: string } | { statut: "pris" };

/**
 * Donne au compte son nom de chef dans le Monde du jeu (US-0137) : la saisie est nettoyée et
 * repasse par toutes les règles, mots interdits compris (US-0138), puis la base tranche. Si deux joueurs veulent le même nom au
 * même instant, un seul l'obtient ; l'autre reçoit « pris ». Un double appui du même joueur n'est
 * pas un conflit : il retrouve le chef créé par le premier.
 */
export async function enregistrerNomDeChef(pool: Pool, compteId: number, saisie: string): Promise<Enregistrement> {
  const nom = nettoyerNom(saisie);
  const erreur = verifierNomDeChef(nom);
  if (erreur) return { statut: "refuse", erreur };
  if (await nomInterdit(pool, nom)) return { statut: "refuse", erreur: NOM_NON_AUTORISE };
  try {
    await pool.query(`insert into chef (compte_id, monde_id, nom, cle_nom) values ($1, ${MONDE_DU_JEU}, $2, $3)`, [compteId, nom, cleDuNom(nom)]);
    return { statut: "enregistre", nom };
  } catch (refus) {
    if (!(refus instanceof DatabaseError) || refus.code !== "23505") throw refus;
    // Le compte a peut-être déjà son chef (double appui) ; sinon, le nom vient d'être pris.
    const chef = await chefDuCompte(pool, compteId);
    if (chef) return { statut: "enregistre", nom: chef.nom };
    if (refus.constraint === "chef_nom_unique_dans_le_monde") return { statut: "pris" };
    throw refus;
  }
}

